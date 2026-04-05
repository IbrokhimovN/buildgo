/**
 * services/telegram.ts
 * Telegram WebApp yordamchi funksiyalari.
 */

export interface TelegramUser {
  telegram_id: number;
  first_name: string;
  last_name: string;
  username?: string;
}

export function getTelegramUser(): TelegramUser | null {
  // @ts-ignore
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!tgUser?.id) return null;
  return {
    telegram_id: tgUser.id,
    first_name: tgUser.first_name || '',
    last_name: tgUser.last_name || '',
    username: tgUser.username,
  };
}

export function getInitData(): string | null {
  // @ts-ignore
  const initData = window.Telegram?.WebApp?.initData;
  if (!initData || typeof initData !== 'string' || initData.length === 0) return null;
  return initData;
}

export function getAuthHeaders(): Record<string, string> {
  const initData = getInitData();
  if (!initData) return {};
  return { 'X-Telegram-Init-Data': initData };
}

export function isInsideTelegram(): boolean {
  return getInitData() !== null;
}

// Barcha API so'rovlari uchun base URL — relative path
export const BASE_URL: string = 'https://buildgo.uz';
