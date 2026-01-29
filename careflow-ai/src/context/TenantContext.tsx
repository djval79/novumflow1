import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { withTimeout } from '../lib/timeoutUtils';

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

    // Concurrency guard to prevent multiple simultaneous loads
    const isLoadingRef = React.useRef(false);

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

        if (isLoadingRef.current) {
            console.log('TenantContext: loadTenants already in progress, skipping');
            return;
        }

        try {
            isLoadingRef.current = true;
            setLoading(true);
            console.log('TenantContext: Loading memberships for user:', user.id);

            // Timeout helper for Supabase queries
            const withTimeout = async (promise: Promise<any>, timeoutMs: number = 8000) => {
                let timeoutHandle: any;
                const timeoutPromise = new Promise((_, reject) => {
                    timeoutHandle = setTimeout(() => reject(new Error('Query Timeout')), timeoutMs);
                });
                try {
                    const result = await Promise.race([promise, timeoutPromise]);
                    clearTimeout(timeoutHandle);
                    return result;
                } catch (err) {
                    clearTimeout(timeoutHandle);
                    throw err;
                }
            };

            // Load memberships with timeout
            console.log('TenantContext: Fetching memberships...');
            const membershipQuery = supabase
                    .from('user_tenant_memberships')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .order('joined_at', { ascending: true });
            
            const { data: membershipData, error: membershipError } = await withTimeout(membershipQuery);

            console.log('TenantContext: Membership query result:', {
                count: membershipData?.length,
                error: membershipError
            });

            if (membershipError) {
                console.error('TenantContext: Membership query error:', membershipError);
                throw membershipError;
            }

            setMemberships(membershipData || []);

            // Load tenants using membership data directly
            if (membershipData && membershipData.length > 0) {
                const tenantIds = membershipData.map(m => m.tenant_id);
                console.log('TenantContext: Loading tenants for IDs:', tenantIds);

                const { data: tenantData, error: tenantError } = await withTimeout(
                    supabase
                        .from('tenants')
                        .select('*')
                        .in('id', tenantIds)
                        .eq('is_active', true)
                );

                if (tenantError) {
                    console.error('TenantContext: Error loading tenants:', tenantError);
                    throw tenantError;
                }

                console.log('TenantContext: Loaded tenants count:', tenantData?.length);
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

                // Fallback to simpler RPC check if memberships table is empty or failing
                console.log('TenantContext: Triggering RPC fallback check...');
                const rpcPromise = supabase.rpc('get_my_tenants');
                const { data: rpcData, error: rpcError } = await withTimeout(rpcPromise, 5000);

                if (!rpcError && rpcData && rpcData.length > 0) {
                    console.log('TenantContext: Found tenants via RPC fallback:', rpcData.length);
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
            }
        } catch (error) {
            console.error('TenantContext: loadTenants failed critical path:', error);
        } finally {
            console.log('TenantContext: Finished loading sequence');
            isLoadingRef.current = false;
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

    // Ensure RLS context is set whenever tenant changes
    useEffect(() => {
        const setRlsContext = async () => {
            if (currentTenant) {
                try {
                    console.log('TenantContext: Setting RLS context for:', currentTenant.id);

                    const withTimeout = async (promise: Promise<any>, timeoutMs: number = 5000) => {
                        let timeoutHandle: any;
                        const timeoutPromise = new Promise((_, reject) => {
                            timeoutHandle = setTimeout(() => reject(new Error('RLS Timeout')), timeoutMs);
                        });
                        try {
                            const result = await Promise.race([promise, timeoutPromise]);
                            clearTimeout(timeoutHandle);
                            return result;
                        } catch (err) {
                            clearTimeout(timeoutHandle);
                            throw err;
                        }
                    };

                    const rlsPromise = supabase.rpc('set_current_tenant', { p_tenant_id: currentTenant.id });
                    const { error } = await withTimeout(rlsPromise, 5000);

                    if (error) console.error('Error enforcing RLS context:', JSON.stringify(error));
                    else console.log('RLS Context set successfully');
                } catch (err: any) {
                    console.warn('TenantContext: Failed to set RLS context (might be a hang):', err?.message || err);
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

            // First check if subdomain already exists to avoid timeouts
            const { data: existingTenant, error: checkError } = await supabase
                .from('tenants')
                .select('id, subdomain')
                .eq('subdomain', subdomain)
                .single();

            if (existingTenant) {
                console.error('TenantContext: Subdomain already exists:', subdomain);
                throw new Error('Subdomain already exists');
            }

            // Wrap RPC with shorter timeout and better error handling
            const executeRpc = async () => {
                return await supabase.rpc('create_tenant', {
                    p_name: name,
                    p_subdomain: subdomain,
                    p_owner_user_id: user.id
                });
            };

            const withTimeout = async (promise: Promise<any>, timeoutMs: number = 8000) => {
                let timeoutHandle: any;
                const timeoutPromise = new Promise((_, reject) => {
                    timeoutHandle = setTimeout(() => reject(new Error('RPC Timeout')), timeoutMs);
                });
                try {
                    const result = await Promise.race([promise, timeoutPromise]);
                    clearTimeout(timeoutHandle);
                    return result;
                } catch (err) {
                    clearTimeout(timeoutHandle);
                    throw err;
                }
            };

            const { data, error } = await withTimeout(executeRpc());

            if (error) {
                console.error('TenantContext: create_tenant RPC failed:', {
                    message: error.message,
                    details: error.details,
                    code: error.code
                });
                throw error;
            }

            console.log('TenantContext: Tenant created successfully:', data);

            // Wait a bit for database consistency then refresh
            setTimeout(() => {
                loadTenants().catch(err => console.error('TenantContext: Post-creation refresh failed:', err));
            }, 500);

            return data;
        } catch (error: any) {
            console.error('Error creating tenant:', error?.message || error);
            
            // For timeouts, check if tenant was actually created
            if (error?.message === 'RPC Timeout') {
                console.warn('TenantContext: creation timed out, checking if tenant exists...');
                try {
                    const { data: checkTenant } = await supabase
                        .from('tenants')
                        .select('*')
                        .eq('subdomain', subdomain)
                        .single();
                    
                    if (checkTenant) {
                        console.log('TenantContext: Tenant was created despite timeout');
                        setTimeout(() => loadTenants(), 500);
                        return checkTenant;
                    }
                } catch (checkError) {
                    console.error('TenantContext: Failed to verify tenant creation:', checkError);
                }
            }
            
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
