import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import {
    SubscriptionRow, isAdminEmail, computeProAccess, computeDisplayPlan,
} from '../lib/entitlements';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: any | null;
    loading: boolean;
    profileComplete: boolean;
    authEvent: string | null;
    // 결제/권한
    subscription: SubscriptionRow;
    isAdmin: boolean;
    hasProAccess: boolean;       // 유료 기능 사용 가능 여부 (관리자/구독자)
    plan: 'free' | 'pro' | 'trial';
    signInWithGoogle: () => Promise<void>;
    signInWithKakao: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    refreshSubscription: () => Promise<void>;
    setProfileState: (profile: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [subscription, setSubscription] = useState<SubscriptionRow>(null);
    const [loading, setLoading] = useState(true);
    const [authEvent, setAuthEvent] = useState<string | null>(null);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setProfile(data);
        } catch (e) {
            console.error("Error fetching profile:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscription = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('plan, status, current_period_end, trial_end')
                .eq('user_id', userId)
                .maybeSingle();
            if (error && error.code !== 'PGRST116') throw error;
            setSubscription(data ?? null);
        } catch (e) {
            console.error("Error fetching subscription:", e);
            setSubscription(null);
        }
    };

    useEffect(() => {
        let isTestMode = false;

        // --- TEMPORARY TEST LOGIN LOGIC (TOSS PAYMENTS) ---
        // ⚠️ 이 코드는 토스페이먼츠 심사/테스트 종료 후 반드시 삭제/주석처리 해야 합니다.
        if (Platform.OS === 'web') {
            const hasTestMode = window.location.href.includes('mode=toss_test') || window.location.href.includes('mode=test');
            if (hasTestMode) {
                isTestMode = true;
                console.log('⚡ Toss Test Mode Detected: Auto-logging in...');
                setLoading(true); // 로딩 유지
                
                // 미리 Supabase에 생성해둔 테스트 계정 정보
                supabase.auth.signInWithPassword({
                    email: 'toss_test@publica.ai',
                    password: 'tosstestpassword123!'
                }).then(({ error }) => {
                    if (error) {
                        console.error("Toss Auto Login Error:", error);
                        alert(`토스 테스트 계정 로그인 실패: ${error.message}\n(대표님: Supabase에서 해당 계정의 이메일 인증을 완료해주세요)`);
                        setLoading(false); // 실패 시 로딩 해제
                    }
                    // URL에서 파라미터 숨기기 (깔끔한 테스터 경험)
                    window.history.replaceState({}, document.title, window.location.pathname);
                });
            }
        }
        // --------------------------------------------------

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchSubscription(session.user.id);
            } else if (!isTestMode) {
                // 테스트 모드 자동 로그인이 진행 중이 아닐 때만 로딩 해제
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
            setAuthEvent(event);
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchSubscription(session.user.id);
            } else {
                setProfile(null);
                setSubscription(null);
                setLoading(false);
            }
        });

        return () => authSub.unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
    };

    const refreshSubscription = async () => {
        if (session?.user) {
            await fetchSubscription(session.user.id);
        }
    };

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: Platform.select({
                        web: window.location.origin,
                        default: 'publica://auth/callback' // Requires scheme setup in app.json
                    }),
                    queryParams: {
                        prompt: 'select_account'
                    }
                }
            });
            if (error) throw error;
        } catch (e) {
            console.error("Google Login Error:", e);
            throw e;
        }
    };

    const signInWithKakao = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'kakao',
                options: {
                    redirectTo: Platform.select({
                        web: window.location.origin,
                        default: 'publica://auth/callback'
                    })
                }
            });
            if (error) throw error;
        } catch (e) {
            console.error("Kakao Login Error:", e);
            throw e;
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Sign Out Error:", e);
        }
    };

    const email = session?.user?.email ?? null;
    const isAdmin = isAdminEmail(email);
    const hasProAccess = computeProAccess(email, subscription);
    const plan = computeDisplayPlan(email, subscription);

    return (
        <AuthContext.Provider value={{
            session,
            user: session?.user ?? null,
            profile,
            loading,
            // 프로필 완료 여부는 '실제 프로필 작성(user_type)'으로만 판정합니다.
            // 관리자라도 프로필을 설정하지 않았으면 설정 화면이 떠야 합니다.
            // (관리자 여부는 결제/권한에만 영향을 주고, 프로필 작성과는 무관)
            profileComplete: !!profile?.user_type,
            authEvent,
            subscription,
            isAdmin,
            hasProAccess,
            plan,
            signInWithGoogle,
            signInWithKakao,
            signOut,
            refreshProfile,
            refreshSubscription,
            setProfileState: (data: any) => setProfile(data)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
