/**
 * BuildGo Auth Context
 * Global authentication state for the Telegram Mini App.
 * Handles auto-login, token persistence, and user profile from /api/me/.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    loginWithTelegram,
    getTelegramInitData,
    clearTokens,
    getAccessToken,
    setTokens,
    authFetch,
    BASE_URL,
} from '../services/authClient';

// --- Types ---

export interface AuthUser {
    id: number;
    telegram_id: number;
    first_name: string;
    last_name: string;
    phone: string;
    role: 'buyer' | 'seller';
    created_at: string;
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

// --- Provider ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch current user from /api/me/
     */
    const fetchCurrentUser = useCallback(async (): Promise<AuthUser | null> => {
        try {
            const response = await authFetch(`${BASE_URL}/api/me/`);
            if (!response.ok) {
                return null;
            }
            const userData: AuthUser = await response.json();
            return userData;
        } catch {
            return null;
        }
    }, []);

    /**
     * Full login flow: send Telegram initData → get tokens → fetch /api/me/
     */
    const login = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const initData = getTelegramInitData();
            if (!initData) {
                throw new Error('Telegram initData topilmadi. Iltimos, ilovani Telegram orqali oching.');
            }

            const authResponse = await loginWithTelegram(initData);
            setUser(authResponse.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Avtorizatsiya xatoligi';
            setError(message);
            console.error('Login failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Logout: clear tokens and state
     */
    const logout = useCallback(() => {
        clearTokens();
        setUser(null);
        setError(null);
    }, []);

    /**
     * On mount: try to restore session from saved tokens, or do fresh login
     */
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);

            // Check if we have saved tokens
            const savedToken = getAccessToken();
            if (savedToken) {
                // Try to validate with /api/me/
                const userData = await fetchCurrentUser();
                if (userData) {
                    setUser(userData);
                    setIsLoading(false);
                    return;
                }
                // Token invalid — fall through to fresh login
            }

            // No saved tokens or they were invalid — do fresh Telegram login
            const initData = getTelegramInitData();
            if (initData) {
                try {
                    const authResponse = await loginWithTelegram(initData);
                    setUser(authResponse.user);
                } catch (err) {
                    const message = err instanceof Error ? err.message : 'Avtorizatsiya xatoligi';
                    setError(message);
                    console.error('Auto-login failed:', err);
                }
            } else {
                // Not running in Telegram — set error but don't block the app in dev mode
                console.warn('No Telegram initData available. Running in dev mode.');
                setError(null); // Don't show error in dev
            }

            setIsLoading(false);
        };

        initAuth();
    }, [fetchCurrentUser]);

    const value: AuthState = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// --- Hook ---

export function useAuth(): AuthState {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
