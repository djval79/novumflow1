// Deno type declarations
declare const Deno: any;

// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Inline logger for deployment
interface LogContext {
    correlationId?: string;
    [key: string]: any;
}

class Logger {
    private context: LogContext;

    constructor(context: LogContext = {}) {
        this.context = {
            ...context,
            correlationId: context.correlationId || crypto.randomUUID(),
        };
    }

    private formatMessage(level: string, message: string, data?: any) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...this.context,
            ...(data && { data }),
        };
        return JSON.stringify(logEntry);
    }

    info(message: string, data?: any) {
        console.log(this.formatMessage('INFO', message, data));
    }

    error(message: string, error?: any, data?: any) {
        console.error(
            this.formatMessage('ERROR', message, {
                error: error?.message || String(error),
                stack: error?.stack,
                ...data,
            })
        );
    }

    async timeAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
        const startTime = performance.now();
        this.info(`Starting: ${operation}`);

        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            this.info(`Completed: ${operation}`, { durationMs: duration.toFixed(2) });
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.error(`Failed: ${operation}`, error, { durationMs: duration.toFixed(2) });
            throw error;
        }
    }
}

function createLogger(req: Request): Logger {
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
    return new Logger({
        correlationId,
        method: req.method,
        url: req.url,
    });
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control, pragma, expires, x-requested-with',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
}

// Integration service functions
async function sendSlackMessage(config: any, logger: Logger) {
    const { channel, text, blocks } = config;
    const SLACK_BOT_TOKEN = Deno.env.get('SLACK_BOT_TOKEN');

    if (!SLACK_BOT_TOKEN) {
        throw new Error('SLACK_BOT_TOKEN not configured');
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            channel,
            text,
            blocks: blocks || undefined,
        }),
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
}

