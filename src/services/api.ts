/**
 * BuildGo API Service
 * Centralized API layer with X-Telegram-Init-Data header injection.
 * All authenticated requests automatically include the auth header.
 * telegram_id is NEVER sent in query params or request body.
 */

import { BASE_URL, getAuthHeaders } from '@/services/telegram';

// ─── Types matching Backend API ───

export interface ApiStore {
    id: number;
    name: string;
    image: string | null;
    is_active: boolean;
    created_at: string;
}

export interface ApiCategory {
    id: number;
    name: string;
    store: number;
}

export interface ApiProduct {
    id: number;
    store: number;
    store_name: string;
    category: number | null;
    category_name: string | null;
    name: string;
    description: string | null;
    price: string; // Backend sends as string
    unit: 'qop' | 'dona' | 'kg' | 'm';
    quantity: number;
    image: string | null;
    is_available: boolean;
    created_at: string;
}

export interface ApiLocation {
    id: number;
    name: string;
    address: string;
    latitude?: string;
    longitude?: string;
    customer: number | null;
    customer_name: string | null;
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
    customer: number;
    customer_name: string;
    customer_phone?: string;
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

export interface ApiCustomer {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    created_at: string;
    // Note: telegram_id is write-only, NOT returned in responses
}

export interface ApiSellerStore {
    id: number;
    name: string;
    image: string | null;
    is_active: boolean;
    created_at: string;
}

export interface ApiSeller {
    id: number;
    telegram_id: number;
    name: string;
    store: ApiSellerStore;
    is_active: boolean;
    created_at: string;
}

export interface CheckSellerResponse {
    is_seller: boolean;
    seller?: ApiSeller;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// ─── Error Classes ───

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

/** 401 — Invalid or missing initData */
export class AuthError extends ApiError {
    constructor(message: string = "Ilovani Telegram orqali qayta oching", details?: unknown) {
        super(message, 401, details);
        this.name = 'AuthError';
    }
}

/** 403 — Not a seller or permission denied */
export class ForbiddenError extends ApiError {
    constructor(message: string = "Ruxsat berilmagan", details?: unknown) {
        super(message, 403, details);
        this.name = 'ForbiddenError';
    }
}

/** 404 — Resource not found */
export class NotFoundError extends ApiError {
    constructor(message: string = "Ma'lumot topilmadi", details?: unknown) {
        super(message, 404, details);
        this.name = 'NotFoundError';
    }
}

/** 429 — Rate limited */
export class RateLimitError extends ApiError {
    retryAfter: number; // seconds

    constructor(message: string = "Iltimos, biroz kutib qayta urinib ko'ring", retryAfterSeconds: number = 30, details?: unknown) {
        super(message, 429, details);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfterSeconds;
    }
}

// ─── Centralized API Fetch ───

/**
 * Core fetch wrapper. ALL API calls go through this function.
 * - Public calls: pass `auth: false` (default)
 * - Authenticated calls: pass `auth: true` to inject X-Telegram-Init-Data
 */
async function apiFetch<T>(
    url: string,
    options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
    const { auth = false, headers: customHeaders, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        ...(customHeaders as Record<string, string> || {}),
    };

    // Inject auth header for authenticated requests
    if (auth) {
        const authHeaders = getAuthHeaders();
        Object.assign(headers, authHeaders);
    }

    // Timeout: abort fetch after 15s to prevent hanging in Telegram WebView
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    try {
        response = await fetch(`${BASE_URL}${url}`, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
        });
    } catch (networkError) {
        clearTimeout(timeoutId);
        // AbortError from timeout
        if (networkError instanceof DOMException && networkError.name === 'AbortError') {
            throw new ApiError(
                "So'rov vaqti tugadi. Internet aloqasini tekshiring.",
                0,
                { originalError: 'Request timeout (15s)' }
            );
        }
        // TypeError: Failed to fetch — network unreachable, CORS, mixed-content
        throw new ApiError(
            "Tarmoq xatoligi. Internet aloqasini tekshiring.",
            0,
            { originalError: String(networkError) }
        );
    }
    clearTimeout(timeoutId);

    // Handle specific error codes
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Extract validation errors or specific messages
        let errorMessage = "Xatolik yuz berdi";

        if (typeof errorData === 'string') {
            errorMessage = errorData;
        } else if (errorData.error) {
            errorMessage = errorData.error;
        } else if (errorData.detail) {
            errorMessage = errorData.detail;
        } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            // It's likely a DRF validation error object (e.g. { name: ["This field is required."] })
            const firstKey = Object.keys(errorData)[0];
            const firstError = errorData[firstKey];
            if (Array.isArray(firstError)) {
                errorMessage = `${firstKey}: ${firstError[0]}`;
            } else if (typeof firstError === 'string') {
                errorMessage = `${firstKey}: ${firstError}`;
            } else {
                errorMessage = JSON.stringify(errorData);
            }
        } else {
            errorMessage = `API error: ${response.status}`;
        }

