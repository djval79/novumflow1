import { supabase } from '@/lib/supabase';
import { tenantService } from '@/lib/services/TenantService';

export class EmailService {
    /**
     * Simulates sending an email. In a real application, this would call a backend function (e.g., Supabase Edge Function)
     * which would then use an email provider like SendGrid or AWS SES.
     */
    static async sendEmail(to: string, subject: string, templateId: string, data: any, tenantId?: string) {
        
        const { data: supaData, error } = await supabase.functions.invoke('send-email', {
            body: { to, subject, templateId, data, tenantId}
        });

        if (error) {
            console.error('Error sending confirmation email:', error);
            return { success: false, error };
        }

        return { success: true, data: supaData };
    }
}
