/**
 * BuildGo Telegram WebApp Helpers
 * Reads user identity and initData from Telegram WebApp context.
 * initData is used for authentication — never logged or stored.
 */

export interface TelegramUser {
    telegram_id: number;
    first_name: string;
    last_name: string;
}

/**
 * Read the current Telegram user from WebApp context (display-only).
 * Returns null if not running inside Telegram.
 */
export function getTelegramUser(): TelegramUser | null {
    // @ts-ignore — Telegram WebApp global
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser || !tgUser.id) return null;

    return {
        telegram_id: tgUser.id,
        first_name: tgUser.first_name || '',
        last_name: tgUser.last_name || '',
    };
}

/**
 * Get raw initData string for authentication.
 * Returns null if not available (not running inside Telegram or dev mode).
 * SECURITY: Never log, store, or display this value.
 */
export function getInitData(): string | null {
    // @ts-ignore — Telegram WebApp global
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData || typeof initData !== 'string' || initData.length === 0) {
        return null;
    }
    return initData;
}

/**
 * Get auth headers for authenticated API requests.
 * Returns headers object with X-Telegram-Init-Data.
 * Returns empty object in dev mode (no Telegram context).
 */
export function getAuthHeaders(): Record<string, string> {
    const initData = getInitData();
    if (!initData) {
        return {};
    }
    return { 'X-Telegram-Init-Data': initData };
}

/**
 * Check if running inside Telegram WebApp.
 */
export function isInsideTelegram(): boolean {
    return getInitData() !== null;
}

/**
 * Base URL for API calls.
 * Always use relative paths — Vercel rewrites /api/* to https://buildgo.uz/api/*
 * server-side, avoiding CORS issues. In local dev, Vite proxy does the same.
 */
export const BASE_URL: string = '';
