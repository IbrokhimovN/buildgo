import React from 'react';
import { SellerOrderUI } from '@/hooks/useSellerData';
import SellerStatusBadge from './SellerStatusBadge';

interface OrderCardProps {
    order: SellerOrderUI;
    onClick: (order: SellerOrderUI) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => (
    <div onClick={() => onClick(order)}
        className="bg-card rounded-card p-4 border border-subtle flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
        <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-muted">{order.customerInitials}</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{order.customerName}</p>
            <div className="text-muted text-xs mt-1 space-y-0.5">
                {order.items.map((item, idx) => (
                    <div key={item.id} className="truncate">
                        {idx + 1}) {item.product_name} — {item.quantity} dona
                    </div>
                ))}
            </div>
        </div>
        <div className="text-right shrink-0">
            <p className="font-bold text-sm">{order.totalPrice.toLocaleString()} so'm</p>
            <SellerStatusBadge status={order.status} />
        </div>
    </div>
);

export default OrderCard;
