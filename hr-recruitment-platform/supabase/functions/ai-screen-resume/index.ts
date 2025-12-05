import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.13.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const googleApiKey = Deno.env.get('GOOGLE_API_KEY')!;

        const { application_id } = await req.json();

        if (!application_id) {
            throw new Error('application_id is required');
        }

        // 1. Fetch application data
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select('*, job_postings(*)')
            .eq('id', application_id)
            .single();

        if (appError || !application) {
            throw new Error(`Application not found: ${appError?.message}`);
        }

        // 2. Fetch resume content
        let resumeText = '';
        if (application.cv_url) {
            try {
                if (application.cv_url.startsWith('http')) {
                    // It's a full URL
                    console.log('Fetching resume from URL:', application.cv_url);
                    const res = await fetch(application.cv_url);
                    if (res.ok) {
                        resumeText = await res.text();
                    } else {
                        console.error('Failed to fetch resume URL:', res.statusText);
                    }
                } else {
                    // It's a storage path
                    console.log('Downloading resume from storage:', application.cv_url);
                    const { data: resumeFile, error: resumeError } = await supabase.storage
                        .from('documents')
                        .download(application.cv_url);

                    if (!resumeError && resumeFile) {
                        resumeText = await resumeFile.text();
                    } else {
                        console.error('Failed to download resume:', resumeError);
                    }
                }
            } catch (e) {
                console.error('Error fetching resume:', e);
                // Continue without resume text if it fails, just use job desc
            }
        }

        // 3. Construct prompt for LLM
        const prompt = `
            Please act as an expert recruitment consultant.
            Analyze the following resume against the provided job description.
            Provide a suitability score from 1 to 100, and a brief summary of the candidate's strengths and weaknesses.
            
            If the resume content is missing or unreadable, please evaluate based on any available candidate info or return a score of 0 with a note.

            **Job Description:**
            ${application.job_postings?.description || 'No job description provided.'}

            **Candidate's Resume Content:**
            ${resumeText.substring(0, 10000) || 'No resume content available.'}

            **Output Format (JSON):**
            {
                "score": <score_number>,
                "summary": "<summary_text>"
            }
            RETURN ONLY JSON. DO NOT USE MARKDOWN BLOCK.
        `;

        // 4. Call Google Generative AI API (Gemini)
        const genAI = new GoogleGenerativeAI(googleApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        console.log('Gemini response:', text);

        // Clean up JSON (remove markdown code blocks if present)
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(jsonString);

        // 5. Update application with AI score and summary
        const { data: updatedApplication, error: updateError } = await supabase
            .from('applications')
            .update({
                ai_score: aiResponse.score,
                ai_summary: aiResponse.summary,
            })
            .eq('id', application_id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return new Response(JSON.stringify({ success: true, data: updatedApplication }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Edge function error:', error);
        // Return 200 so client sees the error message in data
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
