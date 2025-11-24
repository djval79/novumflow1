import { supabase } from '../supabase';

export interface TenantOnboarding {
    id: string;
    tenant_id: string;
    onboarding_status: 'not_started' | 'in_progress' | 'completed';
    basic_info_completed: boolean;
    admin_user_created: boolean;
    features_configured: boolean;
    branding_setup: boolean;
    integrations_configured: boolean;
    first_employee_added: boolean;
    welcome_email_sent: boolean;
    completion_percentage: number;
    started_at?: string;
    completed_at?: string;
}

export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    required: boolean;
    action?: () => void;
}

/**
 * Service for managing tenant onboarding process
 */
export const onboardingService = {
    /** Get onboarding status for a tenant */
    async getOnboardingStatus(tenantId: string): Promise<TenantOnboarding | null> {
        const { data, error } = await supabase
            .from('tenant_onboarding')
            .select('*')
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching onboarding status:', error);
            return null;
        }

        // If no record exists, create one
        if (!data) {
            const { data: newRecord, error: createError } = await supabase
                .from('tenant_onboarding')
                .insert({ tenant_id: tenantId, started_at: new Date().toISOString() })
                .select()
                .single();

            if (createError) {
                console.error('Error creating onboarding record:', createError);
                return null;
            }
            return newRecord;
        }

        return data;
    },

    /** Update a specific onboarding step */
    async updateOnboardingStep(
        tenantId: string,
        step: keyof Omit<TenantOnboarding, 'id' | 'tenant_id' | 'onboarding_status' | 'completion_percentage' | 'started_at' | 'completed_at'>,
        completed: boolean
    ): Promise<boolean> {
        const { error } = await supabase
            .from('tenant_onboarding')
            .update({ [step]: completed })
            .eq('tenant_id', tenantId);

        if (error) {
            console.error('Error updating onboarding step:', error);
            return false;
        }
        return true;
    },

    /** Get all onboarding steps with completion status */
    async getOnboardingSteps(tenantId: string): Promise<OnboardingStep[]> {
        const status = await this.getOnboardingStatus(tenantId);
        if (!status) return [];

        return [
            {
                id: 'basic_info',
                title: 'Complete Basic Information',
                description: 'Set up tenant name, domain, and subscription details',
                completed: status.basic_info_completed,
                required: true
            },
            {
                id: 'admin_user',
                title: 'Create Admin User',
                description: 'Add the first administrator account for this tenant',
                completed: status.admin_user_created,
                required: true
            },
            {
                id: 'features',
                title: 'Configure Features',
                description: 'Select and enable the features your organization needs',
                completed: status.features_configured,
                required: true
            },
            {
                id: 'branding',
                title: 'Set Up Branding',
                description: 'Customize logo, colors, and company information',
                completed: status.branding_setup,
                required: false
            },
            {
                id: 'integrations',
                title: 'Configure Integrations',
                description: 'Connect external services like Slack, Zoom, or email',
                completed: status.integrations_configured,
                required: false
            },
            {
                id: 'first_employee',
                title: 'Add First Employee',
                description: 'Add your first employee or team member to the system',
                completed: status.first_employee_added,
                required: false
            },
            {
                id: 'welcome_email',
                title: 'Send Welcome Email',
                description: 'Send onboarding email to the admin user',
                completed: status.welcome_email_sent,
                required: false
            }
        ];
    },

    /** Mark onboarding as complete */
    async completeOnboarding(tenantId: string): Promise<boolean> {
        const { error: onboardingError } = await supabase
            .from('tenant_onboarding')
            .update({
                onboarding_status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('tenant_id', tenantId);

        if (onboardingError) {
            console.error('Error completing onboarding:', onboardingError);
            return false;
        }

        const { error: tenantError } = await supabase
            .from('tenants')
            .update({
                onboarding_completed: true,
                onboarding_completed_at: new Date().toISOString()
            })
            .eq('id', tenantId);

        if (tenantError) {
            console.error('Error updating tenant onboarding status:', tenantError);
            return false;
        }

        return true;
    },

    /** Get all tenants with onboarding status */
    async getAllTenantsWithOnboarding(): Promise<any[]> {
        const { data, error } = await supabase
            .from('tenants')
            .select(`
                *,
                onboarding:tenant_onboarding(*)
            `);

        if (error) {
            console.error('Error fetching tenants with onboarding:', error);
            return [];
        }
        return data || [];
    }
};
