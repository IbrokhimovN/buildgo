import React, { useState, useEffect } from 'react';
import { useSellerData, SellerOrderUI } from '@/hooks/useSellerData';
import { SellerTabState } from '@/types';
import { ProductFormData } from './types';
import { authApi } from '@/services/api';
import Icon from '@/components/ui/Icon';

// Tabs
import DashboardTab from './tabs/DashboardTab';
import OrdersTab from './tabs/OrdersTab';
import ProductsTab from './tabs/ProductsTab';
import ReportsTab from './tabs/ReportsTab';
import SettingsTab from './tabs/SettingsTab';
import SellerTabBar from './components/SellerTabBar';
import StoreVerificationModal from './modals/StoreVerificationModal';

interface SellerDashboardProps {
    storeId: number;
    storeName: string;
    sellerName: string;
    storeStatus?: 'pending' | 'approved' | 'rejected';
    storeInn?: string;
}

// ─── Verification Form (full-page, shown when INN is empty) ───

function VerificationScreen({ onOpenForm }: { onOpenForm: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center max-w-sm space-y-6">
                <div className="size-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                    <Icon name="verified_user" className="text-amber-500 text-5xl" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold mb-2">Do'konni tasdiqlang</h1>
                    <p className="text-muted text-sm leading-relaxed">
                        Do'koningiz mahsulot sotish uchun tasdiqlanishi kerak.
                        INN, yuridik nom va kerakli hujjatlarni yuklang.
                    </p>
                </div>
                <button
                    onClick={onOpenForm}
                    className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
                >
                    <Icon name="upload_file" />
                    Hujjatlarni yuklash
                </button>
            </div>
        </div>
    );
}

// ─── Pending Approval Screen ───

function PendingApprovalScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center max-w-sm space-y-6">
                <div className="size-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Icon name="schedule" className="text-blue-500 text-5xl" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold mb-2">Tekshiruv jarayonida</h1>
                    <p className="text-muted text-sm leading-relaxed">
                        Hujjatlaringiz admin tomonidan tekshirilmoqda.
                        Bu jarayon 1-3 ish kunini olishi mumkin.
                    </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Icon name="info" className="text-blue-500" />
                        <p className="text-sm text-blue-700 text-left">
                            Tasdiqlangandan so'ng, siz mahsulotlarni qo'shishingiz va buyurtmalarni qabul qilishingiz mumkin bo'ladi.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Rejected Screen ───

function RejectedScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center max-w-sm space-y-6">
                <div className="size-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <Icon name="cancel" className="text-red-500 text-5xl" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold mb-2">Ariza rad etildi</h1>
                    <p className="text-muted text-sm leading-relaxed">
                        Hujjatlaringiz tekshirildi va rad etildi.
                        Iltimos, to'g'ri hujjatlarni qayta yuklang.
                    </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Icon name="warning" className="text-red-500" />
                        <p className="text-sm text-red-700 text-left">
                            To'g'ri INN va guvohnomani yuklashingizga ishonch hosil qiling.
                        </p>
                    </div>
                </div>
                <button
                    onClick={onRetry}
                    className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
                >
                    <Icon name="refresh" />
                    Qayta yuklash
                </button>
            </div>
        </div>
    );
}

// ─── Main Dashboard ───

export default function SellerDashboard({
    storeId, storeName, sellerName,
    storeStatus = 'pending', storeInn = '',
}: SellerDashboardProps) {
    const [activeTab, setActiveTab] = useState<SellerTabState>('DASHBOARD');
    const [showProductModal, setShowProductModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const {
        orders, products, categories, isLoading, error,
        updateOrderStatus, createProduct, updateProduct, deleteProduct, refetch,
        newOrdersCount, totalRevenue,
    } = useSellerData(storeId);

    useEffect(() => {
        if (storeStatus === 'approved') {
            refetch();
        }
    }, [storeStatus]);

    // ─── STATUS-BASED CONDITIONAL RENDERING ───

    // 1. Not approved + no INN → Show verification form
    if (storeStatus !== 'approved' && !storeInn) {
        return (
            <>
                <VerificationScreen onOpenForm={() => setShowVerificationModal(true)} />
                <StoreVerificationModal
                    isOpen={showVerificationModal}
                    onClose={() => setShowVerificationModal(false)}
                />
            </>
        );
    }

    // 2. Pending + INN present → Waiting for admin approval
    if (storeStatus === 'pending' && storeInn) {
        return <PendingApprovalScreen />;
    }

    // 3. Rejected → Show rejection + retry
    if (storeStatus === 'rejected') {
        return (
            <>
                <RejectedScreen onRetry={() => setShowVerificationModal(true)} />
                <StoreVerificationModal
                    isOpen={showVerificationModal}
                    onClose={() => setShowVerificationModal(false)}
                />
            </>
        );
    }

    // 4. Approved → Full dashboard
    const handleCreateProduct = async (data: ProductFormData) => {
        await createProduct({
            name: data.name,
            description: data.description,
            price: data.price,
            unit: data.unit,
            quantity: data.quantity,
            categoryId: data.categoryId,
            image: data.image,
        });
    };

    const handleUpdateProduct = async (id: number, data: ProductFormData) => {
        await updateProduct(id, {
            name: data.name,
            description: data.description,
            price: data.price,
            unit: data.unit,
            quantity: data.quantity,
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
                        onUpdateStatus={updateOrderStatus}
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
                        newOrdersCount={newOrdersCount}
                        onBack={() => setActiveTab('DASHBOARD')}
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
            <SellerTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
    );
}
