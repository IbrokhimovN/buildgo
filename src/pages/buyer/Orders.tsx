import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { buyerApi, ApiOrder, ApiError, AuthError } from '@/services/api';

interface OrdersViewProps {
    onBack: () => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({ onBack }) => {
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await buyerApi.getOrders();
            setOrders(res.results);
        } catch (err) {
            if (err instanceof AuthError) {
                setError("Ilovani Telegram orqali qayta oching");
            } else {
                setError(err instanceof ApiError ? err.message : "Buyurtmalarni yuklashda xatolik");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const statusColors: Record<string, string> = {
        'new': 'text-yellow-700 bg-warning-light',
        'processing': 'text-blue-700 bg-blue-50',
        'done': 'text-green-700 bg-brand-light',
        'cancelled': 'text-red-700 bg-danger-light',
    };

    const statusLabels: Record<string, string> = {
        'new': 'Kutilmoqda',
        'processing': 'Jarayonda',
        'done': 'Yetkazildi',
        'cancelled': 'Bekor qilindi',
    };

    // Compute total from items (no total_price field in API)
    const getOrderTotal = (order: ApiOrder): number => {
        return order.items.reduce(
            (sum, item) => sum + parseFloat(item.price_at_order) * item.quantity,
            0
        );
    };

    return (
        <div className="min-h-screen bg-surface pb-32">
            <PageHeader title="Buyurtmalar" onBack={onBack} />

            {isLoading && <SkeletonLoader variant="order-card" count={3} />}
            {error && (
                <div className="p-4">
                    <div className="p-4 bg-danger-light border border-red-200 text-danger rounded-card text-sm">{error}</div>
                </div>
            )}

            {!isLoading && !error && orders.length === 0 && (
                <EmptyState icon="receipt_long" message="Buyurtmalar yo'q" hint="Birinchi buyurtmangizni bering!" />
            )}

            {!isLoading && !error && orders.length > 0 && (
                <div className="p-4 space-y-3">
                    {orders.map(order => (
                        <div key={order.id} className="bg-card rounded-card p-4 border border-subtle">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-muted">#{order.id}</span>
                                <span className={`text-2xs font-bold px-2 py-1 rounded-md ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {statusLabels[order.status] || order.status}
                                </span>
                            </div>
                            <p className="font-bold text-sm">{order.store_name}</p>
                            <div className="mt-2 space-y-1">
                                {order.items?.map((item, i) => (
                                    <p key={i} className="text-sm text-muted">
                                        {item.product_name} × {item.quantity}
                                    </p>
                                ))}
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-subtle">
                                <span className="text-xs text-muted">{new Date(order.created_at).toLocaleDateString('uz-UZ')}</span>
                                <span className="font-bold text-brand">{getOrderTotal(order).toLocaleString()} so'm</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersView;
