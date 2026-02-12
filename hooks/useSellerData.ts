/**
 * useSellerData - Custom hook for Seller Dashboard data fetching
 */

import { useState, useEffect, useCallback } from 'react';
import {
    sellerApi,
    authApi,
    ApiProduct,
    ApiCategory,
    ApiOrder,
    ApiSeller,
    ApiError,
} from '../services/api';

// --- Order Status Mapping ---
export type UIOrderStatus = 'KUTILMOQDA' | 'YETKAZILDI' | 'BEKOR_QILINDI';
export type ApiOrderStatus = 'new' | 'done' | 'cancelled';

export const statusToApi: Record<UIOrderStatus, ApiOrderStatus> = {
    KUTILMOQDA: 'new',
    YETKAZILDI: 'done',
    BEKOR_QILINDI: 'cancelled',
};

export const statusToUI: Record<ApiOrderStatus, UIOrderStatus> = {
    new: 'KUTILMOQDA',
    done: 'YETKAZILDI',
    cancelled: 'BEKOR_QILINDI',
};

// --- UI Types ---
export interface SellerOrderUI {
    id: number;
    customerName: string;
    customerInitials: string;
    customerPhone?: string;
    productSummary: string;
    quantitySummary: string;
    totalPrice: number;
    status: UIOrderStatus;
    apiStatus: ApiOrderStatus;
    createdAt: string;
    items: ApiOrder['items'];
}

export interface SellerProductUI {
    id: number;
    name: string;
    price: number;
    unit: string;
    image: string;
    categoryId: number;
    categoryName: string;
    isAvailable: boolean;
}

// --- Mappers ---
function getInitials(name: string): string {
    const parts = name.trim().split(' ');
    return parts
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function mapOrderToUI(order: ApiOrder): SellerOrderUI {
    const totalPrice = order.items.reduce(
        (sum, item) => sum + parseFloat(item.price_at_order) * item.quantity,
        0
    );
    const productSummary = order.items
        .map((i) => `${i.quantity} ${i.product_unit} ${i.product_name}`)
        .join(', ');
    const quantitySummary = order.items
        .map((i) => `${i.quantity} ${i.product_unit}`)
        .join(', ');

    return {
        id: order.id,
        customerName: order.user_name,
        customerInitials: getInitials(order.user_name),
        customerPhone: order.user_phone,
        productSummary,
        quantitySummary,
        totalPrice,
        status: statusToUI[order.status],
        apiStatus: order.status,
        createdAt: order.created_at,
        items: order.items,
    };
}

function mapProductToUI(product: ApiProduct): SellerProductUI {
    return {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        unit: product.unit,
        image: product.image || '',
        categoryId: product.category,
        categoryName: product.category_name,
        isAvailable: product.is_available,
    };
}

// --- Main Hook ---
export function useSellerData() {
    const [profile, setProfile] = useState<ApiSeller | null>(null);
    const [orders, setOrders] = useState<SellerOrderUI[]>([]);
    const [products, setProducts] = useState<SellerProductUI[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all data
    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [ordersRes, productsRes, categoriesRes] = await Promise.all([
                sellerApi.getOrders(),
                sellerApi.getProducts(),
                sellerApi.getCategories().catch(() => ({ results: [] as ApiCategory[] })),
            ]);

            // Try to get profile
            try {
                const profileData = await authApi.getSellerProfile();
                setProfile(profileData);
            } catch {
                // Profile may fail if not authenticated yet
            }

            setOrders(ordersRes.results.map(mapOrderToUI));
            setProducts(productsRes.results.map(mapProductToUI));
            setCategories(categoriesRes.results);
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : "Ma'lumotlarni yuklashda xatolik";
            setError(message);
            console.error('Failed to fetch seller data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // --- Order Actions ---
    const updateOrderStatus = useCallback(
        async (orderId: number, uiStatus: UIOrderStatus): Promise<boolean> => {
            const apiStatus = statusToApi[uiStatus];

            try {
                const updated = await sellerApi.updateOrderStatus(orderId, apiStatus);
                setOrders((prev) =>
                    prev.map((o) => (o.id === orderId ? mapOrderToUI(updated) : o))
                );
                return true;
            } catch (err) {
                const message =
                    err instanceof ApiError ? err.message : 'Statusni yangilashda xatolik';
                setError(message);
                console.error('Failed to update order status:', err);
                return false;
            }
        },
        []
    );

    // --- Product Actions ---
    const createProduct = useCallback(
        async (data: {
            name: string;
            price: number;
            unit: string;
            categoryId: number;
            isAvailable?: boolean;
        }): Promise<SellerProductUI | null> => {
            try {
                const created = await sellerApi.createProduct({
                    name: data.name,
                    price: data.price.toString(),
                    unit: data.unit,
                    category: data.categoryId,
                    is_available: data.isAvailable ?? true,
                });
                const productUI = mapProductToUI(created);
                setProducts((prev) => [...prev, productUI]);
                return productUI;
            } catch (err) {
                const message =
                    err instanceof ApiError ? err.message : "Mahsulot qo'shishda xatolik";
                setError(message);
                console.error('Failed to create product:', err);
                throw err;
            }
        },
        []
    );

    const updateProduct = useCallback(
        async (
            productId: number,
            data: Partial<{
                name: string;
                price: number;
                unit: string;
                categoryId: number;
                isAvailable: boolean;
            }>
        ): Promise<SellerProductUI | null> => {
            try {
                const updateData: Parameters<typeof sellerApi.updateProduct>[1] = {};
                if (data.name !== undefined) updateData.name = data.name;
                if (data.price !== undefined) updateData.price = data.price.toString();
                if (data.unit !== undefined) updateData.unit = data.unit;
                if (data.categoryId !== undefined) updateData.category = data.categoryId;
                if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;

                const updated = await sellerApi.updateProduct(productId, updateData);
                const productUI = mapProductToUI(updated);
                setProducts((prev) =>
                    prev.map((p) => (p.id === productId ? productUI : p))
                );
                return productUI;
            } catch (err) {
                const message =
                    err instanceof ApiError ? err.message : 'Mahsulotni yangilashda xatolik';
                setError(message);
                console.error('Failed to update product:', err);
                throw err;
            }
        },
        []
    );

    const deleteProduct = useCallback(async (productId: number): Promise<boolean> => {
        try {
            await sellerApi.deleteProduct(productId);
            setProducts((prev) => prev.filter((p) => p.id !== productId));
            return true;
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : "Mahsulotni o'chirishda xatolik";
            setError(message);
            console.error('Failed to delete product:', err);
            throw err;
        }
    }, []);

    // --- Clear Error ---
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // Data
        profile,
        orders,
        products,
        categories,

        // State
        isLoading,
        error,
        clearError,

        // Actions
        refetch: fetchAll,
        updateOrderStatus,
        createProduct,
        updateProduct,
        deleteProduct,

        // Computed
        newOrdersCount: orders.filter((o) => o.status === 'KUTILMOQDA').length,
        totalRevenue: orders
            .filter((o) => o.status === 'YETKAZILDI')
            .reduce((sum, o) => sum + o.totalPrice, 0),
    };
}

// --- Valid Units ---
export const VALID_UNITS = [
    { value: 'dona', label: 'Dona' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'qop', label: 'Qop' },
    { value: 'metr', label: 'Metr' },
    { value: 'litr', label: 'Litr' },
    { value: 'tonna', label: 'Tonna' },
] as const;
