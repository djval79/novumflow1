import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useAuth } from './AuthContext';

// Tenant types
export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    slug: string;
    logo_url?: string;
    settings: Record<string, any>;
    features: {
        novumflow_enabled: boolean;
        careflow_enabled: boolean;
        ai_enabled: boolean;
    };
    subscription_tier: 'trial' | 'basic' | 'professional' | 'enterprise';
    subscription_status: 'active' | 'trial' | 'cancelled' | 'suspended' | 'expired';
    region?: 'eu-west-1' | 'us-east-1' | 'ap-southeast-1';
    created_at: string;
}

export interface TenantMembership {
    id: string;
    user_id: string;
    tenant_id: string;
    role: 'owner' | 'admin' | 'manager' | 'member';
    permissions: string[];
    is_active: boolean;
    joined_at: string;
}

interface TenantContextType {
    currentTenant: Tenant | null;
    tenants: Tenant[];
    memberships: TenantMembership[];
    loading: boolean;
    switchTenant: (tenantId: string) => Promise<void>;
    createTenant: (name: string, subdomain: string) => Promise<Tenant | null>;
    refreshTenants: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    hasFeature: (feature: string) => boolean;
    canAccessCareFlow: boolean;
    canAccessNovumFlow: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [memberships, setMemberships] = useState<TenantMembership[]>([]);
    const [loading, setLoading] = useState(true);

    // Load user's tenants and memberships
    const loadTenants = useCallback(async () => {
        if (!user) {
            setTenants([]);
            setMemberships([]);
            setCurrentTenant(null);
            setLoading(false);
            return;
        }

        // Guard against null Supabase client
        if (!supabase) {
            log.error('Supabase client not initialized', undefined, { component: 'TenantContext', action: 'loadTenants' });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Load memberships
            const { data: membershipData, error: membershipError } = await supabase
                .from('user_tenant_memberships')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('joined_at', { ascending: true });

            if (membershipError) throw membershipError;

            setMemberships(membershipData || []);

            // Load tenants
            if (membershipData && membershipData.length > 0) {
                const tenantIds = membershipData.map(m => m.tenant_id);

                const { data: tenantData, error: tenantError } = await supabase
                    .from('tenants')
                    .select('*')
                    .in('id', tenantIds)
                    .eq('is_active', true);

                if (tenantError) throw tenantError;

                setTenants(tenantData || []);

                // Set current tenant (Priority: URL > LocalStorage > First available)
                const searchParams = new URLSearchParams(window.location.search);
                const urlTenantId = searchParams.get('tenant');
                const savedTenantId = localStorage.getItem('currentTenantId');

                const tenantToSet = (urlTenantId && tenantData?.find(t => t.id === urlTenantId))
                    || (savedTenantId ? tenantData?.find(t => t.id === savedTenantId) : null)
                    || tenantData?.[0];

                if (tenantToSet) {
                    setCurrentTenant(tenantToSet);
                    localStorage.setItem('currentTenantId', tenantToSet.id);
                }
            }
        } catch (error) {
            log.error('Error loading tenants', error, { component: 'TenantContext', action: 'loadTenants' });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadTenants();
    }, [loadTenants]);

    // Ensure RLS context is set whenever tenant changes
    useEffect(() => {
        if (currentTenant && supabase) {
            (async () => {
                try {
                    const { error } = await supabase.rpc('set_current_tenant', { p_tenant_id: currentTenant.id });
                    if (error) {
                        log.error('Error enforcing RLS context', error, { component: 'TenantContext', action: 'set_current_tenant', metadata: { tenantId: currentTenant.id } });
                    } else {
                        log.debug('RLS Context set', { tenantId: currentTenant.id, component: 'TenantContext' });
                    }
                } catch (err) {
                    log.error('Failed to set RLS context', err, { component: 'TenantContext', action: 'set_current_tenant' });
                }
            })();
        }
    }, [currentTenant]);

    // Switch to a different tenant
    const switchTenant = useCallback(async (tenantId: string) => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) {
            log.error('Tenant not found during switch', undefined, { component: 'TenantContext', action: 'switchTenant', metadata: { tenantId } });
            return;
        }

        setCurrentTenant(tenant);
        localStorage.setItem('currentTenantId', tenantId);

        // Set tenant context in Supabase session (for RLS)
        if (supabase) {
            try {
                const { error } = await supabase.rpc('set_current_tenant', {
                    p_tenant_id: tenantId
                });

                if (error) {
                    log.error('Error setting tenant context', error, { component: 'TenantContext', action: 'switchTenant', metadata: { tenantId } });
                }
            } catch (error) {
                log.error('Error calling set_current_tenant', error, { component: 'TenantContext', action: 'switchTenant', metadata: { tenantId } });
            }
        }

        // Reload page to refresh all data with new tenant
        window.location.reload();
    }, [tenants]);

    // Create new tenant
    const createTenant = useCallback(async (name: string, subdomain: string): Promise<Tenant | null> => {
        if (!supabase) {
            log.error('Supabase client not initialized', undefined, { component: 'TenantContext', action: 'createTenant' });
            return null;
        }

        try {
            const { data, error } = await supabase.rpc('create_tenant', {
                p_name: name,
                p_subdomain: subdomain,
                p_owner_user_id: user?.id
            });

            if (error) throw error;

            // Refresh tenants list
            await loadTenants();

            return data;
        } catch (error) {
            log.error('Error creating tenant', error, { component: 'TenantContext', action: 'createTenant', metadata: { name, subdomain } });
            return null;
        }
    }, [user, loadTenants]);

    // Check if user has a specific permission
    const hasPermission = useCallback((permission: string): boolean => {
        if (!currentTenant || !user) return false;

        const membership = memberships.find(m => m.tenant_id === currentTenant.id);
        if (!membership) return false;

        // Owners and admins have all permissions
        if (['owner', 'admin'].includes(membership.role)) return true;

        // Check specific permission
        return membership.permissions.includes(permission);
    }, [currentTenant, user, memberships]);

    // Check if a feature is enabled (default: all features enabled)
    const hasFeature = useCallback((feature: string): boolean => {
        // If no tenant, assume all features enabled for backward compatibility
        if (!currentTenant) return true;

        // Features can be disabled in settings
        if (currentTenant.settings?.disabled_features) {
            return !currentTenant.settings.disabled_features.includes(feature);
        }

        // Default: all features enabled
        return true;
    }, [currentTenant]);

    // Check feature access
    const canAccessCareFlow = currentTenant?.features?.careflow_enabled || false;
    const canAccessNovumFlow = currentTenant?.features?.novumflow_enabled !== false; // Default true

    return (
        <TenantContext.Provider
            value={{
                currentTenant,
                tenants,
                memberships,
                loading,
                switchTenant,
                createTenant,
                refreshTenants: loadTenants,
                hasPermission,
                hasFeature,
                canAccessCareFlow,
                canAccessNovumFlow,
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}

// Helper hook to get tenant-scoped query
export function useTenantQuery() {
    const { currentTenant } = useTenant();

    const withTenant = useCallback((tableName: string) => {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        if (!currentTenant) {
            throw new Error('No current tenant');
        }

        return supabase
            .from(tableName)
            .select('*')
            .eq('tenant_id', currentTenant.id);
    }, [currentTenant]);

    return { withTenant, tenantId: currentTenant?.id };
}
