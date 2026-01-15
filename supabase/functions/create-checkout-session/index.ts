import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.25.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma",
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const { tierId, tenantId, userEmail } = await req.json()

        // Map internal tier IDs to your specific Stripe Price IDs
        // TODO: Replace these with your actual Stripe Price IDs from your Dashboard.
        const priceMap: Record<string, string> = {
            trial: "price_mock_trial",
            basic: "price_1Sn3k4DNJV8utFweNO9dhmTU",
            professional: "price_1Sn3kADNJV8utFwefEBmVWb8",
            enterprise: "price_1Sn3kGDNJV8utFweGuyNJ5qC"
        };

        const priceId = priceMap[tierId] || priceMap["professional"];

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            customer_email: userEmail,
            metadata: {
                tenant_id: tenantId,
                plan_tier: tierId
            },
            subscription_data: {
                metadata: {
                    tenant_id: tenantId
                }
            },
            success_url: `${req.headers.get("origin")}/dashboard?payment=success`,
            cancel_url: `${req.headers.get("origin")}/tenant/create?payment=cancelled`,
        })

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err: any) {
        console.error("Stripe Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
