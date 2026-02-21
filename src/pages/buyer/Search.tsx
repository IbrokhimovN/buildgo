import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { buyerApi, ApiProduct, ApiError } from '@/services/api';

interface SearchViewProps {
    onSelectProduct: (p: ApiProduct) => void;
    addToCart: (p: ApiProduct, q: number) => void;
    onBack: () => void;
}

const SearchView: React.FC<SearchViewProps> = ({ onSelectProduct, addToCart, onBack }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ApiProduct[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        setError(null);
        try {
            const response = await buyerApi.searchProducts(searchQuery);
            setResults(response.results);
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
                            placeholder="Mahsulot qidirish..."
                            autoFocus
                            className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium h-6 outline-none"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2">
                                <Icon name="cancel" className="text-gray-400" filled />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="px-4 pt-4">
                {isSearching && <LoadingSpinner message="Qidirilmoqda..." />}
                {error && <ErrorMessage message={error} />}

                {!isSearching && !error && query && results.length === 0 && (
                    <EmptyState icon="search_off" message={`"${query}" bo'yicha hech narsa topilmadi`} />
                )}

                {!isSearching && !error && results.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold">Natijalar ({results.length})</h2>
                        {results.map(product => (
                            <div
                                key={product.id}
                                className="bg-card rounded-card p-3 border border-subtle flex items-center gap-4"
                            >
                                <div
                                    onClick={() => onSelectProduct(product)}
                                    className="size-20 rounded-card bg-cover bg-center shrink-0 bg-gray-100"
                                    style={{ backgroundImage: product.image ? `url(${product.image})` : undefined }}
                                />
                                <div className="flex-1" onClick={() => onSelectProduct(product)}>
                                    <p className="font-bold text-sm">{product.name}</p>
                                    <p className="text-2xs text-muted mt-0.5">{product.store_name}</p>
                                    <div className="flex items-baseline gap-1 mt-1.5">
                                        <span className="font-bold text-base">{parseFloat(product.price).toLocaleString()}</span>
                                        <span className="text-2xs text-muted font-medium">so'm / {product.unit}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                                    className="size-11 bg-brand text-white rounded-card flex items-center justify-center active:scale-[0.95] transition-transform"
                                >
                                    <Icon name="add_shopping_cart" className="text-xl" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!query && (
                    <EmptyState icon="search" message="Mahsulot qidirish uchun yozing" />
                )}
            </div>
        </div>
    );
};

export default SearchView;
