/**
 * BuildGo Telegram Identity Helper
 * Reads user identity from Telegram WebApp context.
 * No auth, no tokens — just telegram_id.
 */

export interface TelegramUser {
    telegram_id: number;
    first_name: string;
    last_name: string;
}

/**
 * Read the current Telegram user from WebApp context.
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
 * Base URL for API calls.
 * In Telegram (production): full domain.
 * In local dev (no Telegram context): empty string (Vite proxy handles /api).
 */
// @ts-ignore
export const BASE_URL: string = window.Telegram?.WebApp?.initData ? 'https://buildgo.uz' : '';
