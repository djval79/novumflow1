import { createClient } from '@supabase/supabase-js';

// Environment-based configuration
const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://niikshfoecitimepiifo.supabase.co";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc";

console.log('🔗 Supabase Configuration:');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
console.log('🏗️ Environment:', import.meta.env.VITE_ENVIRONMENT);

// Create Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
});

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
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

export const getCurrentUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }

  return profile as UserProfile;
};

// Connection test
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};

// Initialize connection test in development
if (isDevelopment) {
  testSupabaseConnection();
}
