import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Environment-based configuration
const isDevelopment = import.meta.env.MODE === 'development';

// SECURITY: Enforce environment variables - no fallback credentials
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Validate required configuration
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    return null;
  }

  // Development-only logging (removed in production)
  if (isDevelopment) {
    console.log('🔗 Supabase Configuration:');
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
    console.log('🏗️ Environment:', import.meta.env.MODE);
  }

  // Create Supabase client with optimized configuration
  // Cast to ensure it's treated as a generic client compatible with missing types
  // using <any, "public", any> to define Database, SchemaName, and Schema as permissive

  if (typeof createClient === 'undefined') {
    console.error('❌ Supabase createClient is undefined. Check your dependencies.');
    return null;
  }

  try {
    supabaseInstance = createClient<any, "public", any>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'Cache-Control': isDevelopment ? 'no-cache, no-store, must-revalidate' : 'public, max-age=300',
          'Pragma': isDevelopment ? 'no-cache' : 'cache',
          'Expires': isDevelopment ? '0' : '300'
        }
      },
      db: {
        schema: 'public'
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }) as SupabaseClient<any, "public", any>;
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
    return null;
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();

export type UserRole = 'admin' | 'hr_manager' | 'recruiter' | 'employee' | 'carer' | 'staff' | 'inspector' | 'super_admin';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  tenant_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  is_active: boolean;
  preferences: any;
  created_at: string;
  is_super_admin?: boolean;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  is_active: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

// Helper functions
export const isValidSupabaseUrl = (url: string): boolean => {
  return url && (url.includes('supabase.co') || url.includes('localhost') || url.includes('127.0.0.1'));
};

export const getCurrentUser = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    if (isDevelopment) {
      console.error('Error getting current user:', error);
    }
    return null;
  }
  return user;
};

export const getCurrentUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: profile, error } = await supabase
    .from('users_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (isDevelopment) {
      console.error('Error getting user profile:', error);
    }
    return null;
  }

  return profile as UserProfile;
};

// Connection test (development only)
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { data, error } = await supabase
      .from('users_profiles')
      .select('id')
      .limit(1);

    if (error) {
      if (isDevelopment) {
        console.error('❌ Supabase connection test failed:', error);
      }
      return false;
    }

    if (isDevelopment) {
      console.log('✅ Supabase connection successful');
    }
    return true;
  } catch (error) {
    if (isDevelopment) {
      console.error('❌ Supabase connection error:', error);
    }
    return false;
  }
};
