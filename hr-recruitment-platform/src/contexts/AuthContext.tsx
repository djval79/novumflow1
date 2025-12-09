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
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token') || error.message.includes('Auth session missing!')) {
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

    // Session Timeout Logic (30 minutes)
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    const ACTIVITY_THROTTLE = 5 * 60 * 1000; // 5 minutes (throttle DB updates)
    let lastActivityTime = Date.now();
    let lastDbUpdate = Date.now();
    let activityTimer: NodeJS.Timeout;

    function updateActivity() {
      const now = Date.now();
      lastActivityTime = now;

      // Optional: Update DB session every 5 minutes
      if (user && now - lastDbUpdate > ACTIVITY_THROTTLE) {
        lastDbUpdate = now;
        // Fire and forget update to user_sessions
        // We need the session ID or token to update the specific session
        // For now, we rely on client-side timeout as primary
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
      subscription.unsubscribe();
      if (activityTimer) clearInterval(activityTimer);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [user]);

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
