/**
 * hooks/useSellerData.ts
 * Tuzatish: orders.customer_name → orders.user_name
 */

import { useState, useEffect, useCallback } from 'react';
import { sellerApi, ApiProduct, ApiCategory, ApiOrder, ApiError, ForbiddenError, OrderStatus } from '@/services/api';

export type UIOrderStatus = 'KUTILMOQDA' | 'JARAYONDA' | 'YETKAZILDI' | 'BEKOR';

export const statusToApi: Record<UIOrderStatus, OrderStatus> = {
  KUTILMOQDA: 'new',
  JARAYONDA: 'processing',
  YETKAZILDI: 'done',
  BEKOR: 'cancelled',
};

export const statusToUI: Record<OrderStatus, UIOrderStatus> = {
  new: 'KUTILMOQDA',
  processing: 'JARAYONDA',
  done: 'YETKAZILDI',
  cancelled: 'BEKOR',
};

export interface SellerOrderUI {
  id: number;
  customerName: string;    // user_name dan
  customerPhone: string;   // user_phone dan
  customerInitials: string;
  productSummary: string;
  totalPrice: number;
  status: UIOrderStatus;
  apiStatus: OrderStatus;
  createdAt: string;
  items: ApiOrder['items'];
  location?: ApiOrder['location'];
}

export interface SellerProductUI {
  id: number;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  quantity: number;
  image: string;
  categoryId: number;
  categoryName: string;
  isAvailable: boolean;
}

function getInitials(name: string): string {
  return name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function mapOrderToUI(order: ApiOrder): SellerOrderUI {
  const totalPrice = order.items.reduce(
    (sum, item) => sum + parseFloat(item.price_at_order) * item.quantity, 0
  );
  return {
    id: order.id,
    customerName: order.user_name,        // user_name (tuzatildi)
    customerPhone: order.user_phone || 'Kiritilmagan',  // user_phone (tuzatildi)
    customerInitials: getInitials(order.user_name),
    productSummary: order.items.map(i => `${i.quantity} ${i.product_unit} ${i.product_name}`).join(', '),
    totalPrice,
    status: statusToUI[order.status] || 'KUTILMOQDA',
    apiStatus: order.status,
    createdAt: order.created_at,
    items: order.items,
    location: order.location,
  };
}

function mapProductToUI(product: ApiProduct): SellerProductUI {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: parseFloat(product.price),
    unit: product.unit,
    quantity: product.quantity,
    image: product.image || '',
    categoryId: product.category || 0,
    categoryName: product.category_name || '',
    isAvailable: product.is_available,
  };
}

export function useSellerData(storeId: number) {
  const [orders, setOrders] = useState<SellerOrderUI[]>([]);
  const [products, setProducts] = useState<SellerProductUI[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersRes, productsRes, categoriesRes] = await Promise.allSettled([
        sellerApi.getOrders(),
        sellerApi.getSellerProducts(),
        sellerApi.getSellerCategories(),
      ]);

      if (ordersRes.status === 'fulfilled') {
        setOrders((ordersRes.value.results || []).map(mapOrderToUI));
      } else if (ordersRes.reason instanceof ForbiddenError) {
        setError('Sotuvchi sifatida tasdiqlanmagan');
      }

      if (productsRes.status === 'fulfilled') {
        setProducts((productsRes.value.results || []).map(mapProductToUI));
      }

      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value.results || []);
      }
    } catch {
      setError('Tizim xatoligi');
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateOrderStatus = useCallback(async (orderId: number, uiStatus: UIOrderStatus): Promise<boolean> => {
    try {
      const updated = await sellerApi.updateOrderStatus(orderId, statusToApi[uiStatus]);
      setOrders(prev => prev.map(o => o.id === orderId ? mapOrderToUI(updated) : o));
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Statusni yangilashda xatolik');
      return false;
    }
  }, []);

  const createProduct = useCallback(async (data: {
    name: string; description?: string; price: number; unit: string;
    quantity: number; categoryId: number; isAvailable?: boolean; image?: File | null;
  }): Promise<SellerProductUI | null> => {
    try {
      const created = await sellerApi.createProduct({
        name: data.name, description: data.description,
        price: data.price.toString(), unit: data.unit,
        quantity: data.quantity, category: data.categoryId,
        is_available: data.isAvailable ?? true, image: data.image,
      });
      const productUI = mapProductToUI(created);
      setProducts(prev => [...prev, productUI]);
      return productUI;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mahsulot qo'shishda xatolik");
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (productId: number, data: Partial<{
    name: string; description: string; price: number; unit: string;
    quantity: number; categoryId: number; isAvailable: boolean; image: File | null;
  }>): Promise<SellerProductUI | null> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price.toString();
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.categoryId !== undefined) updateData.category = data.categoryId;
      if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;
      if (data.image !== undefined) updateData.image = data.image;
      const updated = await sellerApi.updateProduct(productId, updateData as any);
      const productUI = mapProductToUI(updated);
      setProducts(prev => prev.map(p => p.id === productId ? productUI : p));
      return productUI;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mahsulotni yangilashda xatolik');
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (productId: number): Promise<boolean> => {
    try {
      await sellerApi.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mahsulotni o'chirishda xatolik");
      throw err;
    }
  }, []);

  return {
    orders, products, categories, isLoading, error,
    clearError: () => setError(null),
    refetch: fetchAll,
    updateOrderStatus, createProduct, updateProduct, deleteProduct,
    newOrdersCount: orders.filter(o => o.status === 'KUTILMOQDA').length,
    totalRevenue: orders.filter(o => o.status === 'YETKAZILDI').reduce((s, o) => s + o.totalPrice, 0),
  };
}

export const VALID_UNITS = [
  { value: 'dona', label: 'Dona' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'qop', label: 'Qop' },
  { value: 'm', label: 'Metr' },
  { value: 'm2', label: 'Metr kvadrat' },
] as const;
