import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import PageHeader from '@/components/ui/PageHeader';
import ProductImageCarousel from '@/components/ui/ProductImageCarousel';
import VariantSelectorModal from '@/components/ui/VariantSelectorModal';
import QuantitySelector from '@/components/ui/QuantitySelector';
import ProductCard from '@/components/ui/ProductCard';
import { buyerApi, ApiProduct, ApiProductVariant } from '@/services/api';

interface ProductDetailsViewProps {
    product: ApiProduct;
    addToCart: (p: ApiProduct, v: ApiProductVariant | null, q: number) => void;
    onSelectProduct: (p: ApiProduct) => void;
    onBack: () => void;
}

const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({ product, addToCart, onSelectProduct, onBack }) => {
    const [quantity, setQuantity] = useState(1);
    const [isVariantModalOpen, setVariantModalOpen] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
    const [selectedVariantProduct, setSelectedVariantProduct] = useState<ApiProduct | null>(null);

    React.useEffect(() => {
        buyerApi.getRelatedProducts(product.id).then(setRelatedProducts).catch(() => { });
        setQuantity(1); // reset quantity when product changes
    }, [product.id]);

    // Prepare images array
    const images = product.images && product.images.length > 0
        ? product.images.map(img => img.image)
        : product.image ? [product.image] : [];

    const hasVariants = product.variants && product.variants.length > 0;

    const handleAddToCartClick = () => {
        if (hasVariants) {
            setVariantModalOpen(true);
        } else {
            addToCart(product, null, quantity);
        }
    };

    return (
        <div className="bg-surface min-h-screen pb-32">
            <PageHeader title={product.name} onBack={onBack} transparent />

            <div className="w-full">
                <ProductImageCarousel images={images} />
            </div>

            <div className="bg-card rounded-t-modal -mt-3 relative p-4 flex flex-col min-h-[50vh]">
                <h1 className="text-xl font-bold">{product.name}</h1>
                <p className="text-muted text-sm mt-1">{product.store_name}</p>

                <div className="mt-4">
                    {hasVariants ? (
                        <span className="text-2xl font-black text-brand">Varianlar mavjud</span>
                    ) : (
                        <>
                            <span className="text-2xl font-black text-brand">{parseFloat(product.price).toLocaleString()}</span>
                            <span className="text-muted text-base ml-1.5 font-medium">so'm / {product.unit}</span>
                        </>
                    )}
                </div>

                {product.description && (
                    <div className="mt-4 pb-4 border-b border-subtle">
                        <h3 className="text-sm font-bold mb-2">Mahsulot haqida</h3>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{product.description}</p>
                    </div>
                )}

                {/* Fill empty space so button sticks to bottom on tall screens if content is short */}
                <div className="flex-1"></div>

                {/* Logic for simple "No Variant" vs "Has Variant" selector */}
                {!hasVariants && product.quantity > 0 && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-gray-700">Miqdorini tanlang:</span>
                            <span className="text-sm text-muted">Qoldiq: {product.quantity} dona</span>
                        </div>
                        <div className="flex justify-center">
                            <QuantitySelector
                                quantity={quantity}
                                onChange={setQuantity}
                                maxQuantity={product.quantity}
                                size="lg"
                            />
                        </div>
                    </div>
                )}

                {/* Notice for out of stock base product */}
                {!hasVariants && product.quantity === 0 && (
                    <div className="mt-6 text-center text-danger font-medium p-3 bg-danger-light rounded-card">
                        Sotuvda vaqtincha yo'q
                    </div>
                )}

                {/* Add to Cart Button */}
                <button
                    onClick={handleAddToCartClick}
                    disabled={!hasVariants && product.quantity === 0}
                    className="mt-6 w-full bg-brand text-white py-4 rounded-card font-bold text-base flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:bg-gray-400"
                >
                    <Icon name="shopping_cart" className="text-xl" />
                    {hasVariants
                        ? "Variantni tanlash"
                        : product.quantity > 0
                            ? `Savatga qo'shish — ${(parseFloat(product.price) * quantity).toLocaleString()} so'm`
                            : "Sotuvda yo'q"
                    }
                </button>
            </div>

            {hasVariants && (
                <VariantSelectorModal
                    isOpen={isVariantModalOpen}
                    onClose={() => setVariantModalOpen(false)}
                    product={product}
                    onSelectVariant={(variant, qty) => addToCart(product, variant, qty)}
                />
            )}

            {relatedProducts.length > 0 && (
                <div className="mt-8 border-t border-subtle pt-6 px-4 pb-4">
                    <h3 className="text-lg font-bold mb-4">O'xshash mahsulotlar</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {relatedProducts.map(rp => (
                            <ProductCard
                                key={rp.id}
                                product={rp}
                                onClick={(p) => { window.scrollTo(0, 0); onSelectProduct(p); }}
                                onVariantSelect={setSelectedVariantProduct}
                            />
                        ))}
                    </div>
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

export default ProductDetailsView;
