import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import VariantSelectorModal from '@/components/ui/VariantSelectorModal';
import ProductCard from '@/components/ui/ProductCard';
import { buyerApi, ApiStore, ApiProduct, ApiCategory, ApiError, ApiProductVariant } from '@/services/api';

interface StoreDetailsViewProps {
    store: ApiStore;
    onSelectProduct: (p: ApiProduct) => void;
    addToCart: (p: ApiProduct, v: ApiProductVariant | null, q: number) => void;
    onBack: () => void;
}

const StoreDetailsView: React.FC<StoreDetailsViewProps> = ({ store, onSelectProduct, addToCart, onBack }) => {
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState<number | null>(null);
    const [selectedVariantProduct, setSelectedVariantProduct] = useState<ApiProduct | null>(null);

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

    const handleAddToCartClick = (e: React.MouseEvent, product: ApiProduct) => {
        e.stopPropagation();
        if (product.variants && product.variants.length > 0) {
            setSelectedVariantProduct(product);
        } else {
            addToCart(product, null, 1);
        }
    };

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
                <div className="grid grid-cols-2 gap-2 p-4">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onClick={onSelectProduct}
                            onVariantSelect={setSelectedVariantProduct}
                        />
                    ))}
                </div>
            )}

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

export default StoreDetailsView;
