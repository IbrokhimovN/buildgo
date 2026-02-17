/**
 * useSellerData - Custom hook for Seller Dashboard data fetching
 * Uses centralized API client — no telegram_id passing.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    sellerApi,
    ApiProduct,
    ApiCategory,
    ApiOrder,
    ApiError,
    OrderStatus,
    ForbiddenError,
} from '@/services/api';

// ─── Order Status Mapping ───
export type UIOrderStatus = 'KUTILMOQDA' | 'JARAYONDA' | 'YETKAZILDI' | 'BEKOR';
export type ApiOrderStatus = OrderStatus;

export const statusToApi: Record<UIOrderStatus, ApiOrderStatus> = {
    KUTILMOQDA: 'new',
    JARAYONDA: 'processing',
    YETKAZILDI: 'done',
    BEKOR: 'cancelled',
};

export const statusToUI: Record<ApiOrderStatus, UIOrderStatus> = {
    new: 'KUTILMOQDA',
    processing: 'JARAYONDA',
    done: 'YETKAZILDI',
    cancelled: 'BEKOR',
};

// ─── UI Types ───
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

// ─── Mappers ───
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
        status: statusToUI[order.status] || 'KUTILMOQDA',
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

// ─── Main Hook ───
export function useSellerData(storeId: number) {
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
                sellerApi.getOrders(),
                sellerApi.getProducts(storeId),
                sellerApi.getCategories(storeId),
            ]);

            // Handle Orders
            if (ordersResult.status === 'fulfilled') {
                const ordersRes = ordersResult.value;
                const ordersArray = ordersRes.results || [];
                setOrders(ordersArray.map(mapOrderToUI));
            } else {
                if (ordersResult.reason instanceof ForbiddenError) {
                    setError("Sotuvchi sifatida tasdiqlanmagan");
                }
            }

            // Handle Products
            if (productsResult.status === 'fulfilled') {
                setProducts(productsResult.value.results.map(mapProductToUI));
            } else {
                const message = productsResult.reason instanceof ApiError
                    ? productsResult.reason.message
                    : "Mahsulotlarni yuklashda xatolik";
                setError(message);
            }

            // Handle Categories
            if (categoriesResult.status === 'fulfilled') {
                setCategories(categoriesResult.value.results);
            }

        } catch (err) {
            setError("Tizim xatoligi");
        } finally {
            setIsLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ─── Order Actions ───
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
                return false;
            }
        },
        []
    );

    // ─── Product Actions ───
    const createProduct = useCallback(
        async (data: {
            name: string;
            price: number;
            unit: string;
            categoryId: number;
            isAvailable?: boolean;
            image?: File | null;
        }): Promise<SellerProductUI | null> => {
            try {
                const created = await sellerApi.createProduct({
                    name: data.name,
                    price: data.price.toString(),
                    unit: data.unit,
                    category: data.categoryId,
                    is_available: data.isAvailable ?? true,
                    image: data.image,
                });
                const productUI = mapProductToUI(created);
                setProducts((prev) => [...prev, productUI]);
                return productUI;
            } catch (err) {
                const message =
                    err instanceof ApiError ? err.message : "Mahsulot qo'shishda xatolik";
                setError(message);
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
                image: File | null;
            }>
        ): Promise<SellerProductUI | null> => {
            try {
                const updateData: Record<string, unknown> = {};
                if (data.name !== undefined) updateData.name = data.name;
                if (data.price !== undefined) updateData.price = data.price.toString();
                if (data.unit !== undefined) updateData.unit = data.unit;
                if (data.categoryId !== undefined) updateData.category = data.categoryId;
                if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;
                if (data.image !== undefined) updateData.image = data.image;

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
            throw err;
        }
    }, []);

    // ─── Clear Error ───
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        orders,
        products,
        categories,
        isLoading,
        error,
        clearError,
        refetch: fetchAll,
        updateOrderStatus,
        createProduct,
        updateProduct,
        deleteProduct,
        newOrdersCount: orders.filter((o) => o.status === 'KUTILMOQDA').length,
        totalRevenue: orders
            .filter((o) => o.status === 'YETKAZILDI')
            .reduce((sum, o) => sum + o.totalPrice, 0),
    };
}

// ─── Valid Units ───
export const VALID_UNITS = [
    { value: 'dona', label: 'Dona' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'qop', label: 'Qop' },
    { value: 'm', label: 'Metr' },
] as const;
