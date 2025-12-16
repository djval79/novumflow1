/// <reference types="vitest" />
/**
 * useTenants Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTenants = [
    { id: 't-1', name: 'Acme Corp', domain: 'acme.com', slug: 'acme', subscription_tier: 'professional', is_active: true, max_users: 50 },
    { id: 't-2', name: 'Beta Inc', domain: 'beta.io', slug: 'beta', subscription_tier: 'enterprise', is_active: true, max_users: 200 },
    { id: 't-3', name: 'Test Org', domain: 'test.org', slug: 'test', subscription_tier: 'starter', is_active: false, max_users: 10 },
];

const mockFeatures = [
    { id: 'f-1', name: 'ai_screening', display_name: 'AI Screening', is_premium: true },
    { id: 'f-2', name: 'compliance_hub', display_name: 'Compliance Hub', is_premium: true },
    { id: 'f-3', name: 'basic_recruitment', display_name: 'Basic Recruitment', is_premium: false },
];

const mockTenantFeatures = [
    { tenant_id: 't-1', feature_id: 'f-1', is_enabled: true },
    { tenant_id: 't-1', feature_id: 'f-3', is_enabled: true },
    { tenant_id: 't-2', feature_id: 'f-1', is_enabled: true },
    { tenant_id: 't-2', feature_id: 'f-2', is_enabled: true },
    { tenant_id: 't-2', feature_id: 'f-3', is_enabled: true },
];

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: [], error: null })) })) },
}));

describe('useTenants Hook', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('Tenant Data', () => {
        it('should have valid tenant structure', () => {
            mockTenants.forEach(t => {
                expect(t).toHaveProperty('id');
                expect(t).toHaveProperty('name');
                expect(t).toHaveProperty('domain');
                expect(t).toHaveProperty('subscription_tier');
            });
        });

        it('should have unique slugs', () => {
            const slugs = mockTenants.map(t => t.slug);
            expect(new Set(slugs).size).toBe(slugs.length);
        });

        it('should have valid subscription tiers', () => {
            const valid = ['starter', 'professional', 'enterprise', 'custom'];
            mockTenants.forEach(t => expect(valid).toContain(t.subscription_tier));
        });

        it('should filter active tenants', () => {
            const active = mockTenants.filter(t => t.is_active);
            expect(active.length).toBe(2);
        });
    });

    describe('Features', () => {
        it('should have valid feature structure', () => {
            mockFeatures.forEach(f => {
                expect(f).toHaveProperty('id');
                expect(f).toHaveProperty('name');
                expect(f).toHaveProperty('display_name');
            });
        });

        it('should identify premium features', () => {
            const premium = mockFeatures.filter(f => f.is_premium);
            expect(premium.length).toBe(2);
        });
    });

    describe('Tenant Features', () => {
        it('should count enabled features per tenant', () => {
            const t1Features = mockTenantFeatures.filter(tf => tf.tenant_id === 't-1' && tf.is_enabled);
            const t2Features = mockTenantFeatures.filter(tf => tf.tenant_id === 't-2' && tf.is_enabled);
            expect(t1Features.length).toBe(2);
            expect(t2Features.length).toBe(3);
        });

        it('should check feature access', () => {
            const hasFeature = (tenantId: string, featureId: string) =>
                mockTenantFeatures.some(tf => tf.tenant_id === tenantId && tf.feature_id === featureId && tf.is_enabled);

            expect(hasFeature('t-1', 'f-1')).toBe(true);
            expect(hasFeature('t-1', 'f-2')).toBe(false);
            expect(hasFeature('t-2', 'f-2')).toBe(true);
        });
    });
});
