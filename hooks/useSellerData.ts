/**
 * useSellerData - Custom hook for Seller Dashboard data fetching
 * Uses telegram_id for identity — no auth tokens.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    sellerApi,
    ApiProduct,
    ApiCategory,
    ApiOrder,
    ApiError,
} from '../services/api';

// --- Order Status Mapping ---
export type UIOrderStatus = 'KUTILMOQDA' | 'YETKAZILDI';
export type ApiOrderStatus = 'new' | 'done';

export const statusToApi: Record<UIOrderStatus, ApiOrderStatus> = {
    KUTILMOQDA: 'new',
    YETKAZILDI: 'done',
};

export const statusToUI: Record<ApiOrderStatus, UIOrderStatus> = {
    new: 'KUTILMOQDA',
    done: 'YETKAZILDI',
};

// --- UI Types ---
export interface SellerOrderUI {
    id: number;
    customerName: string;
    customerInitials: string;
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
        customerName: order.customer_name,
        customerInitials: getInitials(order.customer_name),
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
export function useSellerData(telegramId: number, storeId: number) {
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
            const [ordersResult, productsResult, categoriesResult] = await Promise.allSettled([
                sellerApi.getOrders(telegramId),
                sellerApi.getProducts(storeId),
                sellerApi.getCategories(storeId),
            ]);

            // Handle Orders
            if (ordersResult.status === 'fulfilled') {
                const ordersRes = ordersResult.value;
                const ordersArray = Array.isArray(ordersRes) ? ordersRes : [];
                setOrders(ordersArray.map(mapOrderToUI));
            } else {
                console.error('Failed to fetch orders:', ordersResult.reason);
                // We don't set global error here to avoid blocking product management
                // But if it's a critical auth error, we might want to notify
                if (ordersResult.reason instanceof ApiError && ordersResult.reason.message === 'Not a seller') {
                    setError("Sotuvchi sifatida tasdiqlanmagan (Orders API)");
                }
            }

            // Handle Products
            if (productsResult.status === 'fulfilled') {
                setProducts(productsResult.value.results.map(mapProductToUI));
            } else {
                console.error('Failed to fetch products:', productsResult.reason);
                const message = productsResult.reason instanceof ApiError ? productsResult.reason.message : "Mahsulotlarni yuklashda xatolik";
                setError(message); // Products are critical
            }

            // Handle Categories
            if (categoriesResult.status === 'fulfilled') {
                setCategories(categoriesResult.value.results);
            } else {
                // Categories are optional/secondary, just log
                console.error('Failed to fetch categories:', categoriesResult.reason);
                setCategories([]);
            }

        } catch (err) {
            console.error('Unexpected error in useSellerData:', err);
            setError("Tizim xatoligi");
        } finally {
            setIsLoading(false);
        }
    }, [telegramId, storeId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // --- Order Actions ---
    const updateOrderStatus = useCallback(
        async (orderId: number, uiStatus: UIOrderStatus): Promise<boolean> => {
            const apiStatus = statusToApi[uiStatus];

            try {
                const updated = await sellerApi.updateOrderStatus(orderId, telegramId, apiStatus);
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
        [telegramId]
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
                    telegram_id: telegramId,
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
        [telegramId]
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
                const updateData: Record<string, unknown> = { telegram_id: telegramId };
                if (data.name !== undefined) updateData.name = data.name;
                if (data.price !== undefined) updateData.price = data.price.toString();
                if (data.unit !== undefined) updateData.unit = data.unit;
                if (data.categoryId !== undefined) updateData.category = data.categoryId;
                if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;

                const updated = await sellerApi.updateProduct(productId, updateData as any);
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
        [telegramId]
    );

    const deleteProduct = useCallback(async (productId: number): Promise<boolean> => {
        try {
            await sellerApi.deleteProduct(productId, telegramId);
            setProducts((prev) => prev.filter((p) => p.id !== productId));
            return true;
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : "Mahsulotni o'chirishda xatolik";
            setError(message);
            console.error('Failed to delete product:', err);
            throw err;
        }
    }, [telegramId]);

    // --- Clear Error ---
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // Data
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
