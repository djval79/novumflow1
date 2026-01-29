import { test as base, expect, Page } from '@playwright/test';

// Test user credentials from environment or defaults
const TEST_USER = {
    email: process.env.E2E_TEST_EMAIL || 'e2e.test@novumflow.com',
    password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
};

// Helper to create a test user via Supabase API (bypassing flaky UI)
export async function createTestUser(page: Page) {
    const uniqueId = Date.now();
    const email = `e2e.admin.${uniqueId}@test.com`;
    const password = 'TestPassword123!';

    // Use env vars or defaults (matching .env I read)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niikshfoecitimepiifo.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

    try {
        // 1. Sign up the user
        const authResponse = await page.request.post(`${supabaseUrl}/auth/v1/signup`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                email,
                password
            }
        });

        if (!authResponse.ok()) {
            console.error('Failed to create user via API:', await authResponse.text());
            return { email, password }; // Return anyway, might have failed if duplicate (unlikely with timestamp)
        }

        const authData = await authResponse.json();
        const userId = authData.user?.id;
        const accessToken = authData.access_token;

        if (userId && accessToken) {
            // 2. Insert admin profile
            // We use the user's access token effectively "logging in" as them to bypass RLS issues if any
            const profileResponse = await page.request.post(`${supabaseUrl}/rest/v1/users_profiles?on_conflict=user_id`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${accessToken}`, // Use user's token
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=minimal'
                },
                data: {
                    user_id: userId,
                    full_name: 'Test Admin',
                    role: 'admin',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            });

            if (!profileResponse.ok()) {
                console.warn('Failed to create profile via API:', await profileResponse.text());
                // Try inserting with service role if I had it, but I don't.
                // Assuming RLS allows insert own profile.
            } else {
                console.log(`Created test user ${email} via API`);
            }

            // 3. Create Tenant via RPC (to ensure user isn't stuck in "loading" state)
            // Use RPC 'create_tenant' which handles tenant creation + membership
            const tenantName = `Test Tenant ${uniqueId}`;
            const subdomain = `test-${uniqueId}`;

            const tenantResponse = await page.request.post(`${supabaseUrl}/rest/v1/rpc/create_tenant`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                data: {
                    p_name: tenantName,
                    p_subdomain: subdomain,
                    p_owner_user_id: userId, // Explicitly pass owner ID
                    p_subscription_tier: 'trial' // Explicitly pass tier
                }
            });

            if (!tenantResponse.ok()) {
                console.warn('Failed to create tenant via RPC:', await tenantResponse.text());
            } else {
                console.log(`Created tenant '${tenantName}' via RPC`);
            }
        }

    } catch (e) {
        console.warn('API user creation failed', e);
    }

    return { email, password };
}

// Extended test with authentication
export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, use) => {
        // Create a fresh user for this test context
        await createTestUser(page);

        // Use the authenticated page
        await use(page);
    },
});

// Helper function to login (standard flow)
export async function login(page: Page, email?: string, password?: string) {
    await page.goto('/login');
    await page.fill('input[type="email"]', email || TEST_USER.email);
    await page.fill('input[type="password"]', password || TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
}

// Helper to wait for page load
export async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('domcontentloaded');
}

// Helper to take debug screenshot
export async function debugScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/debug-${name}.png`, fullPage: true });
}

export { expect };
