import React, { useState } from 'react';
import { SellerOrderUI, UIOrderStatus } from '@/hooks/useSellerData';
import Modal from '@/components/ui/Modal';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: SellerOrderUI | null;
    onUpdateStatus: (orderId: number, status: UIOrderStatus) => Promise<boolean>;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    isOpen, onClose, order, onUpdateStatus,
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    if (!order) return null;

    const handleStatusChange = async (status: UIOrderStatus) => {
        setIsUpdating(true);
        const success = await onUpdateStatus(order.id, status);
        setIsUpdating(false);
        if (success) onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buyurtma tafsilotlari">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-muted">{order.customerInitials}</span>
                    </div>
                    <div>
                        <p className="font-bold text-lg">{order.customerName}</p>
                        <p className="text-muted text-sm">Xaridor</p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-card p-4">
                    <p className="text-sm text-muted mb-2">🧾 Buyurtma</p>
                    <div className="text-sm space-y-1">
                        {order.items.map((item, idx) => (
                            <div key={item.id}>
                                {idx + 1}) {item.product_name} — {item.quantity} dona
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-card p-4">
                        <p className="text-sm text-muted mb-1">Miqdor</p>
                        <p className="font-bold">{order.quantitySummary}</p>
                    </div>
                    <div className="bg-gray-50 rounded-card p-4">
                        <p className="text-sm text-muted mb-1">Summa</p>
                        <p className="font-bold text-brand">{order.totalPrice.toLocaleString()} so'm</p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-card p-4">
                    <p className="text-sm text-muted mb-1">Xaridor telefoni</p>
                    <p className="font-bold">{order.customerPhone || "Kiritilmagan"}</p>
                </div>

                <div className="bg-gray-50 rounded-card p-4">
                    <p className="text-sm text-muted mb-1">Yetkazish manzili</p>
                    {order.location ? (
                        <>
                            <p className="font-bold mb-2">{order.location.name}</p>
                            <p className="text-sm mb-3">{order.location.address}</p>
                            <a
                                href={`https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-card text-sm font-bold active:scale-[0.98] transition-transform"
                            >
                                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                Xaritada ko'rish
                            </a>
                        </>
                    ) : (
                        <p className="font-bold">Manzil ko'rsatilmagan</p>
                    )}
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Statusni o'zgartirish</p>
                    <div className="flex gap-2">
                        {(['KUTILMOQDA', 'YETKAZILDI'] as UIOrderStatus[]).map((status) => (
                            <button key={status} onClick={() => handleStatusChange(status)} disabled={isUpdating}
                                className={`flex-1 py-3 rounded-card text-xs font-bold disabled:opacity-50 min-h-[44px] ${order.status === status ? 'bg-brand text-white' : 'bg-gray-100 text-muted'}`}>
                                {isUpdating ? '...' : status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailsModal;
