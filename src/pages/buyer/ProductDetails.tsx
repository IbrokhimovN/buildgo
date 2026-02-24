import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import PageHeader from '@/components/ui/PageHeader';
import { ApiProduct } from '@/services/api';

interface ProductDetailsViewProps {
    product: ApiProduct;
    addToCart: (p: ApiProduct, q: number) => void;
    onBack: () => void;
}

const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({ product, addToCart, onBack }) => {
    const [quantity, setQuantity] = useState(1);

    return (
        <div className="bg-surface min-h-screen pb-32">
            <PageHeader title={product.name} onBack={onBack} transparent />

            <div className="aspect-square bg-gray-100 bg-cover bg-center" style={{ backgroundImage: product.image ? `url(${product.image})` : undefined }}>
                {!product.image && (
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon name="image" className="text-5xl text-gray-400" />
                    </div>
                )}
            </div>

            <div className="bg-card rounded-t-modal -mt-3 relative p-4">
                <h1 className="text-xl font-bold">{product.name}</h1>
                <p className="text-muted text-sm mt-1">{product.store_name}</p>

                <div className="mt-4">
                    <span className="text-2xl font-black text-brand">{parseFloat(product.price).toLocaleString()}</span>
                    <span className="text-muted text-base ml-1.5 font-medium">so'm / {product.unit}</span>
                </div>

                {product.description && (
                    <div className="mt-4 pb-4 border-b border-subtle">
                        <h3 className="text-sm font-bold mb-2">Mahsulot haqida</h3>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{product.description}</p>
                    </div>
                )}

                {/* Quantity Selector */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-gray-700">Miqdorini tanlang:</span>
                        <span className="text-sm text-muted">Qoldiq: {product.quantity} ta</span>
                    </div>
                    {product.quantity > 0 ? (
                        <div className="flex items-center gap-4 justify-center">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="size-11 border border-subtle rounded-card flex items-center justify-center active:scale-[0.95] transition-transform"
                            >
                                <Icon name="remove" />
                            </button>
                            <span className="text-xl font-bold w-10 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                                className="size-11 border border-subtle rounded-card flex items-center justify-center active:scale-[0.95] transition-transform flex-shrink-0 bg-gray-50"
                            >
                                <Icon name="add" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-danger font-medium p-3 bg-danger-light rounded-card">
                            Sotuvda vaqtincha yo'q
                        </div>
                    )}
                </div>

                {/* Add to Cart */}
                <button
                    onClick={() => addToCart(product, quantity)}
                    disabled={product.quantity === 0}
                    className="mt-6 w-full bg-brand text-white py-4 rounded-card font-bold text-base flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:bg-gray-400"
                >
                    <Icon name="shopping_cart" className="text-xl" />
                    {product.quantity > 0
                        ? `Savatga qo'shish — ${(parseFloat(product.price) * quantity).toLocaleString()} so'm`
                        : "Sotuvda yo'q"}
                </button>
            </div>
        </div>
    );
};

export default ProductDetailsView;
