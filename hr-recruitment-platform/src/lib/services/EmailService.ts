import { supabase } from '@/lib/supabase';
import { tenantService } from '@/lib/services/TenantService';

export class EmailService {
    /**
     * Simulates sending an email. In a real application, this would call a backend function (e.g., Supabase Edge Function)
     * which would then use an email provider like SendGrid or AWS SES.
     */
    static async sendEmail(to: string, subject: string, templateId: string, data: any, tenantId?: string) {
        // Retrieve per-tenant API key if tenantId provided
        let apiKeyInfo = '';
        if (tenantId) {
            const apiKey = await tenantService.getApiKey(tenantId, 'email_service');
            apiKeyInfo = apiKey ? ` using API key ${apiKey}` : ' (no API key found)';
        }
        console.log(`[EmailService] Sending email to ${to}${apiKeyInfo}`);
        console.log(`[EmailService] Subject: ${subject}`);
        console.log(`[EmailService] Template: ${templateId}`);
        console.log(`[EmailService] Data:`, data);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Log to a hypothetical 'notifications' table if we wanted to persist history beyond logs
        // For now, we just return success.

        return { success: true, messageId: `mock-${Date.now()}` };
    }
}
