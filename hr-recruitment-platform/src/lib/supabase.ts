import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = "https://niikshfoecitimepiifo.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc";

// Create Supabase client with cache-busting headers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
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

