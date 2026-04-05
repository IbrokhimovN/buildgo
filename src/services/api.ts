/**
 * services/api.ts
 *
 * Tuzatishlar (oldingi versiyadan):
 * 1. CheckSellerResponse → seller yo'q, user + store bor
 * 2. Cart URL: /api/cart/ (eski: /api/customer/cart/)
 * 3. addToCart: { product, variant } (eski: { product_id, variant_id })
 * 4. ApiOrder: customer → user, customer_name → user_name
 * 5. ApiSellerAnalytics: orders_today → orders, revenue_today → revenue
 * 6. Cart conflict → 409 status qaytaradi, o'zi tozalamasin
 */

import { BASE_URL, getAuthHeaders } from '@/services/telegram';

// ─── JWT token management ────────────────────────────────────

const TOKEN_KEYS = {
  access: 'buildgo_access_token',
  refresh: 'buildgo_refresh_token',
};

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.access);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.refresh);
}
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEYS.access, access);
  localStorage.setItem(TOKEN_KEYS.refresh, refresh);
}
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
}

// ─── Types ───────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  telegram_id: number | null;
  phone_number: string | null;
  email: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  is_seller: boolean;
  is_pending_seller: boolean;
  is_registered: boolean;
  identities?: { id: number; provider: string; uid: string }[];
}

export interface ApiStore {
  id: number;
  name: string;
  description: string;
  phone: string;
  image: string | null;
  is_active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  legal_name?: string;
  inn?: string;
  average_rating?: number;
  ratings_count?: number;
  is_open?: boolean;
  working_hours?: ApiSellerWorkingHour[];
  categories?: string[];
  created_at: string;
}

export interface ApiCategory {
  id: number;
  name: string;
  icon?: string | null;
  store: number | null;
}

export interface ApiProductImage {
  id: number;
  image: string;
  order: number;
}

export interface ApiProductAttribute {
  id: number;
  attribute_name: string;
  value: string;
}

export interface ApiProductVariant {
  id: number;
  sku: string | null;
  price: string;
  quantity: number;
  attributes: ApiProductAttribute[];
}

export interface ApiProduct {
  id: number;
  store: number;
  store_name: string;
  category: number | null;
  category_name: string | null;
  name: string;
  description: string | null;
  price: string;
  old_price: string | null;
  installment_price: string | null;
  rating: number;
  reviews_count: number;
  unit: 'qop' | 'dona' | 'kg' | 'm' | 'm2';
  quantity: number;
  image: string | null;
  is_available: boolean;
  created_at?: string;
  images?: ApiProductImage[];
  variants?: ApiProductVariant[];
}

export interface ApiCartItem {
  id: number;
  product: ApiProduct;
  variant: ApiProductVariant | null;
  quantity: number;
  created_at: string;
}

export interface ApiCartResponse {
  items: ApiCartItem[];
  store: { id: number; name: string; image: string | null } | null;
  total: number;
  count: number;
}

