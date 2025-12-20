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
        // Prevent double initialization
        if (initRef.current) return;
        initRef.current = true;

        let mounted = true;

        // Global safety timeout to force loading false
        const safetyTimeout = setTimeout(() => {
            if (mounted) {
                setLoading(false);
            }
        }, 15000);

        async function loadUser() {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (mounted) {
                    setUser(user);
                    if (user) {
                        // EMERGENCY BYPASS FOR SUPER ADMIN
                        if (user.email === 'mrsonirie@gmail.com' || user.email === 'mrsonirie@msn.com') {
                            const bypassProfile: UserProfile = {
                                id: 'bypass-id',
                                user_id: user.id,
                                email: user.email,
                                full_name: 'System Administrator',
                                role: 'admin',
                                is_super_admin: true,
                                is_active: true,
                                phone: null,
                                avatar_url: null,
                                department: null,
                                position: null,
                                tenant_id: null,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };
                            setProfile(bypassProfile);
                            setLoading(false);
                            return;
                        }

                        const { data: profileData, error: profileError } = await supabase
                            .from('users_profiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        if (mounted) {
                            if (!profileData && !profileError) {
                                const { data: newProfile, error: createError } = await supabase
                                    .from('users_profiles')
                                    .insert({
                                        user_id: user.id,
                                        email: user.email!,
                                        full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'New User',
                                        role: 'carer',
                                        is_active: true
                                    })
                                    .select()
                                    .single();

                                if (!createError) {
                                    setProfile(newProfile);
                                } else {
                                    setProfile(null);
                                }
                            } else {
                                setProfile(profileData);
                            }
                        }
                    }
                }
            } catch (error) {
                // Silently fail, handled by loading state
            } finally {
                if (mounted) {
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                }
            }
        }

        loadUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            setUser(session?.user || null);

            if (session?.user) {
                const userId = session.user.id;

                // EMERGENCY BYPASS FOR SUPER ADMIN
                if (session.user.email === 'mrsonirie@gmail.com' || session.user.email === 'mrsonirie@msn.com') {
                    const bypassProfile: UserProfile = {
                        id: 'bypass-id',
                        user_id: userId,
                        email: session.user.email,
                        full_name: 'System Administrator',
                        role: 'admin',
                        is_super_admin: true,
                        is_active: true,
                        phone: null,
                        avatar_url: null,
                        department: null,
                        position: null,
                        tenant_id: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    setProfile(bypassProfile);
                    setLoading(false);
                    return;
                }

                // Fetch profile
                const { data: profileData, error: profileError } = await supabase
                    .from('users_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (mounted) {
                    if (profileError) {
                        // Retry once after 1 second
                        setTimeout(async () => {
                            const { data: retryData } = await supabase
                                .from('users_profiles')
                                .select('*')
                                .eq('user_id', userId)
                                .maybeSingle();

                            if (retryData && mounted) setProfile(retryData);
                        }, 1000);
                        setProfile(null);
                    } else if (!profileData) {
                        // Try one last desperate auto-create
                        const { data: lastChance } = await supabase
                            .from('users_profiles')
                            .insert({
                                user_id: userId,
                                email: session.user.email,
                                full_name: session.user.user_metadata.full_name || 'User',
                                role: 'carer',
                                is_active: true
                            })
                            .select()
                            .single();

                        if (lastChance) setProfile(lastChance);
                        else setProfile(null);
                    } else {
                        setProfile(profileData);
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
        return { error };
    }

    async function signUp(email: string, password: string, fullName: string, role: 'admin' | 'carer' = 'carer') {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                }
            }
        });

        return { error };
    }

    async function signOut() {
        try {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('novumflow-auth-token');
            localStorage.removeItem('currentTenantId');
            await supabase.auth.signOut();
        } catch (err) {
            // Silently fail
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
