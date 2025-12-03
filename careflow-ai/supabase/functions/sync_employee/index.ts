
import { verifySignature } from "./security.ts";
import { addToDeadLetterQueue } from "./dead_letter_queue.ts";
import { handleSync } from "./handler.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-novumflow-signature",
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Verify Signature
        const isSignatureValid = await verifySignature(req);
        if (!isSignatureValid) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid signature" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
            );
        }

        // 2. Parse Payload
        const payload = await req.json();

        // 3. Process the sync
        const result = await handleSync(payload);

        return new Response(
            JSON.stringify({ success: true, ...result }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Sync error:", error);
        await addToDeadLetterQueue(req.json(), error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
