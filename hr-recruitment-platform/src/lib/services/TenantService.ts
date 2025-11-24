import { supabase } from '../supabase';

export interface Tenant {
    id: string;
    name: string;
    domain: string | null;
    subscription_tier: string;
}

export interface Feature {
    id: string;
    display_name: string;
    description?: string;
    category: 'module' | 'feature' | 'integration';
    is_premium: boolean;
}

/**
 * Service for tenant and feature management.
 */
export const tenantService = {
    /** Get all tenants */
    async getAllTenants(): Promise<Tenant[]> {
        const { data, error } = await supabase.from('tenants').select('*');
        if (error) {
            console.error('Error fetching tenants:', error);
            return [];
        }
        return data ?? [];
    },

    /** Get all defined features */
    async getAllFeatures(): Promise<Feature[]> {
        const { data, error } = await supabase.from('features').select('*');
        if (error) {
            console.error('Error fetching features:', error);
            return [];
        }
        return data ?? [];
    },

    /** Get feature enablement map for a tenant */
    async getTenantFeatureStatus(tenantId: string): Promise<Map<string, boolean>> {
        const { data, error } = await supabase
            .from('tenant_features')
            .select('feature_id, is_enabled')
            .eq('tenant_id', tenantId);
        const statusMap = new Map<string, boolean>();
        if (error) {
            console.error('Error fetching tenant features:', error);
            return statusMap;
        }
        data?.forEach((row: any) => {
            statusMap.set(row.feature_id, row.is_enabled);
        });
        return statusMap;
    },

    /** Enable a feature for a tenant */
    async enableFeature(tenantId: string, featureId: string, adminUserId: string): Promise<boolean> {
        const { error } = await supabase.from('tenant_features').upsert({
            tenant_id: tenantId,
            feature_id: featureId,
            is_enabled: true,
            enabled_by: adminUserId,
            enabled_at: new Date().toISOString(),
        });
        if (error) {
            console.error('Error enabling feature:', error);
            return false;
        }
        return true;
    },

    /** Disable a feature for a tenant */
    async disableFeature(tenantId: string, featureId: string): Promise<boolean> {
        const { error } = await supabase
            .from('tenant_features')
            .update({ is_enabled: false })
            .eq('tenant_id', tenantId)
            .eq('feature_id', featureId);
        if (error) {
            console.error('Error disabling feature:', error);
            return false;
        }
        return true;
    },
    /** Retrieve API key for a given service for the current tenant */
    async getApiKey(tenantId: string, serviceName: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('tenant_api_keys')
            .select('api_key')
            .eq('tenant_id', tenantId)
            .eq('service_name', serviceName)
            .single();
        if (error) {
            console.error(`Error fetching API key for ${serviceName}:`, error);
            return null;
        }
        return data?.api_key ?? null;
    },
};
