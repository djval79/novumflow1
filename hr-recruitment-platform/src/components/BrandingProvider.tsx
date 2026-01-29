import React, { createContext, useContext, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { brandingSvc, TenantBranding } from '../lib/services/BrandingSvc';

interface BrandingContextType {
    currentBranding: TenantBranding | undefined;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentTenant } = useTenant();

    useEffect(() => {
        if (currentTenant) {
            brandingSvc.applyBranding(currentTenant.settings?.branding);
        } else {
            brandingSvc.applyBranding(undefined); // Reset to defaults
        }
    }, [currentTenant]);

    return (
        <BrandingContext.Provider value={{ currentBranding: currentTenant?.settings?.branding }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
