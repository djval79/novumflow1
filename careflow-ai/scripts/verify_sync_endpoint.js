
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const SUPABASE_URL = envConfig.VITE_SUPABASE_URL || 'https://niikshfoecitimepiifo.supabase.co';
const SUPABASE_KEY = envConfig.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifySyncEndpoint() {
    console.log('--- Verifying Sync Endpoint Accessibility ---');

    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'user_a@example.com', // Using the documented test user
        password: 'password123'
    });

    if (authError || !session) {
        console.error('Authentication failed. Cannot test protected endpoint.', authError);
        console.log('Please ensure user_a@example.com exists (run seed scripts if needed).');
        return;
    }

    console.log('Authenticated as:', session.user.email);
    console.log('Token:', session.access_token.substring(0, 10) + '...');

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-to-careflow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'check_health', // Just checking if it responds, even if it errors on action
                tenant_id: '00000000-0000-0000-0000-000000000000' // Mock ID
            })
        });

        console.log('Response Status:', response.status);

        if (response.status === 200 || response.status === 400 || response.status === 500) {
            console.log('[SUCCESS] Endpoint is reachable.');

            try {
                const json = await response.json();
                console.log('Response Body:', json);
            } catch (e) {
                console.log('Response body is not JSON');
            }

        } else if (response.status === 404) {
            console.error('[FAILURE] Endpoint not found (404). Function might not be deployed.');
        } else {
            console.log('[INFO] Endpoint returned:', response.status);
        }

    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

verifySyncEndpoint();
