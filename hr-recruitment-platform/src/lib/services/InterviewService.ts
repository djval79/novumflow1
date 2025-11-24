import { supabase } from '@/lib/supabase';

export class InterviewService {
    /**
     * Simulates scheduling an interview.
     */
    static async scheduleInterview(applicationId: string, type: string, config: any) {
        console.log(`[InterviewService] Scheduling ${type} interview for app ${applicationId}`);
        console.log(`[InterviewService] Config:`, config);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, we might create a record in the 'interviews' table here
        // checking for availability, etc.

        // Let's actually create a pending interview record if we have the data
        if (applicationId) {
            const { error } = await supabase.from('interviews').insert({
                application_id: applicationId,
                interview_type: type || 'general',
                scheduled_date: new Date(Date.now() + 86400000 * 3).toISOString(), // Schedule for 3 days from now
                status: 'scheduled',
                notes: 'Automatically scheduled via workflow automation'
            });

            if (error) {
                console.error('[InterviewService] Failed to create interview record', error);
                throw error;
            }
        }

        return { success: true, interviewId: `mock-int-${Date.now()}` };
    }

    /**
     * Simulates initiating an AI interview.
     */
    static async startAIInterview(applicationId: string, config: any) {
        console.log(`[InterviewService] Starting AI interview for app ${applicationId}`);

        // Simulate API call to AI interview provider
        await new Promise(resolve => setTimeout(resolve, 2000));

        return { success: true, sessionId: `ai-session-${Date.now()}` };
    }
}
