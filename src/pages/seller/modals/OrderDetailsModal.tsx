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
                    <p className="text-sm text-muted mb-1">Buyurtma</p>
                    <p className="font-bold">{order.productSummary}</p>
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
                            <p className="font-bold mb-1">{order.location.name}</p>
                            <p className="text-sm">{order.location.address}</p>
                        </>
                    ) : (
                        <p className="font-bold">Manzil ko'rsatilmagan</p>
                    )}
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Statusni o'zgartirish</p>
                    <div className="grid grid-cols-2 gap-2">
                        {(['KUTILMOQDA', 'JARAYONDA', 'YETKAZILDI', 'BEKOR'] as UIOrderStatus[]).map((status) => {
                            let isDisabled = isUpdating;
                            if (order.status === status) isDisabled = true;
                            // Basic workflow: new -> processing -> done, or -> cancelled
                            if (order.status === 'BEKOR' || order.status === 'YETKAZILDI') {
                                // Terminal states
                                isDisabled = order.status !== status;
                            } else if (order.status === 'KUTILMOQDA') {
                                if (status === 'YETKAZILDI') isDisabled = true; // Must process first ideally, but Yandex often allows direct. Let's allow processing/cancelled directly.
                            } else if (order.status === 'JARAYONDA') {
                                if (status === 'KUTILMOQDA') isDisabled = true;
                            }

                            return (
                                <button key={status} onClick={() => handleStatusChange(status)} disabled={isDisabled}
                                    className={`py-3 rounded-card text-[11px] font-bold disabled:opacity-50 min-h-[44px] ${order.status === status ? 'bg-brand text-white' : 'bg-gray-100 text-muted'}`}>
                                    {isUpdating && order.status !== status ? '...' : status}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailsModal;