export interface ApiLocation {
  id: number;
  name: string;
  address: string;
  latitude?: string;
  longitude?: string;
  user: number | null;
  user_name: string | null;
  store: number | null;
  store_name: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiOrderItem {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  quantity: number;
  price_at_order: string;
}

export type OrderStatus = 'new' | 'processing' | 'done' | 'cancelled';

export interface ApiOrder {
  id: number;
  user: number;
  user_name: string;
  user_phone?: string;
  store: number;
  store_name: string;
  status: OrderStatus;
  items: ApiOrderItem[];
  location?: {
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ApiTopProduct {
  id: number;
  name: string;
  sold: number;
}

/** Yangilangan — orders_today → orders, revenue_today → revenue */
export interface ApiSellerAnalytics {
  revenue: number;
  orders: number;
  delivered: number;
  pending: number;
  average_check: number;
  chart: number[];
  top_products: ApiTopProduct[];
}

export interface ApiSellerWorkingHour {
  id?: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

/** Yangilangan — seller yo'q, user + store bor */
export interface CheckSellerResponse {
  is_seller: boolean;
  is_pending_seller?: boolean;
  user?: ApiUser;
  store?: ApiStore;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Error classes ───────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Ilovani Telegram orqali qayta oching', details?: unknown) {
    super(message, 401, details);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Ruxsat berilmagan', details?: unknown) {
    super(message, 403, details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Ma'lumot topilmadi", details?: unknown) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  conflict: boolean;
  existingStore?: { id: number; name: string; image: string | null };
  newStore?: { id: number; name: string; image: string | null };
  constructor(message: string, details?: unknown) {
    super(message, 409, details);
    this.name = 'ConflictError';
    this.conflict = true;
    if (details && typeof details === 'object') {
      const d = details as any;
      this.existingStore = d.existing_store;
      this.newStore = d.new_store;
    }
  }
}

export class RateLimitError extends ApiError {
  retryAfter: number;
  constructor(message = "Iltimos, biroz kutib qayta urinib ko'ring", retryAfterSeconds = 30, details?: unknown) {
    super(message, 429, details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfterSeconds;
  }
}

// ─── Core fetch ──────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers: customHeaders, ...fetchOptions } = options;
  const headers: Record<string, string> = { ...(customHeaders as Record<string, string> || {}) };

  if (auth) Object.assign(headers, getAuthHeaders());

  const jwtToken = getAccessToken();
  if (jwtToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${url}`, { ...fetchOptions, headers, signal: controller.signal });
  } catch (networkError) {
    clearTimeout(timeoutId);
    if (networkError instanceof DOMException && networkError.name === 'AbortError') {
      throw new ApiError("So'rov vaqti tugadi.", 0);
    }
    throw new ApiError("Tarmoq xatoligi. Internetni tekshiring.", 0);
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // JWT refresh
    if (response.status === 401) {
      const refreshToken = getRefreshToken();
      const isRetry = (options as any)._retry;
      if (refreshToken && !isRetry) {
        try {
          const refreshResponse = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem(TOKEN_KEYS.access, refreshData.access);
            return apiFetch<T>(url, { ...options, _retry: true } as any);
          }
        } catch {}
        clearTokens();
        window.dispatchEvent(new CustomEvent('buildgo:logout'));
      }
      throw new AuthError(errorData?.error || 'Session muddati tugadi.', errorData);
    }

    const errorMessage = errorData?.error || errorData?.detail || `API xatosi: ${response.status}`;

    switch (response.status) {
      case 403: throw new ForbiddenError(errorMessage, errorData);
      case 404: throw new NotFoundError(errorMessage, errorData);
      case 409: throw new ConflictError(errorMessage, errorData);
      case 429: {
        const retryAfter = parseInt(response.headers.get('retry-after') || '30', 10);
        throw new RateLimitError(errorMessage, retryAfter, errorData);
      }
      default: throw new ApiError(errorMessage, response.status, errorData);
    }
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

function authJsonFetch<T>(url: string, method: string, body?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method,
    auth: true,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── Auth API ────────────────────────────────────────────────

export const authApi = {
  /** Mini App: initData → JWT */
  async telegramAuth(): Promise<{ access: string; refresh: string; user: ApiUser; store?: ApiStore }> {
    const result = await apiFetch<any>('/api/auth/telegram/', { method: 'POST', auth: true });
    if (result.access) setTokens(result.access, result.refresh);
    return result;
  },

  /** Bot: User yaratish */
  async registerUser(data: { telegram_id: number; first_name: string; last_name: string; phone?: string }): Promise<{ access: string; refresh: string; user: ApiUser }> {
    return apiFetch('/api/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Bot-Secret': '' },
      body: JSON.stringify(data),
    });
  },

  async registerStore(data: { name: string }): Promise<{ message: string; store: ApiStore }> {
    return authJsonFetch('/api/auth/register-store/', 'POST', data);
  },

  async verifyStore(data: { legal_name: string; inn: string; documents: File[]; document_types: string[] }): Promise<{ message: string; store_status: string }> {
    const formData = new FormData();
    formData.append('legal_name', data.legal_name);
    formData.append('inn', data.inn);
    data.documents.forEach(f => formData.append('documents', f));
    data.document_types.forEach(t => formData.append('document_types', t));
    return apiFetch('/api/auth/verify-store/', { method: 'POST', auth: true, body: formData });
  },

  async setPassword(data: { phone_number: string; password: string }): Promise<{ message: string }> {
    return authJsonFetch('/api/auth/set-password/', 'POST', data);
  },

  async webLogin(data: { phone_number: string; password: string }): Promise<{ access: string; refresh: string }> {
    const result = await apiFetch<any>('/api/auth/web-login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setTokens(result.access, result.refresh);
    return result;
  },

  async refreshToken(): Promise<{ access: string }> {
    const refresh = getRefreshToken();
    if (!refresh) throw new AuthError('Refresh token mavjud emas');
    const result = await apiFetch<any>('/api/auth/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    localStorage.setItem(TOKEN_KEYS.access, result.access);
    return result;
  },

  logout(): void { clearTokens(); },
};

// ─── Public API ──────────────────────────────────────────────

export const publicApi = {
  async getStores(page = 1, categoryId?: number): Promise<PaginatedResponse<ApiStore>> {
    let url = `/api/stores/?page=${page}`;
    if (categoryId) url += `&category_id=${categoryId}`;
    return apiFetch(url);
  },

  async getCategories(): Promise<PaginatedResponse<ApiCategory>> {
    return apiFetch('/api/categories/');
  },

  async getStoreCategories(storeId: number): Promise<PaginatedResponse<ApiCategory>> {
    return apiFetch(`/api/stores/${storeId}/categories/`);
  },

  async getStoreProducts(storeId: number, categoryId?: number, page = 1): Promise<PaginatedResponse<ApiProduct>> {
    let url = `/api/stores/${storeId}/products/?page=${page}`;
    if (categoryId) url += `&category=${categoryId}`;
    return apiFetch(url);
  },

  async getProductDetail(productId: number): Promise<ApiProduct> {
    return apiFetch(`/api/products/${productId}/`);
  },

  async getRelatedProducts(productId: number): Promise<ApiProduct[]> {
    const res: unknown = await apiFetch(`/api/products/${productId}/related/`);
    return Array.isArray(res) ? res as ApiProduct[] : [];
  },

  async searchProducts(query: string): Promise<{ products: ApiProduct[]; stores: ApiStore[]; categories: ApiCategory[] }> {
    return apiFetch(`/api/search/?q=${encodeURIComponent(query)}`);
  },

  async getSearchSuggestions(query: string): Promise<{ suggestions: string[] }> {
    return apiFetch(`/api/search/suggestions/?q=${encodeURIComponent(query)}`);
  },
};

// ─── Buyer API ───────────────────────────────────────────────

export const buyerApi = {
  ...publicApi,

  // Cart — barcha URL lar /api/cart/ (tuzatildi)
  async getCart(): Promise<ApiCartResponse> {
    return apiFetch('/api/cart/', { auth: true });
  },

  /**
   * Mahsulot qo'shish.
   * 409 ConflictError bo'lsa — frontend foydalanuvchidan so'raydi.
   * Field nomlari: { product, variant } (tuzatildi)
   */
  async addToCart(productId: number, variantId?: number, quantity = 1): Promise<ApiCartResponse> {
    return authJsonFetch('/api/cart/', 'POST', {
      product: productId,
      variant: variantId || undefined,
      quantity,
    });
  },

  async updateCartItem(itemId: number, quantity: number): Promise<ApiCartItem> {
    return authJsonFetch(`/api/cart/${itemId}/`, 'PATCH', { quantity });
  },

  async deleteCartItem(itemId: number): Promise<void> {
    return apiFetch(`/api/cart/${itemId}/`, { method: 'DELETE', auth: true });
  },

  /** Savatchani to'liq tozalash — DELETE /api/cart/ */
  async clearCart(): Promise<void> {
    return apiFetch('/api/cart/', { method: 'DELETE', auth: true });
  },

  // Orders
  async createOrder(data: { from_cart?: boolean; store?: number; items?: { product: number; quantity: number }[] }): Promise<ApiOrder> {
    return authJsonFetch('/api/orders/', 'POST', data);
  },

  async getOrders(page = 1): Promise<PaginatedResponse<ApiOrder>> {
    return apiFetch(`/api/orders/my/?page=${page}`, { auth: true });
  },

  async hasActiveOrder(): Promise<boolean> {
    try {
      const res: any = await apiFetch('/api/customer/active-order/', { auth: true });
      return res?.has_active_order || false;
    } catch { return false; }
  },

  // Locations
  async getLocations(): Promise<ApiLocation[]> {
    const res: any = await apiFetch('/api/locations/', { auth: true });
    return Array.isArray(res) ? res : (res?.results || []);
  },

  async createLocation(data: { name: string; latitude?: number | string; longitude?: number | string; address: string; is_default?: boolean }): Promise<ApiLocation> {
    const payload = { ...data };
    if (payload.latitude !== undefined) payload.latitude = Number(payload.latitude).toFixed(6);
    if (payload.longitude !== undefined) payload.longitude = Number(payload.longitude).toFixed(6);
    return authJsonFetch('/api/locations/', 'POST', payload);
  },

  async updateLocation(locationId: number, data: Partial<{ name: string; address: string; latitude: number | string; longitude: number | string; is_default: boolean }>): Promise<ApiLocation> {
    const payload = { ...data };
    if (payload.latitude !== undefined) payload.latitude = Number(payload.latitude).toFixed(6);
    if (payload.longitude !== undefined) payload.longitude = Number(payload.longitude).toFixed(6);
    return authJsonFetch(`/api/locations/${locationId}/`, 'PATCH', payload);
  },

  async deleteLocation(locationId: number): Promise<void> {
    return apiFetch(`/api/locations/${locationId}/`, { method: 'DELETE', auth: true });
  },

  async rateStore(storeId: number, rating: number): Promise<void> {
    return authJsonFetch(`/api/stores/${storeId}/rate/`, 'POST', { rating });
  },
};

// ─── Seller API ──────────────────────────────────────────────

export const sellerApi = {
  /** Profil — yangi format: { is_seller, user, store } */
  async getProfile(): Promise<CheckSellerResponse> {
    return apiFetch('/api/seller/profile/', { auth: true });
  },

  /** Analytics — yangi field nomlari: orders, revenue */
  async getAnalytics(range: 'daily' | 'weekly' | 'monthly' | 'all' = 'daily'): Promise<ApiSellerAnalytics> {
    return apiFetch(`/api/seller/analytics/?range=${range}`, { auth: true });
  },

  async getOrders(page = 1, statusFilter?: string): Promise<PaginatedResponse<ApiOrder>> {
    let url = `/api/seller/orders/?page=${page}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    return apiFetch(url, { auth: true });
  },

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<ApiOrder> {
    return authJsonFetch(`/api/seller/orders/${orderId}/`, 'PATCH', { status });
  },

  async getSellerProducts(page = 1): Promise<PaginatedResponse<ApiProduct>> {
    return apiFetch(`/api/seller/products/?page=${page}`, { auth: true });
  },

  async createProduct(data: { category: number; name: string; description?: string; price: string; unit: string; quantity: number; image?: File | null; is_available?: boolean }): Promise<ApiProduct> {
    const formData = new FormData();
    formData.append('category', String(data.category));
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('unit', data.unit);
    formData.append('quantity', String(data.quantity));
    if (data.is_available !== undefined) formData.append('is_available', String(data.is_available));
    if (data.image) formData.append('image', data.image);
    return apiFetch('/api/seller/products/', { method: 'POST', auth: true, body: formData });
  },

  async updateProduct(productId: number, data: Partial<{ category: number; name: string; description: string; price: string; unit: string; quantity: number; image: File | null; is_available: boolean }>): Promise<ApiProduct> {
    const formData = new FormData();
    if (data.category !== undefined) formData.append('category', String(data.category));
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.price !== undefined) formData.append('price', data.price);
    if (data.unit !== undefined) formData.append('unit', data.unit);
    if (data.quantity !== undefined) formData.append('quantity', String(data.quantity));
    if (data.is_available !== undefined) formData.append('is_available', String(data.is_available));
    if (data.image) formData.append('image', data.image);
    return apiFetch(`/api/seller/products/${productId}/`, { method: 'PATCH', auth: true, body: formData });
  },

  async deleteProduct(productId: number): Promise<void> {
    return apiFetch(`/api/seller/products/${productId}/`, { method: 'DELETE', auth: true });
  },

  async getSellerCategories(): Promise<PaginatedResponse<ApiCategory>> {
    return apiFetch('/api/seller/categories/', { auth: true });
  },

  async createCategory(data: { name: string }): Promise<ApiCategory> {
    return authJsonFetch('/api/seller/categories/', 'POST', data);
  },

  async updateStore(data: { name?: string; description?: string; phone?: string; image?: File | null; working_hours?: Omit<ApiSellerWorkingHour, 'id'>[] }): Promise<ApiStore> {
    const formData = new FormData();
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.phone !== undefined) formData.append('phone', data.phone);
    if (data.image) formData.append('image', data.image);
    if (data.working_hours !== undefined) formData.append('working_hours_json', JSON.stringify(data.working_hours));
    return apiFetch('/api/seller/store/', { method: 'PATCH', auth: true, body: formData });
  },

  async getLocations(): Promise<ApiLocation[]> {
    const res: any = await apiFetch('/api/seller/locations/', { auth: true });
    return Array.isArray(res) ? res : (res?.results || []);
  },

  async createLocation(data: { name: string; latitude?: number | string; longitude?: number | string; address: string; is_default?: boolean }): Promise<ApiLocation> {
    const payload = { ...data };
    if (payload.latitude !== undefined) payload.latitude = Number(payload.latitude).toFixed(6);
    if (payload.longitude !== undefined) payload.longitude = Number(payload.longitude).toFixed(6);
    return authJsonFetch('/api/seller/locations/', 'POST', payload);
  },

  async deleteLocation(locationId: number): Promise<void> {
    return apiFetch(`/api/seller/locations/${locationId}/`, { method: 'DELETE', auth: true });
  },
};
