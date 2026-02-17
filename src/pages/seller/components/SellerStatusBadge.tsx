import React from 'react';
import { UIOrderStatus } from '@/hooks/useSellerData';

const STATUS_COLORS: Record<string, string> = {
    'KUTILMOQDA': 'text-yellow-700 bg-yellow-50',
    'YETKAZILDI': 'text-green-700 bg-green-50',
};

interface SellerStatusBadgeProps {
    status: UIOrderStatus;
    onClick?: () => void;
}

const SellerStatusBadge: React.FC<SellerStatusBadgeProps> = ({ status, onClick }) => (
    <span onClick={onClick} className={`text-2xs font-bold px-2 py-1 rounded-md cursor-pointer ${STATUS_COLORS[status] || 'text-gray-600 bg-gray-100'}`}>
        {status}
    </span>
);

export default SellerStatusBadge;
