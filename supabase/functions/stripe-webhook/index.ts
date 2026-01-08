import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.25.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""

serve(async (req) => {
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
        return new Response("Missing signature", { status: 400 })
    }

    let event;
    try {
        const body = await req.text()
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log(`🔔 Received event: ${event.type}`)

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object
            const tenantId = session.metadata?.tenant_id
            const planTier = session.metadata?.plan_tier

            // Get subscription details if present
            const subscriptionId = typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id;

            const customerId = typeof session.customer === 'string'
                ? session.customer
                : session.customer?.id;

            if (tenantId) {
                console.log(`✅ Updating tenant ${tenantId} to tier ${planTier}`)

                const { error } = await supabase
                    .from("tenants")
                    .update({
                        subscription_tier: planTier || 'professional',
                        subscription_status: "active",
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", tenantId)

                if (error) {
                    throw new Error(`Error updating tenant: ${error.message}`)
                }
            }
        } else if (event.type === "customer.subscription.deleted") {
            // Handle cancellation
            const subscription = event.data.object;
            const customerId = subscription.customer;

            // Find tenant by customer ID
            await supabase
                .from("tenants")
                .update({ subscription_status: 'canceled' })
                .eq("stripe_customer_id", customerId);
        }

    } catch (err) {
        console.error(`❌ Webhook handler error: ${err.message}`)
        return new Response("Database error", { status: 500 })
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    })
})
