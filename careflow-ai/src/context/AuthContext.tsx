import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isServiceUnavailable: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string, role?: 'admin' | 'carer') => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple Service Unavailable Page
const ServiceUnavailablePage = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Service Unavailable</h1>
            <p className="text-slate-400 mb-6">CareFlow is currently unable to connect to the server.</p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
                Try Again
            </button>
        </div>
    </div>
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);

    const initRef = React.useRef(false);

    useEffect(() => {
        // Prevent double initialization
        if (initRef.current) return;
        initRef.current = true;

        // Check if Supabase client is available
        if (!supabase) {
            console.error('[CAREFLOW] Supabase client not initialized');
            setIsServiceUnavailable(true);
            setLoading(false);
            return;
        }

        let mounted = true;

        // Global safety timeout to force loading false
        const safetyTimeout = setTimeout(() => {
            if (mounted) {
                setLoading(false);
            }
        }, 15000);

        async function loadUser() {
            if (!supabase) return;

            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError) {
                    // Check for service unavailable errors
                    if (
                        (userError as any).status === 503 ||
                        (userError as any).status === 500 ||
                        userError.message.includes('Service Unavailable') ||
                        userError.message.includes('Failed to fetch')
                    ) {
                        if (mounted) {
                            setIsServiceUnavailable(true);
                            setLoading(false);
                        }
                        return;
                    }

                    if (userError.message.includes('Refresh Token Not Found') ||
                        userError.message.includes('Invalid Refresh Token') ||
                        userError.message.includes('Auth session missing!')) {
                        await supabase.auth.signOut();
                        if (mounted) {
                            setUser(null);
                            setProfile(null);
                        }
                        return;
                    }
                }

                if (mounted) {
                    setUser(user);
                    if (user) {
                        // Standard profile load
                        const { data: profileData, error: profileError } = await supabase
                            .from('users_profiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        if (mounted) {
                            if (profileError) {
                                console.error('AuthContext: Profile error:', profileError);
                                setProfile(null);
                            } else if (!profileData) {
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
                                    console.error('AuthContext: Failed to create profile:', createError);
                                    setProfile(null);
                                }
                            } else {
                                setProfile(profileData);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('[CAREFLOW] Auth error:', error);
                if (mounted) {
                    setIsServiceUnavailable(true);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                }
            }
        }

        loadUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted || !supabase) return;

            setUser(session?.user || null);

            if (session?.user) {
                const userId = session.user.id;

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
                            if (!supabase) return;
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
        if (!supabase) return { error: new Error('Service unavailable') };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    }

    async function signUp(email: string, password: string, fullName: string, role: 'admin' | 'carer' = 'carer') {
        if (!supabase) return { error: new Error('Service unavailable') };
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
            if (supabase) {
                await supabase.auth.signOut();
            }
        } catch (err) {
            // Silently fail
        }
    }

    if (isServiceUnavailable) {
        return <ServiceUnavailablePage />;
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, isServiceUnavailable, signIn, signUp, signOut }}>
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
