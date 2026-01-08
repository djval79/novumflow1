import { supabase } from '@/lib/supabase';
import { EmailService } from './EmailService';
import { InterviewService } from './InterviewService';
import { log } from '@/lib/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

interface AutomationLog {
    id: string;
    trigger_data: {
        action_type: 'send_email' | 'schedule_interview' | 'ai_interview';
        action_config: Record<string, unknown>;
        application_id: string;
    };
    execution_status: 'pending' | 'completed' | 'failed';
    execution_duration_ms?: number;
    error_message?: string;
}

interface AutomationResult {
    success: boolean;
    skipped?: boolean;
    error?: string;
}

// ============================================
// AUTOMATION SERVICE
// ============================================

export class AutomationService {
    private subscription: RealtimeChannel | null = null;

    constructor() {
        this.startListening();
    }

    private startListening(): void {
        if (!supabase) {
            log.warn('AutomationService: Supabase client not initialized', {
                component: 'AutomationService'
            });
            return;
        }

        log.info('Starting Automation Service listener...', {
            component: 'AutomationService'
        });

        try {
            this.subscription = supabase
                .channel('automation_execution_logs_changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'automation_execution_logs',
                        filter: 'execution_status=eq.pending'
                    },
                    (payload) => {
                        log.debug('New automation log received', {
                            component: 'AutomationService',
                            metadata: { logId: (payload.new as AutomationLog).id }
                        });
                        this.processAutomationLog(payload.new as AutomationLog);
                    }
                )
                .subscribe();
        } catch (err) {
            log.error('Failed to start AutomationService listener', err, {
                component: 'AutomationService'
            });
        }
    }

    private async processAutomationLog(logEntry: AutomationLog): Promise<AutomationResult> {
        if (!supabase) {
            return { success: false, error: 'Supabase not initialized' };
        }

        const { id, trigger_data } = logEntry;
        const { action_type, action_config, application_id } = trigger_data;
        const startTime = performance.now();

        log.info(`Processing automation: ${action_type}`, {
            component: 'AutomationService',
            action: action_type,
            metadata: { automationId: id, applicationId: application_id }
        });

        try {
            let result: AutomationResult = { success: false };

            // Execute action based on type
            switch (action_type) {
                case 'send_email': {
                    const { data: app } = await supabase
                        .from('applications')
                        .select('applicant_email')
                        .eq('id', application_id)
                        .single();

                    if (app?.applicant_email) {
                        await EmailService.sendEmail(
                            app.applicant_email,
                            (action_config.subject as string) || 'Update',
                            action_config.template_id as string,
                            action_config
                        );
                        result = { success: true };
                    } else {
                        throw new Error('Application not found or missing email');
                    }
                    break;
                }

                case 'schedule_interview':
                    await InterviewService.scheduleInterview(
                        application_id,
                        action_config.type as string,
                        action_config
                    );
                    result = { success: true };
                    break;

                case 'ai_interview':
                    await InterviewService.startAIInterview(application_id, action_config);
                    result = { success: true };
                    break;

                default:
                    log.warn(`Unknown automation action type: ${action_type}`, {
                        component: 'AutomationService'
                    });
                    result = { success: false, skipped: true };
            }

            const duration = performance.now() - startTime;

            // Update log status to success
            await supabase
                .from('automation_execution_logs')
                .update({
                    execution_status: 'completed',
                    execution_duration_ms: Math.round(duration),
                    error_message: null
                })
                .eq('id', id);

            log.performance(`Automation ${action_type}`, duration, {
                component: 'AutomationService',
                metadata: { automationId: id }
            });

            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            log.error(`Automation failed: ${action_type}`, error, {
                component: 'AutomationService',
                metadata: { automationId: id, applicationId: application_id }
            });

            // Update log status to failed
            await supabase
                .from('automation_execution_logs')
                .update({
                    execution_status: 'failed',
                    error_message: errorMessage
                })
                .eq('id', id);

            return { success: false, error: errorMessage };
        }
    }

    public stopListening(): void {
        if (this.subscription && supabase) {
            supabase.removeChannel(this.subscription);
            this.subscription = null;
            log.info('AutomationService listener stopped', {
                component: 'AutomationService'
            });
        }
    }

    public cleanup(): void {
        this.stopListening();
    }
}

export const automationService = new AutomationService();

