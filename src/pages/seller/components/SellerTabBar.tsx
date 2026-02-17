import React from 'react';
import { SellerTabState } from '@/types';
import Icon from '@/components/ui/Icon';

const TABS: { id: SellerTabState; icon: string; label: string }[] = [
    { id: 'DASHBOARD', icon: 'dashboard', label: 'Dashboard' },
    { id: 'REPORTS', icon: 'bar_chart', label: 'Hisobotlar' },
    { id: 'PRODUCTS', icon: 'inventory_2', label: 'Mahsulotlar' },
    { id: 'ORDERS', icon: 'shopping_bag', label: 'Buyurtmalar' },
    { id: 'SETTINGS', icon: 'settings', label: 'Sozlamalar' },
];

interface SellerTabBarProps {
    activeTab: SellerTabState;
    setActiveTab: (t: SellerTabState) => void;
}

const SellerTabBar: React.FC<SellerTabBarProps> = ({ activeTab, setActiveTab }) => (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-subtle flex justify-around items-center pt-2 pb-6 px-2 z-tab-bar">
        {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 flex-1 min-h-[44px] justify-center ${activeTab === tab.id ? 'text-brand' : 'text-gray-400'}`}>
                <Icon name={tab.icon} filled={activeTab === tab.id} />
                <span className="text-2xs font-medium">{tab.label}</span>
            </button>
        ))}
    </nav>
);

export default SellerTabBar;
