import React from 'react';
import Icon from '@/components/ui/Icon';

interface OrderSuccessViewProps {
    onGoHome: () => void;
    onViewOrders: () => void;
}

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ onGoHome, onViewOrders }) => (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
        <div className="size-20 bg-brand-light rounded-full flex items-center justify-center mb-6">
            <Icon name="check_circle" className="text-brand text-5xl" filled />
        </div>
        <h1 className="text-2xl font-bold text-center">Buyurtma qabul qilindi!</h1>
        <p className="text-muted text-center mt-3 max-w-sm">
            Buyurtmangiz do'konga yuborildi. Siz buyurtmalar bo'limida kuzatishingiz mumkin.
        </p>
        <div className="w-full max-w-sm mt-8 space-y-3">
            <button
                onClick={onViewOrders}
                className="w-full bg-brand text-white py-4 rounded-card font-bold text-base min-h-[52px] active:scale-[0.98] transition-transform"
            >
                Buyurtmalarni ko'rish
            </button>
            <button
                onClick={onGoHome}
                className="w-full bg-card border border-subtle py-4 rounded-card font-bold text-base text-muted min-h-[52px] active:scale-[0.98] transition-transform"
            >
                Bosh sahifaga
            </button>
        </div>
    </div>
);

export default OrderSuccessView;
