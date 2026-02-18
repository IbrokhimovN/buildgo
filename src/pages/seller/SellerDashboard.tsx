import React, { useState, useEffect } from 'react';
import { useSellerData, SellerOrderUI } from '@/hooks/useSellerData';
import { SellerTabState } from '@/types';
import { ProductFormData } from './types';

// Tabs
import DashboardTab from './tabs/DashboardTab';
import OrdersTab from './tabs/OrdersTab';
import ProductsTab from './tabs/ProductsTab';
import ReportsTab from './tabs/ReportsTab';
import SettingsTab from './tabs/SettingsTab';
import SellerTabBar from './components/SellerTabBar';

interface SellerDashboardProps {
    storeId: number;
    storeName: string;
    sellerName: string;
}

export default function SellerDashboard({ storeId, storeName, sellerName }: SellerDashboardProps) {
    const [activeTab, setActiveTab] = useState<SellerTabState>('DASHBOARD');
    const [showProductModal, setShowProductModal] = useState(false);

    const {
        orders, products, categories, isLoading, error,
        updateOrderStatus, createProduct, updateProduct, deleteProduct, refetch,
        newOrdersCount, totalRevenue,
    } = useSellerData(storeId);

    useEffect(() => {
        refetch();
    }, []);

    const handleCreateProduct = async (data: ProductFormData) => {
        await createProduct({
            name: data.name,
            price: data.price,
            unit: data.unit,
            categoryId: data.categoryId,
            image: data.image,
        });
    };

    const handleUpdateProduct = async (id: number, data: ProductFormData) => {
        await updateProduct(id, {
            name: data.name,
            price: data.price,
            unit: data.unit,
            categoryId: data.categoryId,
            image: data.image,
        });
    };

    const handleDeleteProduct = async (id: number) => {
        await deleteProduct(id);
    };

    const handleSelectOrder = (order: SellerOrderUI) => {
        setActiveTab('ORDERS');
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'DASHBOARD':
                return (
                    <DashboardTab
                        products={products}
                        orders={orders}
                        newOrdersCount={newOrdersCount}
                        totalRevenue={totalRevenue}
                        onNavigate={setActiveTab}
                        onAddProduct={() => { setActiveTab('PRODUCTS'); setShowProductModal(true); }}
                        onSelectOrder={handleSelectOrder}
                    />
                );
            case 'ORDERS':
                return (
                    <OrdersTab
                        orders={orders}
                        updateOrderStatus={updateOrderStatus}
                    />
                );
            case 'PRODUCTS':
                return (
                    <ProductsTab
                        products={products}
                        categories={categories}
                        onCreateProduct={handleCreateProduct}
                        onUpdateProduct={handleUpdateProduct}
                        onDeleteProduct={handleDeleteProduct}
                        onRefetch={refetch}
                    />
                );
            case 'REPORTS':
                return (
                    <ReportsTab
                        orders={orders}
                        totalRevenue={totalRevenue}
                    />
                );
            case 'SETTINGS':
                return (
                    <SettingsTab
                        storeName={storeName}
                        sellerName={sellerName}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            {renderTab()}
            <SellerTabBar activeTab={activeTab} setActiveTab={setActiveTab} newOrdersCount={newOrdersCount} />
        </>
    );
}
