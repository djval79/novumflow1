import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { tenantService, Tenant, Feature } from '@/lib/services/TenantService';

interface TenantContextValue {
    tenant: Tenant | null;
    features: Feature[];
    loading: boolean;
    /** Check if a feature is enabled for the current tenant */
    hasFeature: (featureKey: string) => boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    const { user, profile } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [featureMap, setFeatureMap] = useState<Map<string, boolean>>(new Map());
    const [loading, setLoading] = useState(true);

    // Load tenant and its feature flags when auth/profile is ready
    useEffect(() => {
        const load = async () => {
            if (!profile?.tenant_id) {
                setLoading(false);
                return;
            }
            // Fetch tenant record
            const { data: tenantData, error: tenantError } = await supabase
                .from<Tenant>('tenants')
                .select('*')
                .eq('id', profile.tenant_id)
                .single();
            if (tenantError) {
                console.error('Failed to load tenant:', tenantError);
                setLoading(false);
                return;
            }
            setTenant(tenantData);

            // Load all features definitions
            const allFeatures = await tenantService.getAllFeatures();
            setFeatures(allFeatures);

            // Load enabled/disabled map for this tenant
            const statusMap = await tenantService.getTenantFeatureStatus(profile.tenant_id);
            setFeatureMap(statusMap);
            setLoading(false);
        };
        load();
    }, [profile?.tenant_id]);

    const hasFeature = (featureKey: string) => {
        if (loading) return false;
        // Find feature by key (display_name or id). We'll use display_name as key.
        const feature = features.find(f => f.display_name === featureKey || f.id === featureKey);
        if (!feature) return false;
        return featureMap.get(feature.id) ?? false;
    };

    return (
        <TenantContext.Provider value={{ tenant, features, loading, hasFeature }}>
            {children}
        </TenantContext.Provider>
    );
};

/** Hook to consume tenant context */
export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
