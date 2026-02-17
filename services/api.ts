/**
 * BuildGo API Service
 * Complete API layer for Seller and Buyer apps.
 * NO authentication — uses telegram_id for identity.
 */

import { BASE_URL } from './telegram';

// --- Types matching Backend API ---

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

export interface ApiOrder {
    id: number;
    customer: number;
    customer_name: string;
    store: number;
    store_name: string;
    status: 'new' | 'done';
    items: ApiOrderItem[];
    created_at: string;
    updated_at: string;
}

export interface ApiCustomer {
    id: number;
    telegram_id: number;
    first_name: string;
    last_name: string;
    phone: string;
    created_at: string;
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

// --- Seller Check ---

export async function checkSeller(telegramId: number): Promise<CheckSellerResponse> {
    const response = await fetch(`${BASE_URL}/api/check-seller/?telegram_id=${telegramId}`);
    return handleResponse<CheckSellerResponse>(response);
}

// --- Customer API ---

export async function createOrUpdateCustomer(data: {
    telegram_id: number;
    first_name: string;
    last_name: string;
    phone: string;
}): Promise<ApiCustomer> {
    const response = await fetch(`${BASE_URL}/api/customers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<ApiCustomer>(response);
}

export async function getCustomer(telegramId: number): Promise<ApiCustomer | null> {
    try {
        const response = await fetch(`${BASE_URL}/api/customers/?telegram_id=${telegramId}`);
        if (response.status === 404) return null;
        return handleResponse<ApiCustomer>(response);
    } catch {
        return null;
    }
}

// --- Buyer API ---

export const buyerApi = {
    /**
     * List all stores (public, no identity needed)
     */
    async getStores(page = 1): Promise<PaginatedResponse<ApiStore>> {
        const response = await fetch(`${BASE_URL}/api/stores/?page=${page}`);
        return handleResponse(response);
    },

    /**
     * Get categories for a store (public)
     */
    async getStoreCategories(storeId: number): Promise<PaginatedResponse<ApiCategory>> {
        const response = await fetch(`${BASE_URL}/api/stores/${storeId}/categories/`);
        return handleResponse(response);
    },

    /**
     * Get products for a store (public)
     */
    async getStoreProducts(
        storeId: number,
        categoryId?: number,
        page = 1
    ): Promise<PaginatedResponse<ApiProduct>> {
        let url = `${BASE_URL}/api/stores/${storeId}/products/?page=${page}`;
        if (categoryId) url += `&category=${categoryId}`;
        const response = await fetch(url);
        return handleResponse(response);
    },

    /**
     * Search products across all stores (public)
     */
    async searchProducts(query: string): Promise<PaginatedResponse<ApiProduct>> {
        const response = await fetch(`${BASE_URL}/api/search/?q=${encodeURIComponent(query)}`);
        return handleResponse(response);
    },

    /**
     * Create an order (requires telegram_id)
     */
    async createOrder(data: {
        telegram_id: number;
        store: number;
        items: { product: number; quantity: number }[];
    }): Promise<ApiOrder> {
        const response = await fetch(`${BASE_URL}/api/orders/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiOrder>(response);
    },

    /**
     * Get buyer's saved locations (requires telegram_id)
     */
    async getLocations(telegramId: number): Promise<ApiLocation[]> {
        const response = await fetch(`${BASE_URL}/api/locations/?telegram_id=${telegramId}`);
        return handleResponse(response);
    },

    /**
     * Create a new location (requires telegram_id)
     */
    async createLocation(data: {
        telegram_id: number;
        name: string;
        latitude?: number;
        longitude?: number;
        address: string;
        is_default?: boolean;
    }): Promise<ApiLocation> {
        const response = await fetch(`${BASE_URL}/api/locations/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiLocation>(response);
    },

    /**
     * Update a location (requires telegram_id)
     */
    async updateLocation(
        locationId: number,
        data: {
            telegram_id: number;
            name?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
            is_default?: boolean;
        }
    ): Promise<ApiLocation> {
        const response = await fetch(`${BASE_URL}/api/locations/${locationId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiLocation>(response);
    },

    /**
     * Delete a location (requires telegram_id)
     */
    async deleteLocation(locationId: number, telegramId: number): Promise<void> {
        const response = await fetch(
            `${BASE_URL}/api/locations/${locationId}/?telegram_id=${telegramId}`,
            { method: 'DELETE' }
        );
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(errorData.error || 'Failed to delete', response.status);
        }
    },
};

// --- Seller API ---

export const sellerApi = {
    /**
     * Get seller's orders (requires telegram_id)
     */
    async getOrders(telegramId: number): Promise<ApiOrder[]> {
        const response = await fetch(
            `${BASE_URL}/api/seller/orders/?telegram_id=${telegramId}`
        );
        return handleResponse(response);
    },

    /**
     * Update order status (requires telegram_id)
     */
    async updateOrderStatus(
        orderId: number,
        telegramId: number,
        status: 'new' | 'done'
    ): Promise<ApiOrder> {
        const response = await fetch(`${BASE_URL}/api/seller/orders/${orderId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: telegramId, status }),
        });
        return handleResponse<ApiOrder>(response);
    },

    /**
     * Create a new category (requires telegram_id)
     */
    async createCategory(data: {
        telegram_id: number;
        name: string;
    }): Promise<ApiCategory> {
        const response = await fetch(`${BASE_URL}/api/seller/categories/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiCategory>(response);
    },

    /**
     * Create a new product (requires telegram_id, store auto-assigned)
     */
    async createProduct(data: {
        telegram_id: number;
        category: number;
        name: string;
        price: string;
        unit: string;
        image?: File | null;
        is_available?: boolean;
    }): Promise<ApiProduct> {
        const formData = new FormData();
        formData.append('telegram_id', String(data.telegram_id));
        formData.append('category', String(data.category));
        formData.append('name', data.name);
        formData.append('price', data.price);
        formData.append('unit', data.unit);
        if (data.is_available !== undefined) {
            formData.append('is_available', String(data.is_available));
        }
        if (data.image) {
            formData.append('image', data.image);
        }

        const response = await fetch(`${BASE_URL}/api/seller/products/`, {
            method: 'POST',
            body: formData,
        });
        return handleResponse<ApiProduct>(response);
    },

    /**
     * Update a product (requires telegram_id)
     */
    async updateProduct(
        productId: number,
        data: {
            telegram_id: number;
            category?: number;
            name?: string;
            price?: string;
            unit?: string;
            image?: File | null;
            is_available?: boolean;
        }
    ): Promise<ApiProduct> {
        const formData = new FormData();
        formData.append('telegram_id', String(data.telegram_id));
        if (data.category) formData.append('category', String(data.category));
        if (data.name) formData.append('name', data.name);
        if (data.price) formData.append('price', data.price);
        if (data.unit) formData.append('unit', data.unit);
        if (data.is_available !== undefined) formData.append('is_available', String(data.is_available));
        if (data.image) {
            formData.append('image', data.image);
        }

        const response = await fetch(`${BASE_URL}/api/seller/products/${productId}/`, {
            method: 'PATCH',
            body: formData,
        });
        return handleResponse<ApiProduct>(response);
    },

    /**
     * Delete a product (requires telegram_id)
     */
    async deleteProduct(productId: number, telegramId: number): Promise<void> {
        const response = await fetch(
            `${BASE_URL}/api/seller/products/${productId}/?telegram_id=${telegramId}`,
            { method: 'DELETE' }
        );
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(errorData.error || 'Failed to delete', response.status);
        }
    },

    /**
     * Get categories for a store (public endpoint)
     */
    async getCategories(storeId: number): Promise<PaginatedResponse<ApiCategory>> {
        const response = await fetch(`${BASE_URL}/api/stores/${storeId}/categories/`);
        return handleResponse(response);
    },

    /**
     * Get seller's store products (public endpoint via store)
     */
    async getProducts(storeId: number, page = 1): Promise<PaginatedResponse<ApiProduct>> {
        const response = await fetch(
            `${BASE_URL}/api/stores/${storeId}/products/?page=${page}`
        );
        return handleResponse(response);
    },

    /**
     * Get seller's locations (requires telegram_id)
     */
    async getLocations(telegramId: number): Promise<ApiLocation[]> {
        const response = await fetch(
            `${BASE_URL}/api/seller/locations/?telegram_id=${telegramId}`
        );
        return handleResponse(response);
    },

    /**
     * Create seller location (requires telegram_id)
     */
    async createLocation(data: {
        telegram_id: number;
        name: string;
        latitude?: number;
        longitude?: number;
        address: string;
        is_default?: boolean;
    }): Promise<ApiLocation> {
        const response = await fetch(`${BASE_URL}/api/seller/locations/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiLocation>(response);
    },

    /**
     * Update seller location (requires telegram_id)
     */
    async updateLocation(
        locationId: number,
        data: {
            telegram_id: number;
            name?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
            is_default?: boolean;
        }
    ): Promise<ApiLocation> {
        const response = await fetch(`${BASE_URL}/api/seller/locations/${locationId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ApiLocation>(response);
    },

    /**
     * Delete seller location (requires telegram_id)
     */
    async deleteLocation(locationId: number, telegramId: number): Promise<void> {
        const response = await fetch(
            `${BASE_URL}/api/seller/locations/${locationId}/?telegram_id=${telegramId}`,
            { method: 'DELETE' }
        );
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(errorData.error || 'Failed to delete', response.status);
        }
    },
};
