import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// SECURITY: Enforce environment variables - no fallback credentials
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isDevelopment = import.meta.env.MODE === 'development';

let supabaseInstance: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseClient() {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // Validate required configuration
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[CAREFLOW] Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        return null;
    }

    if (isDevelopment) {
        console.debug('[CAREFLOW] Supabase Configuration:', {
            url: supabaseUrl,
            key: supabaseAnonKey.substring(0, 20) + '...',
            environment: import.meta.env.MODE
        });
    }

    try {
        supabaseInstance = createClient<any, "public", any>(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: 'novumflow-auth-token', // Shared with NovumFlow for SSO
                flowType: 'pkce',
                debug: isDevelopment,
            }
        }) as SupabaseClient<any, "public", any>;
    } catch (err) {
        console.error('[CAREFLOW] Failed to initialize Supabase client:', err);
        return null;
    }

    return supabaseInstance;
}

export const supabase = getSupabaseClient();

export type UserRole = 'admin' | 'hr_manager' | 'recruiter' | 'employee' | 'carer' | 'staff';

export interface UserProfile {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    phone: string | null;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
    is_active: boolean;
    tenant_id: string | null;
    is_super_admin: boolean;
    created_at: string;
    updated_at: string;
}

