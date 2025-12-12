import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const { to, subject, data } = await req.json();

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: to,
      subject: subject,
      html: `<html><body><h1>Welcome!</h1><p>Your confirmation code is ${data.confirmationCode}</p></body></html>`,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(emailData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
