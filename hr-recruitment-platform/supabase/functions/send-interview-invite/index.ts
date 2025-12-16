export { }
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            candidateName,
            candidateEmail,
            interviewType,
            scheduledDate,
            scheduledTime,
            duration,
            location,
            notes
        } = await req.json()

        if (!candidateEmail || !candidateName || !scheduledDate) {
            throw new Error('Missing required fields')
        }

        const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
        if (!SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY not configured')
        }

        const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h1 style="color: #4f46e5;">Interview Invitation</h1>
                <p>Dear ${candidateName},</p>
                <p>We are pleased to invite you to an interview for the position at NovumFlow.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Details</h3>
                    <p><strong>Type:</strong> ${interviewType.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${scheduledTime}</p>
                    <p><strong>Duration:</strong> ${duration} minutes</p>
                    <p><strong>Location/Link:</strong> ${location}</p>
                </div>

                ${notes ? `<p><strong>Note from Interviewer:</strong><br>${notes}</p>` : ''}

                <p>Please confirm your attendance by replying to this email.</p>
                
                <p>Best regards,<br>Recruitment Team</p>
            </div>
        `

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: candidateEmail, name: candidateName }],
                    subject: `Interview Invitation - NovumFlow`,
                }],
                from: {
                    email: Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@novumflow.com',
                    name: Deno.env.get('SENDGRID_FROM_NAME') || 'NovumFlow Recruitment',
                },
                content: [{
                    type: 'text/html',
                    value: emailHtml,
                }],
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`SendGrid API error: ${errorText}`)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400, // Return 400 for client to handle
        })
    }
})
