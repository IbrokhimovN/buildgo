import React from 'react';
import { SellerTabState } from '@/types';
import { SellerOrderUI, SellerProductUI } from '@/hooks/useSellerData';
import { sellerApi, ApiSellerAnalytics } from '@/services/api';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import OrderCard from '../components/OrderCard';

interface DashboardTabProps {
    products: SellerProductUI[];
    orders: SellerOrderUI[];
    newOrdersCount: number;
    totalRevenue: number;
    onNavigate: (tab: SellerTabState) => void;
    onAddProduct: () => void;
    onSelectOrder: (order: SellerOrderUI) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
    products, orders, newOrdersCount, totalRevenue,
    onNavigate, onAddProduct, onSelectOrder,
}) => {
    const [analytics, setAnalytics] = React.useState<ApiSellerAnalytics | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        sellerApi.getAnalytics()
            .then(setAnalytics)
            .catch(() => { }) // non-critical error
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="px-4 pb-8">
            <div className="flex gap-3 mb-6">
                <button onClick={onAddProduct}
                    className="flex-1 bg-brand text-white font-bold py-3 px-6 rounded-pill flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98] transition-transform">
                    <Icon name="add_box" className="text-lg" /> Mahsulot
                </button>
                <button onClick={() => onNavigate('REPORTS')}
                    className="flex-1 bg-card border border-subtle font-bold py-3 px-6 rounded-pill flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98] transition-transform">
                    <Icon name="bar_chart" className="text-lg" /> Hisobotlar
                </button>
            </div>

            <h3 className="text-muted text-xs font-bold uppercase tracking-wider mb-3">Statistika (Bugun)</h3>
            {isLoading ? (
                <div className="flex justify-center py-4"><LoadingSpinner message="Analitika yuklanmoqda" /></div>
            ) : analytics ? (
                <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-card rounded-card p-4 border border-subtle">
                            <div className="size-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                                <Icon name="attach_money" className="text-muted" />
                            </div>
                            <p className="text-muted text-xs">Bugungi savdo</p>
                            <p className="text-lg font-bold mt-1 text-green-600">{analytics.revenue_today.toLocaleString()} so'm</p>
                        </div>
                        <div onClick={() => onNavigate('ORDERS')} className="bg-card rounded-card p-4 border border-subtle cursor-pointer active:scale-[0.98] transition-transform">
                            <div className="size-10 bg-brand-light rounded-lg flex items-center justify-center mb-3">
                                <Icon name="shopping_basket" className="text-brand" />
                            </div>
                            <p className="text-muted text-xs">Buyurtmalar</p>
                            <p className="text-lg font-bold mt-1">{analytics.orders_today} ta</p>
                        </div>
                    </div>
                    {analytics.top_products && analytics.top_products.length > 0 && (
                        <div className="bg-card rounded-card p-4 border border-subtle mb-6">
                            <p className="text-muted text-sm mb-3 font-bold">Top mahsulotlar (Sotilgan)</p>
                            <div className="space-y-3">
                                {analytics.top_products.map((tp, idx) => (
                                    <div key={tp.id} className="flex items-center gap-3">
                                        <span className="font-bold text-gray-400 w-4">{idx + 1}.</span>
                                        <p className="flex-1 text-sm font-semibold line-clamp-1">{tp.name}</p>
                                        <span className="text-sm font-bold text-brand bg-brand-light px-2 py-0.5 rounded">{tp.sold} ta</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-card rounded-card p-4 border border-subtle">
                        <div className="size-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                            <Icon name="point_of_sale" className="text-muted" />
                        </div>
                        <p className="text-muted text-xs">Jami mahsulotlar</p>
                        <p className="text-2xl font-bold mt-1">{products.length} ta</p>
                    </div>
                    <div onClick={() => onNavigate('ORDERS')} className="bg-card rounded-card p-4 border border-subtle cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="size-10 bg-brand-light rounded-lg flex items-center justify-center mb-3">
                            <Icon name="shopping_basket" className="text-brand" />
                        </div>
                        <p className="text-muted text-xs">Yangi buyurtmalar</p>
                        <p className="text-2xl font-bold mt-1">{newOrdersCount} ta</p>
                    </div>
                </div>
            )}

            <div onClick={() => onNavigate('REPORTS')} className="bg-card rounded-card p-4 border border-subtle mb-6 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-muted text-sm">Jami daromad</p>
                    <span className="text-green-600 text-sm font-bold">Yetkazilgan</span>
                </div>
                <p className="text-3xl font-bold">{totalRevenue.toLocaleString()} so'm</p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-muted text-xs font-bold uppercase tracking-wider">Buyurtmalar Boshqaruvi</h3>
                <button onClick={() => onNavigate('ORDERS')} className="text-brand text-sm font-bold">Hammasi</button>
            </div>

            <div className="space-y-3">
                {orders.length === 0 ? (
                    <EmptyState icon="shopping_bag" message="Buyurtmalar yo'q" />
                ) : (
                    orders.slice(0, 3).map(order => (
                        <OrderCard key={order.id} order={order} onClick={onSelectOrder} />
                    ))
                )}
            </div>
        </div>
    );
};

export default DashboardTab;
