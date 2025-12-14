import { supabase } from '@/lib/supabase';
import { EmailService } from './EmailService';
import { InterviewService } from './InterviewService';

export class AutomationService {
    private subscription: any;

    constructor() {
        this.startListening();
    }

    private startListening() {
        if (!supabase) {
            console.warn('⚠️ AutomationService: Supabase client not initialized. Skipping listener.');
            return;
        }

        console.log('Starting Automation Service listener...');
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
                        console.log('New automation log received:', payload);
                        this.processAutomationLog(payload.new);
                    }
                )
                .subscribe();
        } catch (err) {
            console.error('❌ AutomationService: Failed to start listener:', err);
        }
    }

    private async processAutomationLog(log: any) {
        if (!supabase) return;

        const { id, trigger_data } = log;
        const { action_type, action_config, application_id } = trigger_data;

        console.log(`Processing automation ${id}: ${action_type}`);

        try {
            let result;

            // Execute action based on type
            switch (action_type) {
                case 'send_email':
                    // Fetch applicant email if needed, or assume it's passed in trigger_data or we fetch it
                    // For now, let's fetch the application to get the email
                    const { data: app } = await supabase.from('applications').select('applicant_email').eq('id', application_id).single();
                    if (app) {
                        result = await EmailService.sendEmail(app.applicant_email, action_config.subject || 'Update', action_config.template_id, action_config);
                    } else {
                        throw new Error('Application not found');
                    }
                    break;

                case 'schedule_interview':
                    result = await InterviewService.scheduleInterview(application_id, action_config.type, action_config);
                    break;

                case 'ai_interview':
                    result = await InterviewService.startAIInterview(application_id, action_config);
                    break;

                default:
                    console.warn(`Unknown action type: ${action_type}`);
                    result = { skipped: true };
            }

            // Update log status to success
            await supabase
                .from('automation_execution_logs')
                .update({
                    execution_status: 'completed',
                    execution_duration_ms: 0, // We could calculate this
                    error_message: null
                })
                .eq('id', id);

            console.log(`Automation ${id} completed successfully.`);

        } catch (error: any) {
            console.error(`Automation ${id} failed:`, error);

            // Update log status to failed
            await supabase
                .from('automation_execution_logs')
                .update({
                    execution_status: 'failed',
                    error_message: error.message || 'Unknown error'
                })
                .eq('id', id);
        }
    }

    public stopListening() {
        if (this.subscription) {
            supabase.removeChannel(this.subscription);
        }
    }

    public cleanup() {
        this.stopListening();
    }
}

export const automationService = new AutomationService();
