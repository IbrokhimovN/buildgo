import React from 'react';
import Icon from '@/components/ui/Icon';
import { ViewState } from '@/types';

interface TabBarProps {
    currentView: ViewState;
    setView: (v: ViewState) => void;
    cartItemCount: number;
}

const tabs = [
    { id: 'HOME', icon: 'home', label: 'Bosh sahifa' },
    { id: 'SEARCH', icon: 'search', label: 'Qidirish' },
    { id: 'CART', icon: 'shopping_bag', label: 'Savat' },
    { id: 'PROFILE', icon: 'person', label: 'Profil' },
] as const;

const TabBar: React.FC<TabBarProps> = ({ currentView, setView, cartItemCount }) => (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[96%] max-w-2xl bg-card/95 backdrop-blur-lg border border-subtle rounded-card px-4 pt-2 pb-3 z-[100]">
        <div className="flex justify-between items-center">
            {tabs.map((tab) => {
                const isActive = currentView === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setView(tab.id as ViewState)}
                        aria-label={tab.label}
                        className={`flex flex-col items-center gap-1 flex-1 relative min-h-[44px] justify-center active:scale-[0.98] ${isActive ? 'text-brand' : 'text-gray-400'}`}
                    >
                        <div className="relative">
                            <Icon name={tab.icon} filled={isActive} />
                            {tab.id === 'CART' && cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-2 bg-danger text-white text-2xs size-4 rounded-full flex items-center justify-center font-bold">
                                    {cartItemCount > 9 ? '9+' : cartItemCount}
                                </span>
                            )}
                        </div>
                        <span className="text-2xs font-medium leading-none">{tab.label}</span>
                        {isActive && <span className="w-1 h-1 rounded-full bg-brand mt-0.5" />}
                    </button>
                );
            })}
        </div>
    </nav>
);

export default TabBar;
