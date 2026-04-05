/**
 * hooks/useBuyerData.ts
 *
 * Tuzatishlar:
 * 1. Cart backend bilan sync — localStorage yo'q
 * 2. 1 cart = 1 store: conflict bo'lsa 409 qaytariladi, frontend hal qiladi
 * 3. submitOrder: from_cart=true yuboradi
 */

import { useState, useEffect, useCallback } from 'react';
import {
  buyerApi,
  ApiStore, ApiProduct, ApiProductVariant, ApiCategory,
  ApiOrder, ApiLocation, ApiCartItem, ApiCartResponse,
  ApiError, ConflictError,
} from '@/services/api';

// ─── Stores ──────────────────────────────────────────────────

export function useStores(categoryId?: number | null) {
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await buyerApi.getStores(1, categoryId === null ? undefined : categoryId);
      setStores(response.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Do'konlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  useEffect(() => { fetchStores(); }, [fetchStores]);
  return { stores, isLoading, error, refetch: fetchStores };
}

// ─── Store products ───────────────────────────────────────────

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
      setError(err instanceof ApiError ? err.message : 'Mahsulotlarni yuklashda xatolik');
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  const fetchCategories = useCallback(async () => {
    if (!storeId) return;
    try {
      const response = await buyerApi.getStoreCategories(storeId);
      setCategories(response.results);
    } catch {}
  }, [storeId]);

  useEffect(() => {
    if (storeId) { fetchProducts(); fetchCategories(); }
  }, [storeId, fetchProducts, fetchCategories]);

  return { products, categories, isLoading, error, fetchProducts, refetch: () => fetchProducts() };
}

// ─── Cart — backend bilan to'liq sync ────────────────────────

export type CartConflictInfo = {
  existingStoreName: string;
  newStoreName: string;
  productToAdd: ApiProduct;
  variantToAdd: ApiProductVariant | null;
  quantityToAdd: number;
};

export function useCart() {
  const [items, setItems] = useState<ApiCartItem[]>([]);
  const [cartStore, setCartStore] = useState<{ id: number; name: string; image: string | null } | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [conflict, setConflict] = useState<CartConflictInfo | null>(null);

  // Backend dan cart ni yuklash
  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: ApiCartResponse = await buyerApi.getCart();
      setItems(res.items || []);
      setCartStore(res.store || null);
      setTotal(res.total || 0);
    } catch {
      setItems([]);
      setCartStore(null);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const _updateFromResponse = (res: ApiCartResponse) => {
    setItems(res.cart?.items || res.items || []);
    setCartStore(res.cart?.store || res.store || null);
    setTotal(res.cart?.total || res.total || 0);
  };

  /**
   * Mahsulot qo'shish.
   * 409 bo'lsa → conflict state yangilanadi, frontend Modal ko'rsatadi.
   * Foydalanuvchi "Ha" desa → clearAndAdd() chaqiriladi.
   */
  const addItem = useCallback(async (
    product: ApiProduct,
    variant: ApiProductVariant | null,
    quantity: number
  ): Promise<'ok' | 'conflict' | 'error'> => {
    try {
      const res = await buyerApi.addToCart(product.id, variant?.id, quantity);
      _updateFromResponse(res as any);
      return 'ok';
    } catch (err) {
      if (err instanceof ConflictError) {
        setConflict({
          existingStoreName: err.existingStore?.name || cartStore?.name || "Boshqa do'kon",
          newStoreName: err.newStore?.name || product.store_name,
          productToAdd: product,
          variantToAdd: variant,
          quantityToAdd: quantity,
        });
        return 'conflict';
      }
      return 'error';
    }
  }, [cartStore]);

  /** Savatchani tozalab, yangi mahsulot qo'shish */
  const clearAndAdd = useCallback(async () => {
    if (!conflict) return;
    try {
      await buyerApi.clearCart();
      const res = await buyerApi.addToCart(
        conflict.productToAdd.id,
        conflict.variantToAdd?.id,
        conflict.quantityToAdd
      );
      _updateFromResponse(res as any);
      setConflict(null);
    } catch {
      await fetchCart();
      setConflict(null);
    }
  }, [conflict, fetchCart]);

  const dismissConflict = () => setConflict(null);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    try {
      if (quantity <= 0) {
        await buyerApi.deleteCartItem(itemId);
      } else {
        await buyerApi.updateCartItem(itemId, quantity);
      }
      await fetchCart();
    } catch {}
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId: number) => {
    try {
      await buyerApi.deleteCartItem(itemId);
      await fetchCart();
    } catch {}
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await buyerApi.clearCart();
      setItems([]);
      setCartStore(null);
      setTotal(0);
    } catch {}
  }, []);

  const submitOrder = useCallback(async (): Promise<ApiOrder> => {
    const order = await buyerApi.createOrder({ from_cart: true });
    setItems([]);
    setCartStore(null);
    setTotal(0);
    return order;
  }, []);

  return {
    items,
    cartStore,
    total,
    isLoading,
    conflict,
    addItem,
    clearAndAdd,
    dismissConflict,
    updateQuantity,
    removeItem,
    clearCart,
    submitOrder,
    refetch: fetchCart,
  };
}

// ─── Locations ───────────────────────────────────────────────

export function useLocations() {
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const locs = await buyerApi.getLocations();
      setLocations(locs);
    } catch {
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const addLocation = useCallback(async (data: Parameters<typeof buyerApi.createLocation>[0]) => {
    const loc = await buyerApi.createLocation(data);
    setLocations(prev => [...prev, loc]);
    return loc;
  }, []);

  const deleteLocation = useCallback(async (id: number) => {
    await buyerApi.deleteLocation(id);
    setLocations(prev => prev.filter(l => l.id !== id));
  }, []);

  return { locations, isLoading, addLocation, deleteLocation, refetch: fetchLocations };
}