async function createZoomMeeting(config: any, logger: Logger) {
    const { topic, start_time, duration, agenda } = config;
    const ZOOM_ACCESS_TOKEN = Deno.env.get('ZOOM_ACCESS_TOKEN');

    if (!ZOOM_ACCESS_TOKEN) {
        throw new Error('ZOOM_ACCESS_TOKEN not configured');
    }

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ZOOM_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            topic,
            type: 2, // Scheduled meeting
            start_time,
            duration: duration || 60,
            agenda: agenda || '',
            settings: {
                join_before_host: true,
                mute_upon_entry: true,
                waiting_room: false,
            },
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Zoom API error: ${data.message || 'Unknown error'}`);
    }

    return {
        meeting_id: data.id,
        join_url: data.join_url,
        start_url: data.start_url,
        password: data.password,
    };
}

async function sendEmail(config: any, logger: Logger) {
    const { to, subject, html, text, template_id, template_data } = config;
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

    if (!SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY not configured');
    }

    let requestBody: any;

    if (template_id) {
        // Using dynamic template
        requestBody = {
            personalizations: [{
                to: Array.isArray(to) ? to : [{ email: to }],
                dynamic_template_data: template_data || {},
            }],
            from: {
                email: Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@example.com',
                name: Deno.env.get('SENDGRID_FROM_NAME') || 'HR Team',
            },
            template_id,
        };
    } else {
        // Using plain email
        requestBody = {
            personalizations: [{
                to: Array.isArray(to) ? to : [{ email: to }],
                subject,
            }],
            from: {
                email: Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@example.com',
                name: Deno.env.get('SENDGRID_FROM_NAME') || 'HR Team',
            },
            content: [
                ...(html ? [{ type: 'text/html', value: html }] : []),
                ...(text ? [{ type: 'text/plain', value: text }] : []),
            ],
        };
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`SendGrid API error: ${errorData}`);
    }

    return { message_id: response.headers.get('x-message-id'), status: 'sent' };
}

// Template variable replacement
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        result = result.replace(regex, String(value));
    }
    return result;
}

serve(async (req: Request) => {
    const logger = createLogger(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    logger.info('Integration request received');

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, ...params } = await req.json()
        logger.info('Processing integration action', { action })

        const startTime = performance.now();
        let result: any;
        let integrationId: string | null = null;

        // Determine service name
        let serviceName = '';
        if (action.startsWith('slack_')) serviceName = 'slack';
        else if (action.startsWith('zoom_')) serviceName = 'zoom';
        else if (action.startsWith('email_')) serviceName = 'email';
        else if (action.startsWith('calendar_')) serviceName = 'calendar';

        // Get integration config if needed
        if (serviceName) {
            const { data: integration } = await supabaseClient
                .from('integrations')
                .select('*')
                .eq('service_name', serviceName)
                .eq('is_active', true)
                .single();

            if (integration) {
                integrationId = integration.id;
            }
        }

        // Route to appropriate service
        try {
            switch (action) {
                case 'slack_send_message':
                    result = await sendSlackMessage(params, logger);
                    break;

                case 'zoom_create_meeting':
                    result = await createZoomMeeting(params, logger);
                    break;

                case 'email_send':
                    result = await sendEmail(params, logger);
                    break;

                case 'email_send_template': {
                    // Get template from database
                    const { data: template } = await supabaseClient
                        .from('email_templates')
                        .select('*')
                        .eq('template_name', params.template_name)
                        .eq('is_active', true)
                        .single();

                    if (!template) {
                        throw new Error(`Template not found: ${params.template_name}`);
                    }

                    // Replace variables
                    const subject = replaceTemplateVariables(template.subject, params.variables || {});
                    const html = replaceTemplateVariables(template.body_html, params.variables || {});
                    const text = template.body_text ? replaceTemplateVariables(template.body_text, params.variables || {}) : undefined;

                    result = await sendEmail({
                        to: params.to,
                        subject,
                        html,
                        text,
                    }, logger);
                    break;
                }

                case 'list_integrations': {
                    const { data: integrations } = await supabaseClient
                        .from('integrations')
                        .select('id, service_name, display_name, is_active, is_connected, last_sync_at');
                    result = integrations;
                    break;
                }

                case 'check_connection': {
                    const { service_name } = params;
                    let isConnected = false;
                    let message = '';

                    if (service_name === 'slack') {
                        isConnected = !!Deno.env.get('SLACK_BOT_TOKEN');
                        message = isConnected ? 'Slack token found' : 'SLACK_BOT_TOKEN not set';
                    } else if (service_name === 'email') {
                        isConnected = !!Deno.env.get('SENDGRID_API_KEY');
                        message = isConnected ? 'SendGrid API key found' : 'SENDGRID_API_KEY not set';
                    } else if (service_name === 'zoom') {
                        isConnected = !!Deno.env.get('ZOOM_ACCESS_TOKEN');
                        message = isConnected ? 'Zoom token found' : 'ZOOM_ACCESS_TOKEN not set';
                    } else {
                        // For others, assume connected if active (or implement specific checks)
                        isConnected = true;
                        message = 'Service enabled';
                    }

                    if (isConnected) {
                        // Update database
                        await supabaseClient
                            .from('integrations')
                            .update({ is_connected: true, last_sync_at: new Date().toISOString() })
                            .eq('service_name', service_name);
                    }

                    result = { connected: isConnected, message };
                    break;
                }

                case 'get_integration_logs': {
                    const { limit = 50, service_name } = params;
                    let logsQuery = supabaseClient
                        .from('integration_logs')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(limit);

                    if (service_name) {
                        logsQuery = logsQuery.eq('service_name', service_name);
                    }

                    const { data: logs } = await logsQuery;
                    result = logs;
                    break;
                }

                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            const duration = performance.now() - startTime;

            // Log successful integration activity
            if (integrationId && serviceName) {
                await supabaseClient.from('integration_logs').insert({
                    integration_id: integrationId,
                    service_name: serviceName,
                    action,
                    status: 'success',
                    request_data: params,
                    response_data: result,
                    duration_ms: duration,
                    triggered_by: params.triggered_by || null,
                    related_entity_type: params.related_entity_type || null,
                    related_entity_id: params.related_entity_id || null,
                });
            }

            logger.info('Integration action completed', { action, durationMs: duration.toFixed(2) });

            return new Response(JSON.stringify({ success: true, data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });

        } catch (integrationError: any) {
            const duration = performance.now() - startTime;

            // Log failed integration activity
            if (integrationId && serviceName) {
                await supabaseClient.from('integration_logs').insert({
                    integration_id: integrationId,
                    service_name: serviceName,
                    action,
                    status: 'failed',
                    request_data: params,
                    error_message: integrationError?.message || String(integrationError),
                    duration_ms: duration,
                    triggered_by: params.triggered_by || null,
                    related_entity_type: params.related_entity_type || null,
                    related_entity_id: params.related_entity_id || null,
                });
            }

            throw integrationError;
        }

    } catch (error: any) {
        logger.error('Integration request failed', error)
        return new Response(JSON.stringify({
            success: false,
            error: error?.message || String(error)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
