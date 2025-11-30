import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string, role?: 'admin' | 'carer') => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const initRef = React.useRef(false);

    useEffect(() => {
        console.log('AuthProvider: MOUNTED');

        // Prevent double initialization
        if (initRef.current) return;
        initRef.current = true;

        let mounted = true;

        // Global safety timeout to force loading false
        const safetyTimeout = setTimeout(() => {
            if (mounted) {
                console.warn('AuthProvider: Safety timeout triggered - forcing loading false');
                setLoading(false);
            }
        }, 5000);

        async function loadUser() {
            try {
                console.log('AuthProvider: Calling getUser()...');
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                console.log('AuthProvider: getUser() result:', user?.email, userError);

                if (mounted) {
                    setUser(user);
                    if (user) {
                        console.log('AuthProvider: Fetching profile for', user.id);
                        const { data: profileData, error: profileError } = await supabase
                            .from('users_profiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        console.log('AuthProvider: Profile result:', profileData, profileError);

                        if (mounted) {
                            if (!profileData && !profileError) {
                                console.log('AuthProvider: Profile missing (initial load), attempting to auto-create...');
                                const { data: newProfile, error: createError } = await supabase
                                    .from('users_profiles')
                                    .insert({
                                        user_id: user.id,
                                        email: user.email!,
                                        full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'New User',
                                        role: 'carer',
                                        status: 'Active'
                                    })
                                    .select()
                                    .single();

                                if (createError) {
                                    console.error('AuthProvider: Failed to auto-create profile (initial load):', createError);
                                    setProfile(null);
                                } else {
                                    console.log('AuthProvider: Profile auto-created (initial load):', newProfile);
                                    setProfile(newProfile);
                                }
                            } else {
                                setProfile(profileData);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('AuthProvider: LoadUser exception:', error);
            } finally {
                if (mounted) {
                    console.log('AuthProvider: loadUser finished, setting loading false');
                    setLoading(false);
                    clearTimeout(safetyTimeout); // Clear safety timeout if we finished normally
                }
            }
        }

        loadUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('AuthProvider: Auth State Change:', _event, session?.user?.email);

            if (!mounted) return;

            setUser(session?.user || null);

            if (session?.user) {
                const userId = session.user.id;

                // Fetch profile
                const { data, error } = await supabase
                    .from('users_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (mounted) {
                    if (error) {
                        console.error('AuthProvider: Profile Load Error:', error);
                        // Retry once after 1 second
                        setTimeout(async () => {
                            console.log('AuthProvider: Retrying profile fetch...');
                            const { data: retryData, error: retryError } = await supabase
                                .from('users_profiles')
                                .select('*')
                                .eq('user_id', userId)
                                .maybeSingle();

                            if (retryData) {
                                console.log('AuthProvider: Profile loaded on retry:', retryData);
                                if (mounted) setProfile(retryData);
                            } else {
                                console.error('AuthProvider: Retry failed:', retryError);
                                setProfile(null);
                            }
                        }, 1000);
                        setProfile(null);
                    } else if (!data) {
                        console.error('AuthProvider: CRITICAL - Profile missing even after auto-create attempt!');
                        // Try one last desperate auto-create
                        const { data: lastChance, error: lastError } = await supabase
                            .from('users_profiles')
                            .insert({
                                user_id: userId,
                                email: session.user.email,
                                full_name: session.user.user_metadata.full_name || 'User',
                                role: 'carer',
                                status: 'Active'
                            })
                            .select()
                            .single();

                        if (lastChance) {
                            console.log('AuthProvider: Profile created on last chance:', lastChance);
                            setProfile(lastChance);
                        } else {
                            console.error('AuthProvider: Last chance failed:', lastError);
                            setProfile(null);
                        }
                    } else {
                        console.log('AuthProvider: Profile Loaded (Auth Change):', data);
                        setProfile(data);
                    }
                    setLoading(false);
                }
            } else {
                if (mounted) {
                    setProfile(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) console.error('Supabase Auth Error:', error.message);
        return { error };
    }

    async function signUp(email: string, password: string, fullName: string, role: 'admin' | 'carer' = 'carer') {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                }
            }
        });

        if (error) console.error('Supabase SignUp Error:', error.message);

        // Profile creation is now handled by a Database Trigger (fix_signup_rls.sql)
        // We do not need to manually insert here.

        return { error };
    }

    async function signOut() {
        console.log('AuthContext: signOut called');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('AuthContext: Supabase signOut error', error);
            else console.log('AuthContext: Supabase signOut successful');
        } catch (err) {
            console.error('AuthContext: signOut exception', err);
        }
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
