import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import VariantSelectorModal from '@/components/ui/VariantSelectorModal';
import ProductCard from '@/components/ui/ProductCard';
import { buyerApi, ApiProduct, ApiStore, ApiCategory, ApiError, ApiProductVariant } from '@/services/api';

interface SearchViewProps {
    onSelectProduct: (p: ApiProduct) => void;
    onSelectStore: (s: ApiStore) => void;
    addToCart: (p: ApiProduct, v: ApiProductVariant | null, q: number) => void;
    onBack: () => void;
}

const SearchView: React.FC<SearchViewProps> = ({ onSelectProduct, onSelectStore, addToCart, onBack }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [results, setResults] = useState<{ products: ApiProduct[], stores: ApiStore[], categories: ApiCategory[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariantProduct, setSelectedVariantProduct] = useState<ApiProduct | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchSuggestions = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            return;
        }
        try {
            const data = await buyerApi.getSearchSuggestions(searchQuery);
            setSuggestions(data.suggestions);
        } catch {
            // Ignore suggestion errors
        }
    };

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults(null);
            return;
        }
        setShowSuggestions(false);
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
        if (query.trim() && showSuggestions) {
            const debounce = setTimeout(() => fetchSuggestions(query), 300);
            return () => clearTimeout(debounce);
        } else {
            setSuggestions([]);
        }
    }, [query, showSuggestions]);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setShowSuggestions(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch(query);
            inputRef.current?.blur();
        }
    };

    const handleAddToCartClick = (e: React.MouseEvent, product: ApiProduct) => {
        e.stopPropagation();
        if (product.variants && product.variants.length > 0) {
            setSelectedVariantProduct(product);
        } else {
            addToCart(product, null, 1);
        }
    };

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
                            onChange={handleQueryChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => { if (query) setShowSuggestions(true); }}
                            placeholder="Do'kon, tovar yoki kategoriya..."
                            autoFocus
                            className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium h-6 outline-none"
                        />
                        {query && (
                            <button onClick={() => { setQuery(''); setResults(null); setSuggestions([]); }} className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2">
                                <Icon name="cancel" className="text-gray-400" filled />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="px-4 pt-4">
                {showSuggestions && suggestions.length > 0 && (
                    <div className="bg-card rounded-xl border border-subtle overflow-hidden mb-6">
                        {suggestions.map((sugg, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setQuery(sugg);
                                    handleSearch(sugg);
                                }}
                                className="w-full text-left px-4 py-3 border-b border-subtle last:border-b-0 flex items-center gap-3 active:bg-gray-50"
                            >
                                <Icon name="search" className="text-gray-400 text-sm" />
                                <span className="font-medium text-[15px]">{sugg}</span>
                            </button>
                        ))}
                    </div>
                )}
                {isSearching && <LoadingSpinner message="Qidirilmoqda..." />}
                {error && <ErrorMessage message={error} />}

                {!isSearching && !error && query && hasNoResults && !showSuggestions && (
                    <EmptyState icon="search_off" message={`"${query}" bo'yicha hech narsa topilmadi`} />
                )}

                {!isSearching && !error && results && !hasNoResults && !showSuggestions && (
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
                                <div className="grid grid-cols-2 gap-2">
                                    {results.products.map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onClick={onSelectProduct}
                                            onVariantSelect={setSelectedVariantProduct}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!query && !results && (
                    <EmptyState icon="search" message="Mahsulot, do'kon yoki kategoriya qidirish uchun yozing" />
                )}
            </div>

            {selectedVariantProduct && (
                <VariantSelectorModal
                    isOpen={!!selectedVariantProduct}
                    onClose={() => setSelectedVariantProduct(null)}
                    product={selectedVariantProduct}
                    onSelectVariant={(variant, qty) => addToCart(selectedVariantProduct, variant, qty)}
                />
            )}
        </div>
    );
};

export default SearchView;
