import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
            console.log('TenantContext: No user, clearing tenants');
            setTenants([]);
            setMemberships([]);
            setCurrentTenant(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('TenantContext: Loading memberships for user:', user.id);

            // Load memberships
            const { data: membershipData, error: membershipError } = await supabase
                .from('user_tenant_memberships')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('joined_at', { ascending: true });

            console.log('TenantContext: Membership query result:', {
                data: membershipData,
                error: membershipError,
                count: membershipData?.length
            });

            if (membershipError) {
                console.error('TenantContext: Membership query error:', membershipError);
                throw membershipError;
            }

            setMemberships(membershipData || []);

            // Load tenants using membership data directly
            // The RPC approach using auth.uid() has issues, so we use memberships + direct tenant query
            if (membershipData && membershipData.length > 0) {
                console.log('TenantContext: Found', membershipData.length, 'memberships. Loading tenants...');

                const tenantIds = membershipData.map(m => m.tenant_id);
                console.log('TenantContext: Tenant IDs to load:', tenantIds);

                const { data: tenantData, error: tenantError } = await supabase
                    .from('tenants')
                    .select('*')
                    .in('id', tenantIds)
                    .eq('is_active', true);

                if (tenantError) {
                    console.error('TenantContext: Error loading tenants:', tenantError);
                    throw tenantError;
                }

                console.log('TenantContext: Loaded tenants:', tenantData);
                setTenants(tenantData || []);

                // Set current tenant (Priority: URL > LocalStorage > First available)
                const searchParams = new URLSearchParams(window.location.search);
                const urlTenantId = searchParams.get('tenant');
                const savedTenantId = localStorage.getItem('currentTenantId');

                const tenantToSet = (urlTenantId && tenantData?.find(t => t.id === urlTenantId))
                    || (savedTenantId ? tenantData?.find(t => t.id === savedTenantId) : null)
                    || tenantData?.[0];

                if (tenantToSet) {
                    console.log('TenantContext: Setting current tenant to:', tenantToSet.name);
                    setCurrentTenant(tenantToSet);
                    localStorage.setItem('currentTenantId', tenantToSet.id);
                }
            } else {
                console.log('TenantContext: No memberships found for user');

                // Try RPC as fallback (though likely will also fail)
                try {
                    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_tenants');

                    if (!rpcError && rpcData && rpcData.length > 0) {
                        console.log('TenantContext: Loaded tenants via RPC fallback', rpcData);
                        const mappedTenants = rpcData.map((t: any) => ({
                            ...t,
                            name: t.name || 'Unknown Organization',
                            subdomain: t.subdomain || 'unknown',
                            settings: t.settings || {},
                            created_at: t.created_at || new Date().toISOString(),
                            subscription_tier: t.subscription_tier || 'basic'
                        })) as Tenant[];

                        setTenants(mappedTenants);
                        if (mappedTenants[0]) {
                            setCurrentTenant(mappedTenants[0]);
                            localStorage.setItem('currentTenantId', mappedTenants[0].id);
                        }
                    }
                } catch (rpcErr) {
                    console.warn('TenantContext: RPC fallback also failed', rpcErr);
                }
            }
        } catch (error) {
            console.error('Error loading tenants:', error);
        } finally {
            console.log('TenantContext: loadTenants finished. Tenants found:', tenants.length);
            setLoading(false);
        }
    }, [user]);

    // Safety timeout to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('TenantContext: Force loading false due to timeout');
                setLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        loadTenants();
    }, [loadTenants]);

    useEffect(() => {
        const setRlsContext = async () => {
            if (currentTenant) {
                try {
                    const { error } = await supabase.rpc('set_current_tenant', { p_tenant_id: currentTenant.id });
                    if (error) console.error('Error enforcing RLS context:', JSON.stringify(error));
                    else console.log('RLS Context set to:', currentTenant.id);
                } catch (err) {
                    console.error('Failed to set RLS context:', err);
                }
            }
        };
        setRlsContext();
    }, [currentTenant]);

    // Switch to a different tenant
    const switchTenant = useCallback(async (tenantId: string) => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) {
            console.error('Tenant not found:', tenantId);
            return;
        }

        setCurrentTenant(tenant);
        localStorage.setItem('currentTenantId', tenantId);

        // Set tenant context in Supabase session (for RLS)
        try {
            const { error } = await supabase.rpc('set_current_tenant', {
                p_tenant_id: tenantId
            });

            if (error) {
                console.error('Error setting tenant context:', error);
            }
        } catch (error) {
            console.error('Error calling set_current_tenant:', error);
        }

        // Reload page to refresh all data with new tenant
        window.location.reload();
    }, [tenants]);

    const createTenant = useCallback(async (name: string, subdomain: string): Promise<Tenant | null> => {
        if (!user) {
            console.error('TenantContext: Cannot create tenant - User not logged in');
            return null;
        }

        try {
            console.log('TenantContext: Calling create_tenant RPC with:', { name, subdomain, userId: user.id });

            const { data, error } = await supabase.rpc('create_tenant', {
                p_name: name,
                p_subdomain: subdomain,
                p_owner_user_id: user.id
                // Note: subscription_tier is hardcoded to 'trial' inside the RPC function
            });

            if (error) {
                console.error('TenantContext: create_tenant RPC failed:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    fullError: JSON.stringify(error, null, 2)
                });
                throw error;
            }

            console.log('TenantContext: Tenant created successfully:', data);

            // Refresh tenants list
            await loadTenants();

            return data;
        } catch (error: any) {
            console.error('Error creating tenant:', error?.message || error, error);
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
