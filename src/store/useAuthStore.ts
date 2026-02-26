import { create } from 'zustand';

export type Provider = 'google' | 'kakao' | null;

export interface SocialUser {
    uid: string;
    email: string | null;
    photoURL: string | null;
    provider: Provider;
    type?: string;
    name?: string;
}

interface AuthState {
    user: SocialUser | null;
    isLoggedIn: boolean;
    isNewUser: boolean;

    // Actions
    login: (socialData: SocialUser, isNew?: boolean) => void;
    logout: () => void;
    updateUserType: (type: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoggedIn: false,
    isNewUser: false,

    login: (socialData, isNew = false) => set({
        user: socialData,
        isLoggedIn: true,
        isNewUser: isNew
    }),

    logout: () => set({
        user: null,
        isLoggedIn: false,
        isNewUser: false
    }),

    updateUserType: (type) => set((state) => ({
        user: state.user ? { ...state.user, type } : null,
        isNewUser: false
    }))
}));
