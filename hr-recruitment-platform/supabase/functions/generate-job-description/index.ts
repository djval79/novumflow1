
// @ts-nocheck
declare const Deno: any;
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.13.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const googleApiKey = Deno.env.get('GOOGLE_API_KEY')!;
        if (!googleApiKey) {
            throw new Error('Missing GOOGLE_API_KEY environment variable');
        }

        const { job_title, department, employment_type } = await req.json();

        if (!job_title || !department) {
            throw new Error('job_title and department are required');
        }

        const promptText = `
            Act as an expert HR Recruiter.
            Write a professional job description and a list of requirements for the following role:

            **Role Details:**
            - Job Title: ${job_title}
            - Department: ${department}
            - Employment Type: ${employment_type || 'Full Time'}

            **Instructions:**
            1. Write a compelling, inclusive, and professional "Description" (2-3 paragraphs).
            2. Write a list of 5-8 bullet points for "Requirements" (technical skills, soft skills, experience).
            3. Use a tone that is professional yet inviting.

            **Output Format (JSON):**
            {
                "description": "<string>",
                "requirements": "<string (bullet points separated by newlines)>"
            }
            RETURN ONLY JSON.
        `;

        const genAI = new GoogleGenerativeAI(googleApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = await response.text();

        // Clean up JSON
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let aiResponse;
        try {
            aiResponse = JSON.parse(jsonString);
        } catch (e) {
            console.error('Failed to parse AI response:', text);
            throw new Error('AI returned invalid format');
        }

        return new Response(JSON.stringify(aiResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Error in generate-job-description:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
