// @ts-nocheck
declare const Deno: any;
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.13.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry function with exponential backoff
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 2000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const isRateLimited = error.message?.includes('429') ||
                error.message?.includes('quota') ||
                error.message?.includes('Too Many Requests');

            if (!isRateLimited || attempt === maxRetries - 1) {
                throw error;
            }

            const delayMs = baseDelayMs * Math.pow(2, attempt);
            console.log(`Rate limited. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    throw lastError;
}

Deno.serve(async (req: Request) => {
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

        // 2. Fetch resume content (Multimodal handling for PDFs/Images)
        let resumePart: any = null;
        let resumeText = '';

        if (application.cv_url) {
            try {
                const isPdf = application.cv_url.toLowerCase().endsWith('.pdf');
                const isImage = /\.(jpg|jpeg|png|webp)$/i.test(application.cv_url);

                if (application.cv_url.startsWith('http')) {
                    console.log('Fetching resume from URL:', application.cv_url);
                    const res = await fetch(application.cv_url);
                    if (res.ok) {
                        if (isPdf || isImage) {
                            const blob = await res.blob();
                            const buffer = await blob.arrayBuffer();
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                            resumePart = {
                                inlineData: {
                                    data: base64,
                                    mimeType: isPdf ? 'application/pdf' : blob.type
                                }
                            };
                        } else {
                            resumeText = await res.text();
                        }
                    }
                } else {
                    console.log('Downloading resume from storage:', application.cv_url);
                    const { data: resumeFile, error: resumeError } = await supabase.storage
                        .from('applicant-cvs') // Re-check bucket name
                        .download(application.cv_url);

                    if (!resumeError && resumeFile) {
                        if (isPdf || isImage) {
                            const buffer = await resumeFile.arrayBuffer();
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                            resumePart = {
                                inlineData: {
                                    data: base64,
                                    mimeType: isPdf ? 'application/pdf' : resumeFile.type
                                }
                            };
                        } else {
                            resumeText = await resumeFile.text();
                        }
                    }
                }
            } catch (e) {
                console.error('Error fetching resume:', e);
            }
        }

        // 3. Construct prompt for LLM
        const promptText = `
            Please act as an expert recruitment consultant.
            Analyze the provided resume against the following job description.
            
            **Job Description:**
            ${application.job_postings?.description || 'No job description provided.'}

            **Instructions:**
            1. If a document (PDF/Image) is provided, read and analyze it thoroughly.
            2. If only text is provided, use that.
            3. Provide a suitability score from 1 to 100.
            4. Provide a brief summary of the candidate's strengths and weaknesses relative to the role.
            5. If the content is unreadable or missing, return a score of 0.

            **Output Format (JSON):**
            {
                "score": <number>,
                "summary": "<string>"
            }
            RETURN ONLY JSON.
        `;

        // 4. Call Google Generative AI API (Gemini) with retry logic
        const genAI = new GoogleGenerativeAI(googleApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use 1.5-flash for multimodal

        let aiResponse: { score: number; summary: string };

        try {
            const result = await retryWithBackoff(async () => {
                const parts = [promptText];
                if (resumePart) parts.push(resumePart);
                else if (resumeText) parts.push(resumeText);

                return await model.generateContent(parts);
            }, 3, 2000);

            const response = await result.response;
            const text = await response.text();

            console.log('Gemini response:', text);

            // Clean up JSON
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            aiResponse = JSON.parse(jsonString);
        } catch (aiError: any) {
            console.error('AI API error:', aiError);

            // Check if it's a quota error
            const isQuotaError = aiError.message?.includes('429') ||
                aiError.message?.includes('quota') ||
                aiError.message?.includes('Too Many Requests');

            if (isQuotaError) {
                return new Response(JSON.stringify({
                    error: 'AI service quota exceeded. Please try again later or contact your administrator to upgrade the API plan.',
                    quota_exceeded: true,
                    retry_suggested: true
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            throw aiError;
        }

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
