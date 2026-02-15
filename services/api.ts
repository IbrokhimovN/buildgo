/**
 * BuildGo API Service
 * Complete API layer for Seller and Buyer apps.
 * All requests use authFetch for automatic JWT handling.
 */

import { authFetch, BASE_URL } from './authClient';

// --- Types matching Backend API ---

export interface ApiUser {
    id: number;
    telegram_id: number;
    first_name: string;
    last_name: string;
    phone: string;
    role: 'buyer' | 'seller';
    created_at: string;
}

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
    category: number;
    category_name: string;
    name: string;
    price: string; // Backend sends as string
    unit: 'qop' | 'dona' | 'kg' | 'm' | 'metr' | 'litr' | 'tonna';
    image: string | null;
    is_available: boolean;
    created_at: string;
}

export interface ApiLocation {
    id: number;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    is_default: boolean;
    created_at: string;
}

export interface ApiOrderItem {
    id: number;
    product: number;
    product_name: string;
    product_unit: string;
    quantity: number;
    price_at_order: string;
}

export interface ApiOrder {
    id: number;
    user: number;
    user_name: string;
    user_phone?: string;
    store: number;
    store_name: string;
    status: 'new' | 'done' | 'cancelled';
    items: ApiOrderItem[];
    location?: ApiLocation;
    created_at: string;
    updated_at: string;
}

export interface ApiSeller {
    id: number;
    user: ApiUser;
    store: ApiStore;
    is_active: boolean;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// --- API Error Handling ---

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

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.error || errorData.detail || `API error: ${response.status}`,
            response.status,
            errorData.details || errorData
        );
    }
    return response.json();
}

// --- Authentication API ---

export const authApi = {
    /**
     * Get current user profile
     */
    async getMe(): Promise<ApiUser> {
        const response = await authFetch(`${BASE_URL}/api/me/`);
        return handleResponse<ApiUser>(response);
    },

    /**
     * Get seller profile (requires seller role)
     */
    async getSellerProfile(): Promise<ApiSeller> {
        const response = await authFetch(`${BASE_URL}/api/seller/me/`);
        return handleResponse<ApiSeller>(response);
    },

    /**
     * Get seller dashboard data
     */
    async getSellerDashboard(): Promise<unknown> {
        const response = await authFetch(`${BASE_URL}/api/seller/dashboard/`);
        return handleResponse(response);
    },
};

// --- Buyer API ---

