/**
 * Seller Dashboard — Shared Types
 * Prop interfaces for tabs, modals, and components.
 */

import { SellerTabState } from '@/types';
import { ApiCategory, ApiCustomer } from '@/services/api';
import { SellerOrderUI, SellerProductUI, UIOrderStatus } from '@/hooks/useSellerData';

// ─── Identity props passed from App → SellerDashboard → children ───
export interface SellerIdentity {
    telegramId: number;
    storeId: number;
    storeName: string;
    sellerName: string;
}

// ─── Data from useSellerData, passed to tabs as props ───
export interface SellerData {
    orders: SellerOrderUI[];
    products: SellerProductUI[];
    categories: ApiCategory[];
    newOrdersCount: number;
    totalRevenue: number;
    updateOrderStatus: (orderId: number, status: UIOrderStatus) => Promise<boolean>;
    createProduct: (data: ProductFormData) => Promise<void>;
    updateProduct: (id: number, data: ProductFormData) => Promise<void>;
    deleteProduct: (id: number) => Promise<void>;
    refetch: () => Promise<void>;
}

// ─── Product form data shape ───
export interface ProductFormData {
    name: string;
    description?: string;
    price: number;
    unit: string;
    quantity: number;
    categoryId: number;
    image?: File | null;
}
