import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface InterviewConfig {
    duration_minutes?: number;
    location?: string;
    interviewers?: string[];
    notes?: string;
    [key: string]: unknown;
}

interface InterviewResult {
    success: boolean;
    interviewId?: string;
    sessionId?: string;
    error?: string;
}

// ============================================
// INTERVIEW SERVICE
// ============================================

export class InterviewService {
    /**
     * Schedule an interview for an application
     */
    static async scheduleInterview(
        applicationId: string,
        type: string,
        config: InterviewConfig
    ): Promise<InterviewResult> {
        log.info(`Scheduling ${type} interview`, {
            component: 'InterviewService',
            action: 'schedule',
            metadata: { applicationId, type }
        });

        const startTime = performance.now();

        try {
            // Simulate network delay for demo purposes
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (applicationId) {
                const scheduledDate = new Date(Date.now() + 86400000 * 3); // 3 days from now

                const { data, error } = await supabase
                    .from('interviews')
                    .insert({
                        application_id: applicationId,
                        interview_type: type || 'general',
                        scheduled_date: scheduledDate.toISOString(),
                        status: 'scheduled',
                        notes: config.notes || 'Automatically scheduled via workflow automation',
                        duration_minutes: config.duration_minutes || 60,
                        location: config.location
                    })
                    .select('id')
                    .single();

                if (error) {
                    log.error('Failed to create interview record', error, {
                        component: 'InterviewService',
                        metadata: { applicationId }
                    });
                    throw error;
                }

                const duration = performance.now() - startTime;
                log.performance('Schedule interview', duration, {
                    component: 'InterviewService'
                });

                log.track('interview_scheduled', {
                    component: 'InterviewService',
                    metadata: { applicationId, type, interviewId: data?.id }
                });

                return {
                    success: true,
                    interviewId: data?.id || `int-${Date.now()}`
                };
            }

            return { success: false, error: 'No application ID provided' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            log.error('Interview scheduling failed', error, {
                component: 'InterviewService',
                metadata: { applicationId, type }
            });
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Start an AI-powered interview session
     */
    static async startAIInterview(
        applicationId: string,
        config: InterviewConfig
    ): Promise<InterviewResult> {
        log.info('Starting AI interview', {
            component: 'InterviewService',
            action: 'ai_interview',
            metadata: { applicationId }
        });

        const startTime = performance.now();

        try {
            // Simulate API call to AI interview provider
            await new Promise(resolve => setTimeout(resolve, 2000));

            const sessionId = `ai-session-${Date.now()}`;

            const duration = performance.now() - startTime;
            log.performance('Start AI interview', duration, {
                component: 'InterviewService'
            });

            log.track('ai_interview_started', {
                component: 'InterviewService',
                metadata: { applicationId, sessionId }
            });

            return { success: true, sessionId };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            log.error('AI interview start failed', error, {
                component: 'InterviewService',
                metadata: { applicationId }
            });
            return { success: false, error: errorMessage };
        }
    }
}

