import React from 'react';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import { ApiStore } from '@/services/api';

interface HomeViewProps {
    stores: ApiStore[];
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
    onSelectStore: (s: ApiStore) => void;
    onOpenSearch: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({
    stores,
    isLoading,
    error,
    onRetry,
    onSelectStore,
    onOpenSearch,
}) => (
    <div className="pb-32">
        <header className="sticky top-0 z-header bg-card/80 backdrop-blur-md border-b border-subtle p-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
                <Icon name="location_on" className="text-brand" />
                <span className="text-sm font-semibold">Toshkent</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">BuildGo</h1>
            <button onClick={onOpenSearch} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Icon name="search" />
            </button>
        </header>

        <div className="px-4 pt-6 pb-2">
            <h2 className="text-2xl font-bold leading-tight">Qurilish do'konlari</h2>
            <p className="text-muted text-sm mt-1">Toshkentdagi eng yaxshi do'konlar</p>
        </div>

        {isLoading && <LoadingSpinner message="Do'konlar yuklanmoqda..." />}
        {error && <ErrorMessage message={error} onRetry={onRetry} />}

        {!isLoading && !error && stores.length === 0 && (
            <EmptyState icon="store" message="Do'konlar topilmadi" />
        )}

        {!isLoading && !error && (
            <div className="space-y-4 px-4 mt-4">
                {stores.map(store => (
                    <div
                        key={store.id}
                        onClick={() => onSelectStore(store)}
                        className="bg-card rounded-card overflow-hidden border border-subtle cursor-pointer active:scale-[0.98] transition-transform"
                    >
                        <div
                            className="w-full h-48 bg-cover bg-center bg-gray-100"
                            style={{ backgroundImage: store.image ? `url(${store.image})` : undefined }}
                        >
                            {!store.image && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Icon name="storefront" className="text-4xl text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <p className="text-lg font-bold">{store.name}</p>
                                {store.is_active && (
                                    <span className="bg-brand-light text-green-700 text-2xs font-bold px-2 py-0.5 rounded-md">Ochiq</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-1">
                                    <Icon name="star" className="text-yellow-500 text-sm" filled />
                                    <span className="text-xs font-bold">4.8 (120)</span>
                                </div>
                                <span className="bg-brand text-white text-sm font-bold px-4 py-2 rounded-lg">Kirish</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default HomeView;
