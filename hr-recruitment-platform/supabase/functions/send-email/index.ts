export { }

declare const Deno: any;


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, html, text, templateId, dynamicTemplateData } = await req.json()

        if (!to) {
            throw new Error('Missing required field: to')
        }

        const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
        if (!SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY not configured in Edge Function environment')
        }

        const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@novumflow.com'
        const fromName = Deno.env.get('SENDGRID_FROM_NAME') || 'NovumFlow Team'

        const payload: any = {
            personalizations: [{
                to: [{ email: to }],
                subject: subject || 'Notification from NovumFlow',
            }],
            from: {
                email: fromEmail,
                name: fromName,
            }
        };

        // Handle SendGrid Dynamic Templates
        if (templateId) {
            payload.template_id = templateId;
            if (dynamicTemplateData) {
                payload.personalizations[0].dynamic_template_data = dynamicTemplateData;
            }
        } else {
            // Standard content
            payload.content = [];
            if (html) {
                payload.content.push({ type: 'text/html', value: html });
            } else if (text) {
                payload.content.push({ type: 'text/plain', value: text });
            } else {
                throw new Error('Must provide either html, text, or templateId');
            }
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('SendGrid Error:', errorText);
            throw new Error(`SendGrid API error: ${errorText}`)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
