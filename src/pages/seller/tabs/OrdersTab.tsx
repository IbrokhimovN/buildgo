import React, { useState } from 'react';
import { SellerOrderUI, UIOrderStatus } from '@/hooks/useSellerData';
import EmptyState from '@/components/ui/EmptyState';
import OrderCard from '../components/OrderCard';
import OrderDetailsModal from '../modals/OrderDetailsModal';

interface OrdersTabProps {
    orders: SellerOrderUI[];
    onUpdateStatus: (orderId: number, status: UIOrderStatus) => Promise<boolean>;
}

const FILTER_OPTIONS: { id: 'all' | UIOrderStatus; label: string }[] = [
    { id: 'all', label: 'Barchasi' },
    { id: 'KUTILMOQDA', label: 'Kutilmoqda' },
    { id: 'YETKAZILDI', label: 'Yetkazildi' },
];

const OrdersTab: React.FC<OrdersTabProps> = ({ orders, onUpdateStatus }) => {
    // Local state — owned by this tab
    const [orderFilter, setOrderFilter] = useState<'all' | UIOrderStatus>('all');
    const [selectedOrder, setSelectedOrder] = useState<SellerOrderUI | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

    const handleSelectOrder = (order: SellerOrderUI) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    return (
        <>
            <div className="pb-32">
                <header className="sticky top-0 z-header bg-card/90 backdrop-blur-md p-4 border-b border-subtle">
                    <h1 className="text-2xl font-bold">Buyurtmalar</h1>
                    <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                        {FILTER_OPTIONS.map((filter) => (
                            <button key={filter.id} onClick={() => setOrderFilter(filter.id)}
                                className={`px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap min-h-[36px] ${orderFilter === filter.id ? 'bg-brand text-white' : 'bg-gray-100 text-muted'}`}>
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="px-4 space-y-3 mt-2">
                    {filteredOrders.length === 0 ? (
                        <EmptyState icon="shopping_bag" message="Buyurtmalar yo'q" />
                    ) : (
                        filteredOrders.map(order => (
                            <OrderCard key={order.id} order={order} onClick={handleSelectOrder} />
                        ))
                    )}
                </div>
            </div>

            <OrderDetailsModal
                isOpen={showOrderModal}
                onClose={() => { setShowOrderModal(false); setSelectedOrder(null); }}
                order={selectedOrder}
                onUpdateStatus={onUpdateStatus}
            />
        </>
    );
};

export default OrdersTab;
