// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface WebhookDelivery {
    id: string;
    webhook_id: string;
    tenant_id: string;
    event_type: string;
    payload: any;
    status: string;
    attempt_count: number;
    next_retry_at: string | null;
}

interface Webhook {
    id: string;
    url: string;
    secret: string | null;
    is_active: boolean;
}

/**
 * Process Webhooks Edge Function
 * 
 * This function polls the webhook_deliveries table for pending deliveries
 * and sends them to the configured webhook URLs.
 * 
 * Can be triggered:
 * 1. Via cron job (e.g., every minute)
 * 2. Via manual POST request
 * 3. Via Supabase pg_cron or pg_net
 */
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client with service role
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Fetch pending webhook deliveries (max 50 per run)
        const { data: deliveries, error: fetchError } = await supabase
            .from('webhook_deliveries')
            .select(`
                id,
                webhook_id,
                tenant_id,
                event_type,
                payload,
                status,
                attempt_count,
                next_retry_at,
                webhooks!inner (
                    id,
                    url,
                    secret,
                    is_active
                )
            `)
            .eq('status', 'pending')
            .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
            .limit(50)

        if (fetchError) {
            throw new Error(`Failed to fetch deliveries: ${fetchError.message}`)
        }

        if (!deliveries || deliveries.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                message: 'No pending deliveries',
                processed: 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const results: { id: string; status: string; error?: string }[] = []

        // Process each delivery
        for (const delivery of deliveries) {
            const webhook = (delivery as any).webhooks as Webhook

            // Skip if webhook is inactive
            if (!webhook?.is_active) {
                await supabase
                    .from('webhook_deliveries')
                    .update({
                        status: 'skipped',
                        response_body: 'Webhook is inactive'
                    })
                    .eq('id', delivery.id)

                results.push({ id: delivery.id, status: 'skipped' })
                continue
            }

            try {
                // Prepare headers
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NovumFlow-Webhook/1.0',
                    'X-Webhook-Event': delivery.event_type,
                    'X-Webhook-Delivery-Id': delivery.id,
                }

                // Sign payload if secret is configured
                if (webhook.secret) {
                    const encoder = new TextEncoder()
                    const payloadString = JSON.stringify(delivery.payload)
                    const hmac = createHmac('sha256', webhook.secret)
                    hmac.update(payloadString)
                    const signature = hmac.toString()
                    headers['X-Webhook-Signature-256'] = `sha256=${signature}`
                }

                // Send webhook
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(delivery.payload),
                })

                const responseBody = await response.text().catch(() => '')
                const attemptCount = (delivery.attempt_count || 0) + 1

                if (response.ok) {
                    // Success
                    await supabase
                        .from('webhook_deliveries')
                        .update({
                            status: 'success',
                            response_code: response.status,
                            response_body: responseBody.substring(0, 1000), // Limit stored response
                            attempt_count: attemptCount,
                        })
                        .eq('id', delivery.id)

                    results.push({ id: delivery.id, status: 'success' })
                } else {
                    // Failed, schedule retry if under max attempts
                    const maxAttempts = 5
                    const newStatus = attemptCount >= maxAttempts ? 'failed' : 'pending'

                    // Exponential backoff: 1min, 5min, 15min, 1hr, 4hr
                    const retryDelays = [60, 300, 900, 3600, 14400]
                    const nextRetrySeconds = retryDelays[Math.min(attemptCount - 1, retryDelays.length - 1)]
                    const nextRetryAt = new Date(Date.now() + nextRetrySeconds * 1000).toISOString()

                    await supabase
                        .from('webhook_deliveries')
                        .update({
                            status: newStatus,
                            response_code: response.status,
                            response_body: responseBody.substring(0, 1000),
                            attempt_count: attemptCount,
                            next_retry_at: newStatus === 'pending' ? nextRetryAt : null,
                        })
                        .eq('id', delivery.id)

                    results.push({
                        id: delivery.id,
                        status: newStatus,
                        error: `HTTP ${response.status}`
                    })
                }
            } catch (error: any) {
                // Network error or other failure
                const attemptCount = (delivery.attempt_count || 0) + 1
                const maxAttempts = 5
                const newStatus = attemptCount >= maxAttempts ? 'failed' : 'pending'

                const retryDelays = [60, 300, 900, 3600, 14400]
                const nextRetrySeconds = retryDelays[Math.min(attemptCount - 1, retryDelays.length - 1)]
                const nextRetryAt = new Date(Date.now() + nextRetrySeconds * 1000).toISOString()

                await supabase
                    .from('webhook_deliveries')
                    .update({
                        status: newStatus,
                        response_body: error.message?.substring(0, 1000) || 'Unknown error',
                        attempt_count: attemptCount,
                        next_retry_at: newStatus === 'pending' ? nextRetryAt : null,
                    })
                    .eq('id', delivery.id)

                results.push({
                    id: delivery.id,
                    status: newStatus,
                    error: error.message
                })
            }
        }

        // Summary
        const successCount = results.filter(r => r.status === 'success').length
        const failedCount = results.filter(r => r.status === 'failed').length
        const pendingCount = results.filter(r => r.status === 'pending').length
        const skippedCount = results.filter(r => r.status === 'skipped').length

        return new Response(JSON.stringify({
            success: true,
            processed: results.length,
            summary: {
                success: successCount,
                failed: failedCount,
                pending: pendingCount,
                skipped: skippedCount,
            },
            results,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Webhook processor error:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
