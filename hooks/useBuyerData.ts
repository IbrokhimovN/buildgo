/**
 * useBuyerData - Custom hook for Buyer App data fetching
 */

import { useState, useEffect, useCallback } from 'react';
import {
    buyerApi,
    ApiStore,
    ApiProduct,
    ApiCategory,
    ApiOrder,
    ApiLocation,
    ApiError,
} from '../services/api';

// --- Stores Hook ---
export function useStores() {
    const [stores, setStores] = useState<ApiStore[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStores = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await buyerApi.getStores();
            setStores(response.results);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Do\'konlarni yuklashda xatolik';
            setError(message);
            console.error('Failed to fetch stores:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    return { stores, isLoading, error, refetch: fetchStores };
}

// --- Store Products Hook ---
export function useStoreProducts(storeId: number | null) {
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async (categoryId?: number) => {
        if (!storeId) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await buyerApi.getStoreProducts(storeId, categoryId);
            setProducts(response.results);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Mahsulotlarni yuklashda xatolik';
            setError(message);
            console.error('Failed to fetch products:', err);
        } finally {
            setIsLoading(false);
        }
    }, [storeId]);

    const fetchCategories = useCallback(async () => {
        if (!storeId) return;

        try {
            const response = await buyerApi.getStoreCategories(storeId);
            setCategories(response.results);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    }, [storeId]);

    useEffect(() => {
        if (storeId) {
            fetchProducts();
            fetchCategories();
        }
    }, [storeId, fetchProducts, fetchCategories]);

    return {
        products,
        categories,
        isLoading,
        error,
        fetchProducts,
        refetch: () => fetchProducts(),
    };
}

// --- Search Products Hook ---
export function useProductSearch() {
    const [results, setResults] = useState<ApiProduct[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        setError(null);
        try {
            const response = await buyerApi.searchProducts(query);
            setResults(response.results);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Qidiruvda xatolik';
            setError(message);
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return { results, isSearching, error, search, clearResults };
}

// --- Cart & Order Hook ---
interface CartItem {
    product: ApiProduct;
    quantity: number;
}

export function useCart() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Returns 'added' if successful, 'conflict' if the product is from a different store
    const addItem = useCallback((product: ApiProduct, quantity: number = 1): 'added' | 'conflict' => {
        let result: 'added' | 'conflict' = 'added';
        setItems((prev) => {
            // Check for store conflict
            if (prev.length > 0 && prev[0].product.store !== product.store) {
                result = 'conflict';
                return prev; // Don't modify the cart
            }
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });
        return result;
    }, []);

    const updateQuantity = useCallback((productId: number, quantity: number) => {
        if (quantity <= 0) {
            setItems((prev) => prev.filter((item) => item.product.id !== productId));
        } else {
            setItems((prev) =>
                prev.map((item) =>
                    item.product.id === productId ? { ...item, quantity } : item
                )
            );
        }
    }, []);

    const removeItem = useCallback((productId: number) => {
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        setError(null);
    }, []);

    const getTotal = useCallback(() => {
        return items.reduce(
            (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
            0
        );
    }, [items]);

    const submitOrder = useCallback(
        async (
            locationId?: number,
            customerInfo?: { firstName: string; lastName: string; phone: string }
        ): Promise<ApiOrder> => {
            if (items.length === 0) {
                throw new Error('Savat bo\'sh');
            }

            // All items must be from the same store
            const storeId = items[0].product.store;
            const allSameStore = items.every((item) => item.product.store === storeId);
            if (!allSameStore) {
                throw new Error('Barcha mahsulotlar bitta do\'kondan bo\'lishi kerak');
            }

            setIsSubmitting(true);
            setError(null);

            try {
                const order = await buyerApi.createOrder({
                    store: storeId,
                    items: items.map((item) => ({
                        product: item.product.id,
                        quantity: item.quantity,
                    })),
                    location: locationId,
                    first_name: customerInfo?.firstName,
                    last_name: customerInfo?.lastName,
                    phone: customerInfo?.phone,
                });
                clearCart();
                return order;
            } catch (err) {
                const message =
                    err instanceof ApiError ? err.message : 'Buyurtma yuborishda xatolik';
                setError(message);
                console.error('Order submission failed:', err);
                throw err;
            } finally {
                setIsSubmitting(false);
            }
        },
        [items, clearCart]
    );

    return {
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        getTotal,
        submitOrder,
        isSubmitting,
        error,
        itemCount: items.length,
    };
}

// --- Order History Hook ---
export function useOrderHistory() {
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await buyerApi.getOrders();
            setOrders(response.results);
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : 'Buyurtmalarni yuklashda xatolik';
            setError(message);
            console.error('Failed to fetch orders:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return { orders, isLoading, error, refetch: fetchOrders };
}

// --- Locations Hook ---
export function useLocations() {
    const [locations, setLocations] = useState<ApiLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLocations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await buyerApi.getLocations();
            setLocations(response.results);
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : 'Manzillarni yuklashda xatolik';
            setError(message);
            console.error('Failed to fetch locations:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addLocation = useCallback(
        async (data: { name: string; address: string; is_default?: boolean }) => {
            try {
                const newLocation = await buyerApi.createLocation(data);
                setLocations((prev) => [...prev, newLocation]);
                return newLocation;
            } catch (err) {
                const message =
                    err instanceof ApiError ? err.message : 'Manzil qo\'shishda xatolik';
                setError(message);
                throw err;
            }
        },
        []
    );

    const deleteLocation = useCallback(async (locationId: number) => {
        try {
            await buyerApi.deleteLocation(locationId);
            setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : 'Manzilni o\'chirishda xatolik';
            setError(message);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    return {
        locations,
        isLoading,
        error,
        addLocation,
        deleteLocation,
        refetch: fetchLocations,
    };
}
