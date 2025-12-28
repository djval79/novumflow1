import { supabase } from '../supabase';
import { log } from '@/lib/logger';

export interface Tenant {
    id: string;
    name: string;
    domain: string | null;
    subscription_tier: string;
    subscription_price?: number;
    currency?: string;
    subscription_interval?: 'monthly' | 'yearly';
    slug?: string;
    is_active?: boolean;
    max_users?: number;
    careflow_enabled?: boolean;
    cardflow_enabled?: boolean;
    settings?: Record<string, unknown>;
}

export interface Feature {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    category: 'module' | 'feature' | 'integration';
    is_premium: boolean;
}

interface TenantFeatureRow {
    feature_id: string;
    is_enabled: boolean;
}

/**
 * Service for tenant and feature management.
 */
export const tenantService = {
    /** Get all tenants */
    async getAllTenants(): Promise<Tenant[]> {
        const { data, error } = await supabase.from('tenants').select('*');
        if (error) {
            log.error('Error fetching tenants', error, { component: 'TenantService' });
            return [];
        }
        return data ?? [];
    },

    /** Get all defined features */
    async getAllFeatures(): Promise<Feature[]> {
        const { data, error } = await supabase.from('features').select('*');
        if (error) {
            log.error('Error fetching features', error, { component: 'TenantService' });
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
            log.error('Error fetching tenant features', error, {
                component: 'TenantService',
                metadata: { tenantId }
            });
            return statusMap;
        }

        data?.forEach((row: TenantFeatureRow) => {
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
        }, {
            onConflict: 'tenant_id,feature_id'
        });

        if (error) {
            log.error('Error enabling feature', error, {
                component: 'TenantService',
                metadata: { tenantId, featureId }
            });
            return false;
        }

        log.track('feature_enabled', {
            component: 'TenantService',
            metadata: { tenantId, featureId, adminUserId }
        });

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
            log.error('Error disabling feature', error, {
                component: 'TenantService',
                metadata: { tenantId, featureId }
            });
            return false;
        }

        log.track('feature_disabled', {
            component: 'TenantService',
            metadata: { tenantId, featureId }
        });

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
            log.error(`Error fetching API key for ${serviceName}`, error, {
                component: 'TenantService',
                metadata: { tenantId, serviceName }
            });
            return null;
        }
        return data?.api_key ?? null;
    },

    /** Update tenant subscription details */
    async updateTenantSubscription(
        tenantId: string,
        price: number,
        currency: string,
        interval: 'monthly' | 'yearly'
    ): Promise<boolean> {
        const { error } = await supabase
            .from('tenants')
            .update({
                subscription_price: price,
                currency: currency,
                subscription_interval: interval,
                updated_at: new Date().toISOString()
            })
            .eq('id', tenantId);

        if (error) {
            log.error('Error updating tenant subscription', error, {
                component: 'TenantService',
                metadata: { tenantId }
            });
            return false;
        }

        log.track('subscription_updated', {
            component: 'TenantService',
            metadata: { tenantId, price, currency, interval }
        });

        return true;
    },

    /** Create a new tenant */
    async createTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant | null> {
        const { data, error } = await supabase
            .from('tenants')
            .insert({
                name: tenant.name,
                slug: tenant.slug || tenant.name.toLowerCase().replace(/\s+/g, '-'),
                domain: tenant.domain,
                subscription_tier: tenant.subscription_tier,
                subscription_price: tenant.subscription_price,
                currency: tenant.currency || 'GBP',
                subscription_interval: tenant.subscription_interval || 'monthly',
                is_active: tenant.is_active ?? true,
                max_users: tenant.max_users || 10,
            })
            .select()
            .single();

        if (error) {
            log.error('Error creating tenant', error, {
                component: 'TenantService',
                metadata: { tenantName: tenant.name }
            });
            return null;
        }

        log.track('tenant_created', {
            component: 'TenantService',
            metadata: { tenantId: data.id, tenantName: data.name }
        });

        return data;
    },

    /** Update an existing tenant */
    async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant | null> {
        log.info('Updating tenant', {
            component: 'TenantService',
            metadata: { tenantId, fields: Object.keys(updates) }
        });

        const { data, error } = await supabase
            .from('tenants')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', tenantId)
            .select();

        if (error) {
            log.error('Error updating tenant', error, {
                component: 'TenantService',
                metadata: { tenantId, errorCode: error.code }
            });
            return null;
        }

        log.info('Tenant updated successfully', {
            component: 'TenantService',
            metadata: { tenantId }
        });

        return data?.[0] || null;
    },

    /** Delete a tenant */
    async deleteTenant(tenantId: string): Promise<boolean> {
        const { error } = await supabase
            .from('tenants')
            .delete()
            .eq('id', tenantId);

        if (error) {
            log.error('Error deleting tenant', error, {
                component: 'TenantService',
                metadata: { tenantId }
            });
            return false;
        }

        log.security('tenant_deleted', {
            component: 'TenantService',
            metadata: { tenantId }
        });

        return true;
    },
};

