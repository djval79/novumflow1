import { supabase } from '@/lib/supabase';
import { tenantService } from '@/lib/services/TenantService';
import { log } from '@/lib/logger';

interface EmailData {
    [key: string]: unknown;
}

interface EmailResult {
    success: boolean;
    data?: unknown;
    error?: unknown;
}

export class EmailService {
    /**
     * Send an email using Supabase Edge Function.
     * In production, this calls a backend function which uses SendGrid or AWS SES.
     */
    static async sendEmail(
        to: string,
        subject: string,
        templateId: string,
        data: EmailData,
        tenantId?: string
    ): Promise<EmailResult> {

        const { data: supaData, error } = await supabase.functions.invoke('send-email', {
            body: { to, subject, templateId, data, tenantId }
        });

        if (error) {
            log.error('Error sending email', error, {
                component: 'EmailService',
                metadata: { templateId, to: to.replace(/(.{2}).*@/, '$1***@') } // Mask email
            });
            return { success: false, error };
        }

        log.track('email_sent', {
            component: 'EmailService',
            metadata: { templateId, tenantId }
        });

        return { success: true, data: supaData };
    }
}

