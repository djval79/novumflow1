// Deno type declarations
declare const Deno: any;

// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Inline logger for Supabase Dashboard deployment
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    const logger = createLogger(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    logger.info('Request received');

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { action, ...rest } = await req.json()
        logger.info('Processing action', { action })
        let result

        if (action === 'get_reports') {
            // Aggregate data for reports
            const { data: reviews } = await supabaseClient
                .from('reviews')
                .select('overall_rating, status')
            const { data: goals } = await supabaseClient
                .from('goals')
                .select('status, progress_percentage')
            const { data: kpiValues } = await supabaseClient
                .from('kpi_values')
                .select('value')

            // Rating distribution
            const ratingDistribution = [
                { name: '1.0-2.0', count: reviews?.filter((r: any) => r.overall_rating >= 1 && r.overall_rating < 2).length || 0 },
                { name: '2.1-3.0', count: reviews?.filter((r: any) => r.overall_rating >= 2 && r.overall_rating < 3).length || 0 },
                { name: '3.1-4.0', count: reviews?.filter((r: any) => r.overall_rating >= 3 && r.overall_rating < 4).length || 0 },
                { name: '4.1-5.0', count: reviews?.filter((r: any) => r.overall_rating >= 4 && r.overall_rating <= 5).length || 0 },
            ]

            // Goal status distribution
            const goalStatus = [
                { name: 'Active', value: goals?.filter((g: any) => g.status === 'active').length || 0 },
                { name: 'Completed', value: goals?.filter((g: any) => g.status === 'completed').length || 0 },
                { name: 'At Risk', value: goals?.filter((g: any) => g.status === 'at_risk').length || 0 },
            ]

            const avgKPI = kpiValues && kpiValues.length > 0
                ? kpiValues.reduce((sum: any, kpi: any) => sum + (kpi.value || 0), 0) / kpiValues.length
                : 0

            result = {
                ratingDistribution,
                goalStatus,
                totalReviews: reviews?.length || 0,
                totalGoals: goals?.length || 0,
                avgKPI: Math.round(avgKPI)
            }

        } else if (action === 'list') {
            const { entity, filters } = rest;

            // Simple select without joins to avoid missing table errors
            let query = supabaseClient.from(entity).select('*')

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value)
                })
            }

            const { data, error } = await query
            if (error) throw error
            result = data

        } else if (action === 'generate_sample_data') {
            return await logger.timeAsync('generate_sample_data', async () => {
                // Use Service Role Key to bypass RLS for data generation
                const adminClient = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                )

                // Get employees
                const { data: employees } = await adminClient.from('employees').select('id').limit(5)

                if (!employees || employees.length === 0) {
                    throw new Error('No employees found. Please add employees first.')
                }

                // Create sample reviews
                const reviewPromises = employees.map(async (emp: any, idx: number) => {
                    return adminClient.from('reviews').insert({
                        employee_id: emp.id,
                        review_period_start: '2023-01-01',
                        review_period_end: '2023-12-31',
                        review_due_date: '2024-01-15',
                        status: 'completed',
                        overall_rating: 3 + Math.random() * 2 // 3.0 to 5.0
                    })
                })

                // Create sample goals (3 per employee)
                const goalPromises = employees.flatMap((emp: any) => {
                    return [
                        adminClient.from('goals').insert({
                            employee_id: emp.id,
                            title: 'Quarterly Revenue Target',
                            description: 'Achieve quarterly sales targets',
                            goal_type: 'business',
                            target_date: '2024-03-31',
                            status: ['active', 'completed', 'at_risk'][Math.floor(Math.random() * 3)],
                            progress_percentage: Math.floor(Math.random() * 100),
                            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
                        }),
                        adminClient.from('goals').insert({
                            employee_id: emp.id,
                            title: 'Professional Development',
                            description: 'Complete certification course',
                            goal_type: 'development',
                            target_date: '2024-06-30',
                            status: ['active', 'completed', 'at_risk'][Math.floor(Math.random() * 3)],
                            progress_percentage: Math.floor(Math.random() * 100),
                            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
                        }),
                        adminClient.from('goals').insert({
                            employee_id: emp.id,
                            title: 'Team Collaboration',
                            description: 'Improve cross-team communication',
                            goal_type: 'personal',
                            target_date: '2024-12-31',
                            status: ['active', 'completed', 'at_risk'][Math.floor(Math.random() * 3)],
                            progress_percentage: Math.floor(Math.random() * 100),
                            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
                        })
                    ]
                })

                await Promise.all([...reviewPromises, ...goalPromises])

                // Note: kpi_values intentionally not generated here
                // as they would require kpi_definitions to exist first.
                // The charts mainly use reviews and goals.

                const sampleResult = { success: true, message: 'Sample data generated' }
                logger.info('Sample data generated successfully')
                return new Response(JSON.stringify(sampleResult), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            });

        } else if (action === 'create') {
            // ... implementation for create
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        logger.error('Request failed', error)
        return new Response(JSON.stringify({ error: error?.message || String(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
