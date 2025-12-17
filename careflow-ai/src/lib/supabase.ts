import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback to production Supabase (shared with NovumFlow)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://niikshfoecitimepiifo.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'novumflow-auth-token',
        // flowType: 'pkce', // React 19 / Vite may need this
        //    // CRITICAL: Enable this in production for shared login between subdomains
        //    // cookieOptions: {
        //    //   name: 'novumflow-auth-token',
        //    //   domain: '.novumflow.com', // Replace with your actual production domain
        //    //   sameSite: 'lax',
        //    //   secure: true,
        //    //   maxAge: 60 * 60 * 24 * 365
        //    // }
    }
});

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

