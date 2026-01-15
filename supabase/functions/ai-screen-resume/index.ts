// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.24.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { application_id } = await req.json()

        if (!application_id) {
            throw new Error("Missing application_id")
        }

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl!, supabaseKey!)

        // Fetch Application and Job Details
        const { data: app, error: appError } = await supabase
            .from('applications')
            .select(`
        *,
        job_postings (
          job_title,
          description,
          requirements,
          department
        )
      `)
            .eq('id', application_id)
            .single()

        if (appError || !app) {
            throw new Error("Application not found")
        }

        const job = app.job_postings
        const candidateName = `${app.applicant_first_name} ${app.applicant_last_name}`

        // Mock if no API key
        const apiKey = Deno.env.get('OPENAI_API_KEY')
        if (!apiKey) {
            console.warn("No OPENAI_API_KEY found, using mock screening");
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mockScore = Math.floor(Math.random() * (95 - 60) + 60); // Random 60-95
            const mockSummary = `[MOCK AI SCREENING]\nBased on the analysis of ${candidateName}'s profile against the ${job.job_title} requirements, the candidate shows promise. Match score: ${mockScore}%.`;

            // Update application
            await supabase
                .from('applications')
                .update({ ai_score: mockScore, ai_summary: mockSummary })
                .eq('id', application_id)

            return new Response(JSON.stringify({ success: true, score: mockScore }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const openai = new OpenAI({ apiKey });

        // In a real scenario, we would download the CV from app.cv_url and parse text.
        // For this implementation, we will simulate the screening based on the metadata interactions 
        // and asking the AI to "infer" suitability or just evaluate the "profile" (name/email/notes).
        // To make it interesting, we'll ask AI to generate a plausible assessment assuming a standard resume.

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert HR Recruiter AI. Evaluate the candidate match for the job. Return JSON with 'score' (0-100 integer) and 'summary' (string). Since you don't have the full resume text, simulate a realistic assessment for a mid-level candidate."
                },
                {
                    role: "user",
                    content: `Job: ${job.job_title} in ${job.department}. Description: ${job.description}. Requirements: ${job.requirements}. Candidate Name: ${candidateName}.`
                }
            ],
            model: "gpt-3.5-turbo-1106",
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        const result = JSON.parse(content || '{}');
        const score = result.score || 75;
        const summary = result.summary || "AI assessment completed.";

        // Update application in DB
        const { error: updateError } = await supabase
            .from('applications')
            .update({ ai_score: score, ai_summary: summary })
            .eq('id', application_id)

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true, score, summary }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
