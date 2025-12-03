import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error loading user:', error.message);
          // If refresh token is invalid, clear session and user
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            return;
          }
        }

        setUser(user);

        if (user) {
          const { data: profileData } = await supabase
            .from('users_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          setProfile(profileData);
        }
      } catch (err) {
        console.error('Unexpected error loading user:', err);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Set up auth listener - KEEP SIMPLE, avoid async operations
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      // Load profile synchronously after state change
      if (session?.user) {
        const userId = session.user.id;
        supabase
          .from('users_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
          .then(({ data }) => {
            setProfile(data);
          });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, fullName: string, role: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return { error: authError };
    if (!authData.user) return { error: new Error('User creation failed') };

    const { error: profileError } = await supabase
      .from('users_profiles')
      .insert({
        user_id: authData.user.id,
        email,
        full_name: fullName,
        role,
        is_active: true,
      });

    if (profileError) return { error: profileError };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