export const buyerApi = {
    /**
     * List all stores
     */
    async getStores(page = 1): Promise<PaginatedResponse<ApiStore>> {
        const response = await authFetch(`${BASE_URL}/api/stores/?page=${page}`);
        return handleResponse(response);
    },

    /**
     * Get categories for a store
     */
    async getStoreCategories(storeId: number): Promise<PaginatedResponse<ApiCategory>> {
        const response = await authFetch(`${BASE_URL}/api/stores/${storeId}/categories/`);
        return handleResponse(response);
    },

    /**
     * Get products for a store
     */
    async getStoreProducts(
        storeId: number,
        categoryId?: number,
        page = 1
    ): Promise<PaginatedResponse<ApiProduct>> {
        let url = `${BASE_URL}/api/stores/${storeId}/products/?page=${page}`;
        if (categoryId) url += `&category=${categoryId}`;
        const response = await authFetch(url);
        return handleResponse(response);
    },

    /**
     * Search products across all stores
     */
    async searchProducts(query: string): Promise<PaginatedResponse<ApiProduct>> {
        const response = await authFetch(`${BASE_URL}/api/search/?q=${encodeURIComponent(query)}`);
        return handleResponse(response);
    },

    /**
     * Create an order
     */
    async createOrder(data: {
        store: number;
        items: { product: number; quantity: number }[];
        location?: number;
        first_name?: string;
        last_name?: string;
        phone?: string;
    }): Promise<ApiOrder> {
        const response = await authFetch(`${BASE_URL}/api/orders/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiOrder>(response);
    },

    /**
     * Get buyer's order history
     */
    async getOrders(page = 1): Promise<PaginatedResponse<ApiOrder>> {
        const response = await authFetch(`${BASE_URL}/api/orders/?page=${page}`);
        return handleResponse(response);
    },

    /**
     * Get buyer's saved locations
     */
    async getLocations(): Promise<PaginatedResponse<ApiLocation>> {
        const response = await authFetch(`${BASE_URL}/api/locations/`);
        return handleResponse(response);
    },

    /**
     * Create a new location
     */
    async createLocation(data: {
        name: string;
        address: string;
        latitude?: number;
        longitude?: number;
        is_default?: boolean;
    }): Promise<ApiLocation> {
        const response = await authFetch(`${BASE_URL}/api/locations/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiLocation>(response);
    },

    /**
     * Update a location
     */
    async updateLocation(
        locationId: number,
        data: Partial<{
            name: string;
            address: string;
            latitude: number;
            longitude: number;
            is_default: boolean;
        }>
    ): Promise<ApiLocation> {
        const response = await authFetch(`${BASE_URL}/api/locations/${locationId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiLocation>(response);
    },

    /**
     * Delete a location
     */
    async deleteLocation(locationId: number): Promise<void> {
        const response = await authFetch(`${BASE_URL}/api/locations/${locationId}/`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(errorData.error || 'Failed to delete', response.status);
        }
    },
};

// --- Seller API ---

export const sellerApi = {
    /**
     * Get seller's orders
     */
    async getOrders(page = 1): Promise<PaginatedResponse<ApiOrder>> {
        const response = await authFetch(`${BASE_URL}/api/seller/orders/?page=${page}`);
        return handleResponse(response);
    },

    /**
     * Update order status
     */
    async updateOrderStatus(
        orderId: number,
        status: 'new' | 'done' | 'cancelled'
    ): Promise<ApiOrder> {
        const response = await authFetch(`${BASE_URL}/api/seller/orders/${orderId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        return handleResponse<ApiOrder>(response);
    },

    /**
     * Get seller's products
     */
    async getProducts(page = 1): Promise<PaginatedResponse<ApiProduct>> {
        const response = await authFetch(`${BASE_URL}/api/seller/products/?page=${page}`);
        return handleResponse(response);
    },

    /**
     * Create a new product
     */
    async createProduct(data: {
        category: number;
        name: string;
        price: string;
        unit: string;
        is_available?: boolean;
    }): Promise<ApiProduct> {
        const response = await authFetch(`${BASE_URL}/api/seller/products/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiProduct>(response);
    },

    /**
     * Update a product
     */
    async updateProduct(
        productId: number,
        data: Partial<{
            category: number;
            name: string;
            price: string;
            unit: string;
            is_available: boolean;
        }>
    ): Promise<ApiProduct> {
        const response = await authFetch(`${BASE_URL}/api/seller/products/${productId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiProduct>(response);
    },

    /**
     * Delete a product
     */
    async deleteProduct(productId: number): Promise<void> {
        const response = await authFetch(`${BASE_URL}/api/seller/products/${productId}/`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(errorData.error || 'Failed to delete', response.status);
        }
    },

    /**
     * Get seller's store categories
     */
    async getCategories(): Promise<PaginatedResponse<ApiCategory>> {
        // First get seller profile to get store ID, then get categories
        const profile = await authApi.getSellerProfile();
        const response = await authFetch(
            `${BASE_URL}/api/stores/${profile.store.id}/categories/`
        );
        return handleResponse(response);
    },

    /**
     * Get seller's locations
     */
    async getLocations(): Promise<PaginatedResponse<ApiLocation>> {
        const response = await authFetch(`${BASE_URL}/api/seller/locations/`);
        return handleResponse(response);
    },

    /**
     * Create seller location
     */
    async createLocation(data: {
        name: string;
        address: string;
        latitude?: number;
        longitude?: number;
        is_default?: boolean;
    }): Promise<ApiLocation> {
        const response = await authFetch(`${BASE_URL}/api/seller/locations/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiLocation>(response);
    },

    /**
     * Update seller location
     */
    async updateLocation(
        locationId: number,
        data: Partial<{
            name: string;
            address: string;
            latitude: number;
            longitude: number;
            is_default: boolean;
        }>
    ): Promise<ApiLocation> {
        const response = await authFetch(`${BASE_URL}/api/seller/locations/${locationId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiLocation>(response);
    },

    /**
     * Delete seller location
     */
    async deleteLocation(locationId: number): Promise<void> {
        const response = await authFetch(`${BASE_URL}/api/seller/locations/${locationId}/`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(errorData.error || 'Failed to delete', response.status);
        }
    },
};
