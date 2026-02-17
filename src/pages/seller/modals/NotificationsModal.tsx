import React from 'react';
import { SellerOrderUI } from '@/hooks/useSellerData';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: SellerOrderUI[];
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, orders }) => {
    const notifications = orders.slice(0, 5).map(order => ({
        title: order.status === 'KUTILMOQDA' ? 'Yangi buyurtma' : 'Buyurtma yetkazildi',
        desc: `${order.customerName} — ${order.productSummary}`,
        time: new Date(order.createdAt).toLocaleDateString('uz-UZ'),
        unread: order.status === 'KUTILMOQDA',
    }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bildirishnomalar">
            <div className="space-y-3">
                {notifications.length === 0 ? (
                    <EmptyState icon="notifications_off" message="Bildirishnomalar yo'q" />
                ) : (
                    notifications.map((notif, i) => (
                        <div key={i} className={`p-4 rounded-card border ${notif.unread ? 'bg-brand-light/50 border-brand/20' : 'bg-gray-50 border-subtle'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-sm">{notif.title}</p>
                                {notif.unread && <span className="size-2 bg-brand rounded-full" />}
                            </div>
                            <p className="text-muted text-xs">{notif.desc}</p>
                            <p className="text-gray-400 text-2xs mt-2">{notif.time}</p>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};

export default NotificationsModal;
