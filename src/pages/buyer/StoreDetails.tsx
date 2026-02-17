import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { buyerApi, ApiStore, ApiProduct, ApiCategory, ApiError } from '@/services/api';

interface StoreDetailsViewProps {
    store: ApiStore;
    onSelectProduct: (p: ApiProduct) => void;
    addToCart: (p: ApiProduct, q: number) => void;
    onBack: () => void;
}

const StoreDetailsView: React.FC<StoreDetailsViewProps> = ({ store, onSelectProduct, addToCart, onBack }) => {
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState<number | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                buyerApi.getStoreProducts(store.id),
                buyerApi.getStoreCategories(store.id),
            ]);
            setProducts(productsRes.results);
            setCategories(categoriesRes.results);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Ma'lumotlarni yuklashda xatolik");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [store.id]);

    const filteredProducts = activeCat ? products.filter(p => p.category === activeCat) : products;

    return (
        <div className="pb-32">
            <PageHeader title={store.name} onBack={onBack} transparent />

            {/* Categories */}
            <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar bg-card border-b border-gray-50">
                <button
                    onClick={() => setActiveCat(null)}
                    className={`flex h-9 shrink-0 items-center justify-center px-5 rounded-pill text-sm font-semibold transition-colors ${activeCat === null ? 'bg-brand text-white' : 'bg-gray-100 text-muted'}`}
                >
                    Barchasi
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCat(cat.id)}
                        className={`flex h-9 shrink-0 items-center justify-center px-5 rounded-pill text-sm font-semibold transition-colors ${activeCat === cat.id ? 'bg-brand text-white' : 'bg-gray-100 text-muted'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {isLoading && <LoadingSpinner message="Mahsulotlar yuklanmoqda..." />}
            {error && <ErrorMessage message={error} onRetry={fetchData} />}

            {!isLoading && !error && filteredProducts.length === 0 && (
                <EmptyState icon="inventory_2" message="Mahsulotlar topilmadi" />
            )}

            {!isLoading && !error && (
                <div className="grid grid-cols-2 gap-3 p-4">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="bg-card rounded-card overflow-hidden border border-subtle p-3 flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
                        >
                            <div
                                onClick={() => onSelectProduct(product)}
                                className="aspect-square bg-cover bg-center rounded-lg mb-2 bg-gray-100"
                                style={{ backgroundImage: product.image ? `url(${product.image})` : undefined }}
                            />
                            <p onClick={() => onSelectProduct(product)} className="text-sm font-bold line-clamp-2 h-10">{product.name}</p>
                            <p className="text-brand text-base font-black mt-1">{parseFloat(product.price).toLocaleString()} so'm</p>
                            <button
                                onClick={() => addToCart(product, 1)}
                                className="mt-3 w-full bg-brand text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 min-h-[44px]"
                            >
                                <Icon name="shopping_cart" className="text-lg" /> Savatga
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StoreDetailsView;
