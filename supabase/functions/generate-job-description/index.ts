
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from 'https://esm.sh/openai@4.24.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { job_title, department, employment_type, keywords } = await req.json()

        if (!job_title || !department) {
            throw new Error("Missing job_title or department")
        }

        // Mock if no API key
        const apiKey = Deno.env.get('OPENAI_API_KEY')
        if (!apiKey) {
            console.warn("No OPENAI_API_KEY found, returning mock response");
            await new Promise(resolve => setTimeout(resolve, 1500));
            return new Response(JSON.stringify({
                description: `[MOCK AI GENERATED]\n\nRole: ${job_title}\nDepartment: ${department}\n\nWe are seeking a talented ${job_title} to join our ${department} team. This role offers an exciting opportunity to work on cutting-edge projects.\n\nKey Responsibilities:\n- Lead strategic initiatives\n- Collaborate with cross-functional teams\n- Drive innovation and excellence`,
                requirements: `- Bachelor's degree in related field\n- 5+ years of experience\n- Strong problem-solving skills\n- Excellent communication abilities`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert HR recruiter. Generate a professional job description and list of requirements based on the input. Return a JSON object with 'description' and 'requirements' keys. The 'description' should be a couple of paragraphs. The 'requirements' should be a bulleted list string."
                },
                {
                    role: "user",
                    content: `Write a job description for a ${job_title} position in the ${department} department (${employment_type}). Keywords: ${keywords || 'none'}.`
                }
            ],
            model: "gpt-3.5-turbo-1106",
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        const result = JSON.parse(content || '{}');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
