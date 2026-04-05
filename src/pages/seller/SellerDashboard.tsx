import React, { useState, useEffect } from 'react';
import { useSellerData, SellerOrderUI } from '@/hooks/useSellerData';
import { SellerTabState } from '@/types';
import { ProductFormData } from './types';
import Icon from '@/components/ui/Icon';

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
  storeStatus?: 'pending' | 'approved' | 'rejected';
  storeInn?: string;
}

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
          </p>
        </div>
        <button onClick={onOpenForm}
          className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform">
          <Icon name="upload_file" /> Hujjatlarni yuklash
        </button>
      </div>
    </div>
  );
}

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
            Hujjatlaringiz admin tomonidan tekshirilmoqda. Bu jarayon 1–3 ish kunini olishi mumkin.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Icon name="info" className="text-blue-500" />
          <p className="text-sm text-blue-700 text-left">
            Tasdiqlangandan so'ng, mahsulotlar qo'shishingiz va buyurtmalar qabul qilishingiz mumkin.
          </p>
        </div>
      </div>
    </div>
  );
}

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
            To'g'ri hujjatlarni qayta yuklang.
          </p>
        </div>
        <button onClick={onRetry}
          className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform">
          <Icon name="refresh" /> Qayta yuklash
        </button>
      </div>
    </div>
  );
}

export default function SellerDashboard({ storeId, storeName, storeStatus = 'pending', storeInn = '' }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<SellerTabState>('DASHBOARD');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const { orders, products, categories, updateOrderStatus, createProduct, updateProduct, deleteProduct, refetch, newOrdersCount, totalRevenue } = useSellerData(storeId);

  useEffect(() => { if (storeStatus === 'approved') refetch(); }, [storeStatus]);

  if (storeStatus !== 'approved' && !storeInn) {
    return (<><VerificationScreen onOpenForm={() => setShowVerificationModal(true)} /><StoreVerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} /></>);
  }
  if (storeStatus === 'pending' && storeInn) return <PendingApprovalScreen />;
  if (storeStatus === 'rejected') {
    return (<><RejectedScreen onRetry={() => setShowVerificationModal(true)} /><StoreVerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} /></>);
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'DASHBOARD': return <DashboardTab products={products} orders={orders} newOrdersCount={newOrdersCount} totalRevenue={totalRevenue} onNavigate={setActiveTab} onAddProduct={() => setActiveTab('PRODUCTS')} onSelectOrder={() => setActiveTab('ORDERS')} />;
      case 'ORDERS': return <OrdersTab orders={orders} onUpdateStatus={updateOrderStatus} />;
      case 'PRODUCTS': return <ProductsTab products={products} categories={categories} onCreateProduct={async (d: ProductFormData) => { await createProduct({ ...d, isAvailable: true }); }} onUpdateProduct={async (id: number, d: ProductFormData) => { await updateProduct(id, { ...d, isAvailable: true }); }} onDeleteProduct={deleteProduct} onRefetch={refetch} />;
      case 'REPORTS': return <ReportsTab orders={orders} totalRevenue={totalRevenue} newOrdersCount={newOrdersCount} onBack={() => setActiveTab('DASHBOARD')} />;
      case 'SETTINGS': return <SettingsTab storeName={storeName} sellerName={storeName} />;
      default: return null;
    }
  };

  return (<>{renderTab()}<SellerTabBar activeTab={activeTab} setActiveTab={setActiveTab} /></>);
}
