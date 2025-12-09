import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = "http://127.0.0.1:54321";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODcyODU1MDUsImV4cCI6MTk5NTg2MTUwNX0.MnK0aK8YqK8YqK8YqK8YqK8YqK8YqK8YqK8YqK8YqK8"; // Standard local anon key

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

