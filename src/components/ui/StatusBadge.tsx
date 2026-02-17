import React from 'react';
import { UIOrderStatus } from '@/hooks/useSellerData';

interface StatusBadgeProps {
    status: UIOrderStatus;
    onClick?: () => void;
}

const statusColors: Record<string, string> = {
    'KUTILMOQDA': 'text-yellow-700 bg-warning-light',
    'YETKAZILDI': 'text-green-700 bg-brand-light',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onClick }) => (
    <span
        onClick={onClick}
        className={`text-2xs font-bold px-2 py-1 rounded-md cursor-pointer ${statusColors[status] || 'text-gray-600 bg-gray-100'}`}
    >
        {status}
    </span>
);

export default StatusBadge;
