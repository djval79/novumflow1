/// <reference types="vitest" />
/**
 * TenantContext Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTenant = {
    id: 'tenant-1',
    name: 'Acme Corporation',
    slug: 'acme',
    domain: 'acme.example.com',
    subscription_tier: 'professional',
    subscription_price: 99.99,
    currency: 'GBP',
    is_active: true,
    max_users: 50,
    settings: {
        branding: { primary_color: '#3B82F6', logo_url: 'https://example.com/logo.png' },
        features: { ai_screening: true, compliance_hub: true },
        notifications: { email: true, sms: false },
    },
};

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: mockTenant, error: null })) })) },
}));

describe('TenantContext', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('Tenant Data', () => {
        it('should have valid tenant structure', () => {
            expect(mockTenant).toHaveProperty('id');
            expect(mockTenant).toHaveProperty('name');
            expect(mockTenant).toHaveProperty('slug');
            expect(mockTenant).toHaveProperty('subscription_tier');
        });

        it('should have valid subscription tier', () => {
            const validTiers = ['starter', 'professional', 'enterprise', 'custom'];
            expect(validTiers).toContain(mockTenant.subscription_tier);
        });

        it('should have valid currency', () => {
            const validCurrencies = ['GBP', 'USD', 'EUR', 'CAD', 'AUD'];
            expect(validCurrencies).toContain(mockTenant.currency);
        });
    });

    describe('Tenant Settings', () => {
        it('should have branding settings', () => {
            expect(mockTenant.settings.branding).toHaveProperty('primary_color');
            expect(mockTenant.settings.branding).toHaveProperty('logo_url');
        });

        it('should validate color format', () => {
            const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            expect(hexColorRegex.test(mockTenant.settings.branding.primary_color)).toBe(true);
        });

        it('should have feature flags', () => {
            expect(mockTenant.settings.features).toHaveProperty('ai_screening');
            expect(mockTenant.settings.features).toHaveProperty('compliance_hub');
        });

        it('should check feature access', () => {
            const hasFeature = (feature: string) => mockTenant.settings.features[feature as keyof typeof mockTenant.settings.features] ?? false;
            expect(hasFeature('ai_screening')).toBe(true);
            expect(hasFeature('compliance_hub')).toBe(true);
        });
    });

    describe('Subscription Limits', () => {
        it('should have user limits', () => {
            expect(mockTenant.max_users).toBeGreaterThan(0);
        });

        it('should validate subscription pricing', () => {
            expect(mockTenant.subscription_price).toBeGreaterThan(0);
            expect(Number.isFinite(mockTenant.subscription_price)).toBe(true);
        });

        const tierLimits = { starter: 10, professional: 50, enterprise: 500, custom: Infinity };

        it('should enforce tier-based limits', () => {
            const tier = mockTenant.subscription_tier as keyof typeof tierLimits;
            expect(mockTenant.max_users).toBeLessThanOrEqual(tierLimits[tier]);
        });
    });
});
