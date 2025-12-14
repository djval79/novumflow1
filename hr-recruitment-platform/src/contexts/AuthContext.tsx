import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';
import ServiceUnavailablePage from '@/pages/ServiceUnavailablePage';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: string, tenantId?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);

  // Effect 1: Initialize Auth (Run once)
  useEffect(() => {
    async function loadUser() {
      console.log('🔄 AuthContext: loadUser() started');
      setLoading(true);

      if (!supabase) {
        console.error('❌ AuthContext: Supabase client is not initialized (missing config)');
        setIsServiceUnavailable(true);
        setLoading(false);
        return;
      }

      try {
        console.log('⏳ AuthContext: Calling supabase.auth.getUser()...');
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('📨 AuthContext: getUser() result:', { user: user?.id, error });

        if (error) {
          console.error('❌ AuthContext: Error loading user:', error.message, error);

          // Check for Service Unavailable (503)
          if (
            (error as any).status === 503 ||
            (error as any).status === 500 ||
            error.message.includes('Service Unavailable') ||
            error.message.includes('upstream connect error') ||
            error.message.includes('Failed to fetch')
          ) {
            console.error('🚨 Service Unavailable: Supabase backend is down.');
            setIsServiceUnavailable(true);
            setLoading(false);
            return;
          }

          // If refresh token is invalid
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token') || error.message.includes('Auth session missing!')) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            return;
          }
        } else {
          setIsServiceUnavailable(false);
        }

        setUser(user);

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('users_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profileError && (
            (profileError as any).status === 503 ||
            profileError.message.includes('Service Unavailable') ||
            profileError.message.includes('upstream connect error') ||
            profileError.message.includes('Failed to fetch')
          )) {
            console.error('🚨 Service Unavailable: Supabase backend is down (Profile Load).');
            setIsServiceUnavailable(true);
            setLoading(false);
            return;
          }

          setProfile(profileData);
        }
      } catch (err: any) {
        console.error('Unexpected error loading user:', err);
        if (
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('NetworkError') ||
          err.status === 503
        ) {
          setIsServiceUnavailable(true);
        } else {
          setUser(null);
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    if (!supabase) return;

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        const userId = session.user.id;
        supabase
          .from('users_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error && (
              (error as any).status === 503 ||
              error.message.includes('Service Unavailable') ||
              error.message.includes('Failed to fetch')
            )) {
              setIsServiceUnavailable(true);
            } else {
              setProfile(data);
            }
          });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array: Run once

  // Effect 2: Inactivity Timers (Run on user change)
  useEffect(() => {
    // Session Timeout Logic (30 minutes)
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    const ACTIVITY_THROTTLE = 5 * 60 * 1000; // 5 minutes (throttle DB updates)
    let lastActivityTime = Date.now();
    let lastDbUpdate = Date.now();
    let activityTimer: NodeJS.Timeout;

    function updateActivity() {
      const now = Date.now();
      lastActivityTime = now;
      if (user && now - lastDbUpdate > ACTIVITY_THROTTLE) {
        lastDbUpdate = now;
      }
    }

    function checkInactivity() {
      const now = Date.now();
      if (user && now - lastActivityTime > INACTIVITY_LIMIT) {
        console.log('User inactive for 30 minutes, signing out...');
        signOut();
        alert('You have been signed out due to inactivity.');
      }
    }

    if (user) {
      // Add event listeners
      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('click', updateActivity);
      window.addEventListener('scroll', updateActivity);

      // Check inactivity every minute
      activityTimer = setInterval(checkInactivity, 60 * 1000);
    }

    return () => {
      if (activityTimer) clearInterval(activityTimer);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [user]); // Run when user changes

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, fullName: string, role: string, tenantId?: string) {
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          tenant_id: tenantId
        }
      }
    });

    if (authError) return { error: authError };
    if (!authData.user) return { error: new Error('User creation failed') };

    // Note: If you have a Trigger to create profile, this insert might duplicate or fail. 
    // Ideally, we rely on the Trigger or check existence. 
    // Assuming manual insert for now based on existing code:
    const { error: profileError } = await supabase
      .from('users_profiles')
      .upsert({ // Changed to upsert to handle potential race conditions with triggers
        user_id: authData.user.id,
        email,
        full_name: fullName,
        role,
        tenant_id: tenantId || null,
        is_active: true,
      });

    if (profileError) return { error: profileError };
    return { error: null };
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (isServiceUnavailable) {
    return <ServiceUnavailablePage />;
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
