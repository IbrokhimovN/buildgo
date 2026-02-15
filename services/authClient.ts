/**
 * BuildGo Auth Client
 * Centralized fetch wrapper with JWT token management and auto-refresh.
 */

// Use relative URL locally (Vite proxy), full URL in production (Telegram WebApp)
// @ts-ignore
export const BASE_URL: string = window.Telegram?.WebApp?.initData ? 'https://buildgo.uz' : '';

// --- Token Storage ---

const TOKEN_KEYS = {
    access: 'buildgo_access_token',
    refresh: 'buildgo_refresh_token',
} as const;

let accessToken: string | null = localStorage.getItem(TOKEN_KEYS.access);
let refreshToken: string | null = localStorage.getItem(TOKEN_KEYS.refresh);

export function getAccessToken(): string | null {
    return accessToken;
}

export function getRefreshToken(): string | null {
    return refreshToken;
}

export function setTokens(access: string, refresh: string): void {
    accessToken = access;
    refreshToken = refresh;
    localStorage.setItem(TOKEN_KEYS.access, access);
    localStorage.setItem(TOKEN_KEYS.refresh, refresh);
}

export function clearTokens(): void {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
}

// --- Telegram initData helper ---

export function getTelegramInitData(): string {
    // @ts-ignore - Telegram WebApp global
    return window.Telegram?.WebApp?.initData || '';
}

// --- Auth API calls (used internally, not through authFetch to avoid circular deps) ---

interface AuthResponse {
    access: string;
    refresh: string;
    user: {
        id: number;
        telegram_id: number;
        first_name: string;
        last_name: string;
        phone: string;
        role: 'buyer' | 'seller';
        created_at: string;
    };
}

interface RefreshResponse {
    access: string;
}

/**
 * Authenticate with the backend using Telegram initData.
 * Returns tokens + user object.
 */
export async function loginWithTelegram(initData: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/api/telegram-auth/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ init_data: initData }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `Auth failed: ${response.status}`);
    }

    const data: AuthResponse = await response.json();
    setTokens(data.access, data.refresh);
    return data;
}

/**
 * Refresh the access token using the refresh token.
 */
async function refreshAccessToken(): Promise<string> {
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await fetch(`${BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
        // Refresh token is invalid — clear everything
        clearTokens();
        throw new Error('Refresh token expired');
    }

    const data: RefreshResponse = await response.json();
    accessToken = data.access;
    localStorage.setItem(TOKEN_KEYS.access, data.access);
    return data.access;
}

// --- Mutex for token refresh (prevent concurrent refresh calls) ---

let refreshPromise: Promise<string> | null = null;

async function getValidAccessToken(): Promise<string> {
    if (refreshPromise) {
        return refreshPromise;
    }
    return accessToken || '';
}

// --- authFetch: drop-in replacement for fetch() with JWT handling ---

/**
 * Fetch wrapper that automatically:
 * 1. Adds Authorization: Bearer header
 * 2. Handles 401 by refreshing token and retrying once
 * 3. If refresh fails, re-authenticates via Telegram initData
 */
export async function authFetch(
    url: string,
    options: RequestInit = {},
    _isRetry = false
): Promise<Response> {
    const token = accessToken;

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });

    // If 401 and not already a retry, try to refresh and retry
    if (response.status === 401 && !_isRetry) {
        try {
            // Use a shared promise to prevent concurrent refresh calls
            if (!refreshPromise) {
                refreshPromise = refreshAccessToken();
            }
            await refreshPromise;
            refreshPromise = null;

            // Retry the original request with the new token
            return authFetch(url, options, true);
        } catch {
            refreshPromise = null;

            // Refresh failed — try full re-auth via Telegram
            const initData = getTelegramInitData();
            if (initData) {
                try {
                    await loginWithTelegram(initData);
                    return authFetch(url, options, true);
                } catch {
                    // Re-auth also failed — give up
                    clearTokens();
                }
            } else {
                clearTokens();
            }
        }
    }

    return response;
}
