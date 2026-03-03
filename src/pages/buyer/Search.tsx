import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import { buyerApi, ApiProduct, ApiStore, ApiCategory, ApiError } from '@/services/api';

interface SearchViewProps {
    onSelectProduct: (p: ApiProduct) => void;
    onSelectStore: (s: ApiStore) => void;
    addToCart: (p: ApiProduct, q: number) => void;
    onBack: () => void;
}

const SearchView: React.FC<SearchViewProps> = ({ onSelectProduct, onSelectStore, addToCart, onBack }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ products: ApiProduct[], stores: ApiStore[], categories: ApiCategory[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults(null);
            return;
        }
        setIsSearching(true);
        setError(null);
        try {
            const response = await buyerApi.searchProducts(searchQuery);
            setResults({
                products: response.products || [],
                stores: response.stores || [],
                categories: response.categories || []
            });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Qidiruvda xatolik');
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => handleSearch(query), 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const hasNoResults = results && results.products.length === 0 && results.stores.length === 0 && results.categories.length === 0;

    return (
        <div className="min-h-screen bg-surface pb-32">
            <header className="sticky top-0 z-[50] bg-card border-b border-subtle">
                <div className="flex items-center p-4">
                    <button onClick={onBack} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
                        <Icon name="chevron_left" className="text-3xl font-bold" />
                    </button>
                    <h1 className="flex-1 text-center font-bold text-lg">Qidiruv</h1>
                    <div className="w-[44px]" />
                </div>

                <div className="px-4 pb-4">
                    <div className="flex items-center gap-3 bg-card rounded-card px-4 py-3 border border-subtle">
                        <Icon name="search" className="text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Do'kon, tovar yoki kategoriya..."
                            autoFocus
                            className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium h-6 outline-none"
                        />
                        {query && (
                            <button onClick={() => { setQuery(''); setResults(null); }} className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2">
                                <Icon name="cancel" className="text-gray-400" filled />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="px-4 pt-4">
                {isSearching && <LoadingSpinner message="Qidirilmoqda..." />}
                {error && <ErrorMessage message={error} />}

                {!isSearching && !error && query && hasNoResults && (
                    <EmptyState icon="search_off" message={`"${query}" bo'yicha hech narsa topilmadi`} />
                )}

                {!isSearching && !error && results && !hasNoResults && (
                    <div className="space-y-6">
                        {results.stores.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold">Do'konlar ({results.stores.length})</h2>
                                {results.stores.map(store => {
                                    const isClosed = !store.is_open;
                                    return (
                                        <div
                                            key={store.id}
                                            onClick={() => !isClosed && onSelectStore(store)}
                                            className={`bg-card rounded-card p-3 border border-subtle flex items-center gap-4 transition-transform ${isClosed ? 'opacity-70 grayscale-[0.2] cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
                                        >
                                            <div
                                                className="size-14 rounded-lg bg-cover bg-center shrink-0 bg-gray-100 flex items-center justify-center relative"
                                                style={{ backgroundImage: store.image ? `url(${store.image})` : undefined }}
                                            >
                                                {isClosed && (
                                                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                                                        <Icon name="lock" className="text-white text-xl" />
                                                    </div>
                                                )}
                                                {!store.image && !isClosed && <Icon name="store" className="text-3xl text-gray-400" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-[15px]">{store.name}</p>
                                                {isClosed ? (
                                                    <span className="text-2xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md mt-1 inline-block">Yopiq</span>
                                                ) : (
                                                    <span className="text-2xs font-bold text-green-600 bg-brand-light px-2 py-0.5 rounded-md mt-1 inline-block">Ochiq</span>
                                                )}
                                            </div>
                                            {!isClosed && <Icon name="chevron_right" className="text-xl text-gray-400" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {results.categories.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold">Kategoriyalar ({results.categories.length})</h2>
                                <div className="flex flex-wrap gap-2">
                                    {results.categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setQuery(cat.name)}
                                            className="bg-brand-light text-brand px-4 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform"
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.products.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold">Mahsulotlar ({results.products.length})</h2>
                                {results.products.map(product => (
                                    <div
                                        key={product.id}
                                        className="bg-card rounded-card p-3 border border-subtle flex items-center gap-4"
                                    >
                                        <div
                                            onClick={() => onSelectProduct(product)}
                                            className="size-20 rounded-lg bg-cover bg-center shrink-0 bg-gray-100 flex items-center justify-center cursor-pointer"
                                            style={{ backgroundImage: product.image ? `url(${product.image})` : undefined }}
                                        >
                                            {!product.image && <Icon name="inventory_2" className="text-3xl text-gray-400" />}
                                        </div>
                                        <div className="flex-1 cursor-pointer" onClick={() => onSelectProduct(product)}>
                                            <p className="font-bold text-[15px] leading-tight mb-1">{product.name}</p>
                                            <p className="text-xs text-muted leading-tight mb-2 line-clamp-1">{product.store_name}</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold text-[15px]">{parseFloat(product.price).toLocaleString()}</span>
                                                <span className="text-xs text-muted font-medium">so'm/{product.unit}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                                            className="h-10 px-4 bg-brand text-white rounded-lg flex items-center justify-center font-bold text-sm active:scale-[0.95] transition-transform shrink-0"
                                        >
                                            <Icon name="add" className="text-xl -ml-1 mr-1" />
                                            Qo'shish
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!query && !results && (
                    <EmptyState icon="search" message="Mahsulot, do'kon yoki kategoriya qidirish uchun yozing" />
                )}
            </div>
        </div>
    );
};

export default SearchView;