        switch (response.status) {
            case 401:
                throw new AuthError("Session expired. Please close and reopen the Mini App.", errorData);
            case 403:
                throw new ForbiddenError(errorMessage, errorData);
            case 404:
                throw new NotFoundError(errorMessage, errorData);
            case 429: {
                const retryAfterHeader = response.headers.get('retry-after');
                const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 30;
                throw new RateLimitError(errorMessage, retryAfter, errorData);
            }
            default:
                throw new ApiError(errorMessage, response.status, errorData);
        }
    }

    // 204 No Content
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

/** Helper for JSON POST/PATCH with auth */
function authJsonFetch<T>(url: string, method: string, body?: unknown): Promise<T> {
    return apiFetch<T>(url, {
        method,
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
}

// ─── Public Endpoints (No Auth) ───

export const publicApi = {
    /** List all active stores */
    async getStores(page = 1): Promise<PaginatedResponse<ApiStore>> {
        return apiFetch(`/api/stores/?page=${page}`);
    },

    /** Get categories for a store */
    async getStoreCategories(storeId: number): Promise<PaginatedResponse<ApiCategory>> {
        return apiFetch(`/api/stores/${storeId}/categories/`);
    },

    /** Get products for a store, optionally filtered by category */
    async getStoreProducts(
        storeId: number,
        categoryId?: number,
        page = 1
    ): Promise<PaginatedResponse<ApiProduct>> {
        let url = `/api/stores/${storeId}/products/?page=${page}`;
        if (categoryId) url += `&category=${categoryId}`;
        return apiFetch(url);
    },

    /** Search products across all stores */
    async searchProducts(query: string, page = 1): Promise<PaginatedResponse<ApiProduct>> {
        return apiFetch(`/api/search/?q=${encodeURIComponent(query)}&page=${page}`);
    },
};

// ─── Buyer Endpoints (Authenticated via initData) ───

export const buyerApi = {
    // Re-export public endpoints for convenience
    ...publicApi,

    /** Create an order (store is determined by cart items) */
    async createOrder(data: {
        store: number;
        items: { product: number; quantity: number }[];
    }): Promise<ApiOrder> {
        return authJsonFetch('/api/orders/', 'POST', data);
    },

    /** Get customer's order history */
    async getOrders(page = 1): Promise<PaginatedResponse<ApiOrder>> {
        return apiFetch(`/api/orders/my/?page=${page}`, { auth: true });
    },

    /** List customer's saved locations */
    async getLocations(): Promise<ApiLocation[]> {
        const res: any = await apiFetch('/api/locations/', { auth: true });
        if (res && typeof res === 'object' && 'results' in res) {
            return res.results;
        }
        return res || [];
    },

    /** Create a new customer location */
    async createLocation(data: {
        name: string;
        latitude?: number | string;
        longitude?: number | string;
        address: string;
        is_default?: boolean;
    }): Promise<ApiLocation> {
        const payload = { ...data };
        if (payload.latitude !== undefined) payload.latitude = Number(payload.latitude).toFixed(6);
        if (payload.longitude !== undefined) payload.longitude = Number(payload.longitude).toFixed(6);
        return authJsonFetch('/api/locations/', 'POST', payload);
    },

    /** Update a customer location */
    async updateLocation(
        locationId: number,
        data: {
            name?: string;
            address?: string;
            latitude?: number | string;
            longitude?: number | string;
            is_default?: boolean;
        }
    ): Promise<ApiLocation> {
        const payload = { ...data };
        if (payload.latitude !== undefined) payload.latitude = Number(payload.latitude).toFixed(6);
        if (payload.longitude !== undefined) payload.longitude = Number(payload.longitude).toFixed(6);
        return authJsonFetch(`/api/locations/${locationId}/`, 'PATCH', payload);
    },

    /** Delete a customer location */
    async deleteLocation(locationId: number): Promise<void> {
        return apiFetch(`/api/locations/${locationId}/`, {
            method: 'DELETE',
            auth: true,
        });
    },
};

// ─── Seller Endpoints (Authenticated via initData) ───

export const sellerApi = {
    /** Get seller's store orders */
    async getOrders(page = 1): Promise<PaginatedResponse<ApiOrder>> {
        return apiFetch(`/api/seller/orders/?page=${page}`, { auth: true });
    },

    /** Update order status */
    async updateOrderStatus(
        orderId: number,
        status: OrderStatus
    ): Promise<ApiOrder> {
        return authJsonFetch(`/api/seller/orders/${orderId}/`, 'PATCH', { status });
    },

    /** Create a new product (store auto-assigned from seller profile) */
    async createProduct(data: {
        category: number;
        name: string;
        description?: string;
        price: string;
        unit: string;
        quantity: number;
        image?: File | null;
        is_available?: boolean;
    }): Promise<ApiProduct> {
        const formData = new FormData();
        formData.append('category', String(data.category));
        formData.append('name', data.name);
        if (data.description !== undefined) formData.append('description', data.description);
        formData.append('price', data.price);
        formData.append('unit', data.unit);
        formData.append('quantity', String(data.quantity));
        if (data.is_available !== undefined) {
            formData.append('is_available', String(data.is_available));
        }
        if (data.image) {
            formData.append('image', data.image);
        }

        return apiFetch('/api/seller/products/', {
            method: 'POST',
            auth: true,
            body: formData,
        });
    },

    /** Update a product */
    async updateProduct(
        productId: number,
        data: {
            category?: number;
            name?: string;
            description?: string;
            price?: string;
            unit?: string;
            quantity?: number;
            image?: File | null;
            is_available?: boolean;
        }
    ): Promise<ApiProduct> {
        const formData = new FormData();
        if (data.category !== undefined) formData.append('category', String(data.category));
        if (data.name !== undefined) formData.append('name', data.name);
        if (data.description !== undefined) formData.append('description', data.description);
        if (data.price !== undefined) formData.append('price', data.price);
        if (data.unit !== undefined) formData.append('unit', data.unit);
        if (data.quantity !== undefined) formData.append('quantity', String(data.quantity));
        if (data.is_available !== undefined) formData.append('is_available', String(data.is_available));
        if (data.image) {
            formData.append('image', data.image);
        }

        return apiFetch(`/api/seller/products/${productId}/`, {
            method: 'PATCH',
            auth: true,
            body: formData,
        });
    },

    /** Soft-delete a product (sets is_available = false) */
    async deleteProduct(productId: number): Promise<void> {
        return apiFetch(`/api/seller/products/${productId}/`, {
            method: 'DELETE',
            auth: true,
        });
    },

    /** Create a category for seller's store */
    async createCategory(data: { name: string }): Promise<ApiCategory> {
        return authJsonFetch('/api/seller/categories/', 'POST', data);
    },

    /** Get categories for a store (public endpoint wrapper) */
    async getCategories(storeId: number): Promise<PaginatedResponse<ApiCategory>> {
        return publicApi.getStoreCategories(storeId);
    },

    /** Get seller profile + store info (used during bootstrap) */
    async getProfile(): Promise<CheckSellerResponse> {
        return apiFetch('/api/seller/profile/', { auth: true });
    },

    /** Get seller's own categories (authenticated, no storeId needed) */
    async getSellerCategories(): Promise<PaginatedResponse<ApiCategory>> {
        return apiFetch('/api/seller/categories/', { auth: true });
    },

    /** Get seller's store products (public endpoint wrapper) */
    async getProducts(storeId: number, page = 1): Promise<PaginatedResponse<ApiProduct>> {
        return publicApi.getStoreProducts(storeId, undefined, page);
    },

    /** Get seller's own products (authenticated, no storeId needed) */
    async getSellerProducts(page = 1): Promise<PaginatedResponse<ApiProduct>> {
        return apiFetch(`/api/seller/products/?page=${page}`, { auth: true });
    },

    /** List seller's store locations */
    async getLocations(): Promise<ApiLocation[]> {
        const res: any = await apiFetch('/api/seller/locations/', { auth: true });
        if (res && typeof res === 'object' && 'results' in res) {
            return res.results;
        }
        return res || [];
    },

    /** Create a store location */
    async createLocation(data: {
        name: string;
        latitude?: number | string;
        longitude?: number | string;
        address: string;
        is_default?: boolean;
    }): Promise<ApiLocation> {
        const payload = { ...data };
        if (payload.latitude !== undefined) payload.latitude = Number(payload.latitude).toFixed(6);
        if (payload.longitude !== undefined) payload.longitude = Number(payload.longitude).toFixed(6);
        return authJsonFetch('/api/seller/locations/', 'POST', payload);
    },

    /** Update a store location */
    async updateLocation(
        locationId: number,
        data: {
            name?: string;
            address?: string;
            latitude?: number | string;
            longitude?: number | string;
            is_default?: boolean;
        }
    ): Promise<ApiLocation> {
        const payload = { ...data };
        if (payload.latitude !== undefined) payload.latitude = Number(payload.latitude).toFixed(6);
        if (payload.longitude !== undefined) payload.longitude = Number(payload.longitude).toFixed(6);
        return authJsonFetch(`/api/seller/locations/${locationId}/`, 'PATCH', payload);
    },

    /** Delete a store location */
    async deleteLocation(locationId: number): Promise<void> {
        return apiFetch(`/api/seller/locations/${locationId}/`, {
            method: 'DELETE',
            auth: true,
        });
    },
};
