import React from 'react';
import { SellerOrderUI } from '@/hooks/useSellerData';
import Icon from '@/components/ui/Icon';

interface ReportsTabProps {
    orders: SellerOrderUI[];
    totalRevenue: number;
    newOrdersCount: number;
    onBack: () => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ orders, totalRevenue, newOrdersCount, onBack }) => {
    const deliveredOrders = orders.filter(o => o.status === 'YETKAZILDI');
    const avgCheck = deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0;

    return (
        <div className="pb-32">
            <header className="sticky top-0 z-[50] bg-card/90 backdrop-blur-md p-4 border-b border-subtle">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="text-lg font-bold">Hisobotlar</h1>
                </div>
            </header>

            <div className="px-4 space-y-4 mt-2">
                <div className="bg-card rounded-card p-5 border border-subtle">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-muted text-sm">Yetkazilgan buyurtmalar jami</p>
                        <span className="text-xs font-medium text-green-600 bg-brand-light px-2 py-1 rounded-md">Barcha vaqt</span>
                    </div>
                    <p className="text-3xl font-bold mb-6">{totalRevenue.toLocaleString()} so'm</p>
                    <div className="h-32 relative mb-4">
                        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <path d="M 0 80 Q 30 70 60 50 T 120 30 T 180 60 T 240 40 T 300 50" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 0 80 Q 30 70 60 50 T 120 30 T 180 60 T 240 40 T 300 50 L 300 100 L 0 100 Z" fill="url(#chartGradient)" />
                        </svg>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Jami buyurtmalar', value: `${orders.length} ta` },
                        { label: 'Yetkazildi', value: `${deliveredOrders.length} ta` },
                        { label: "O'rtacha chek", value: `${avgCheck.toLocaleString()} so'm` },
                        { label: 'Kutilmoqda', value: `${newOrdersCount} ta` },
                    ].map(stat => (
                        <div key={stat.label} className="bg-card rounded-card p-4 border border-subtle">
                            <span className="text-muted text-sm">{stat.label}</span>
                            <p className="text-2xl font-bold mt-2">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReportsTab;
