// Deno type declarations
declare const Deno: any;

// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email, name, organizationName } = await req.json()

        if (!email || !name || !organizationName) {
            throw new Error('Missing required fields: email, name, organizationName')
        }

        const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
        if (!SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY not configured')
        }

        const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0891b2;">Welcome to NovumFlow!</h1>
        <p>Hi ${name},</p>
        <p>Congratulations on creating your organization, <strong>${organizationName}</strong>.</p>
        <p>We're excited to help you streamline your HR and recruitment processes.</p>
        <p>Here are a few things you can do to get started:</p>
        <ul>
          <li>Complete your organization profile</li>
          <li>Invite your team members</li>
          <li>Set up your first job posting</li>
        </ul>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best regards,<br>The NovumFlow Team</p>
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
                    to: [{ email }],
                    subject: `Welcome to NovumFlow, ${name}!`,
                }],
                from: {
                    email: Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@novumflow.com',
                    name: Deno.env.get('SENDGRID_FROM_NAME') || 'NovumFlow Team',
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
            status: 400,
        })
    }
})
