import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = "http://127.0.0.1:54321";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODcyODU1MDUsImV4cCI6MTk5NTg2MTUwNX0.MnK0aK8YqK8YqK8YqK8YqK8YqK8YqK8YqK8YqK8YqK8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
