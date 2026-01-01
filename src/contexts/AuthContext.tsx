import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isConfigured: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isConfigured = isSupabaseConfigured();

    // 从 user 对象生成默认 profile
    const getDefaultProfile = (authUser: User): Profile => ({
        id: authUser.id,
        username: authUser.email?.split('@')[0] || 'user',
        avatar_url: null,
        bio: null,
        created_at: new Date().toISOString(),
    });

    // 尝试获取 profile，失败则返回默认值
    const fetchProfile = async (authUser: User): Promise<Profile> => {
        try {
            console.log('📋 Fetching profile for:', authUser.email);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle(); // 使用 maybeSingle 不会在找不到时报错

            if (error) {
                console.warn('Profile fetch error (using default):', error.message);
                return getDefaultProfile(authUser);
            }

            if (data) {
                console.log('✅ Profile found:', data.username);
                return data;
            }

            // Profile 不存在，尝试创建
            console.log('📝 Profile not found, creating...');
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: authUser.id,
                    username: authUser.email?.split('@')[0] || 'user',
                })
                .select()
                .single();

            if (insertError) {
                console.warn('Profile create error (using default):', insertError.message);
                return getDefaultProfile(authUser);
            }

            console.log('✅ Profile created');
            return newProfile;
        } catch (error) {
            console.error('Profile error:', error);
            return getDefaultProfile(authUser);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            const newProfile = await fetchProfile(user);
            setProfile(newProfile);
        }
    };

    useEffect(() => {
        if (!isConfigured) {
            setIsLoading(false);
            return;
        }

        // 获取初始 session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            console.log('🔐 Initial session:', session ? session.user.email : 'null');

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // 获取 profile，但不阻塞 UI
                fetchProfile(session.user).then(setProfile);
            }

            // 立即结束 loading 状态
            setIsLoading(false);
        });

        // 监听认证状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 Auth event:', event, session?.user?.email);

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    fetchProfile(session.user).then(setProfile);
                } else {
                    setProfile(null);
                }

                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [isConfigured]);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setSession(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoading,
                isConfigured,
                signOut: handleSignOut,
                refreshProfile,
            }}
        >
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
