import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@novumflow.com";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { record } = payload; // Supabase Webhook payload structure

        if (!record) {
            throw new Error("No record found in payload");
        }

        const { email, full_name, company_name, product_interest, created_at } = record;

        const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h1 style="color: #4f46e5; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">🚀 New Demo Request</h1>
        <p style="font-size: 16px; color: #475569;">A new lead has just requested a demo via the landing page.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Name</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${full_name || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Email</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><a href="mailto:${email}" style="color: #4f46e5;">${email}</a></td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Company</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${company_name || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Product Interest</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0; text-transform: capitalize;">${product_interest}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Timestamp</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${new Date(created_at).toLocaleString()}</td>
          </tr>
        </table>

        <div style="margin-top: 30px; text-align: center;">
          <a href="https://niikshfoecitimepiifo.supabase.co/dashboard/project/niikshfoecitimepiifo/editor/table/demo_requests" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View in Database
          </a>
        </div>
        
        <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">
          Sent automatically by NovumFlow Automation Engine.
        </p>
      </div>
    `;

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "NovumFlow Leads <onboarding@resend.dev>",
            to: adminEmail,
            subject: `New Lead: ${full_name || email} (${product_interest})`,
            html: htmlContent,
        });

        if (emailError) {
            console.error("Resend Error:", emailError);
            throw emailError;
        }

        return new Response(JSON.stringify({ success: true, message: "Notification sent" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Function Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
