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

                {/* Quantity Selector */}
                <div className="mt-6 flex items-center gap-4 justify-center">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="size-11 border border-subtle rounded-card flex items-center justify-center active:scale-[0.95] transition-transform"
                    >
                        <Icon name="remove" />
                    </button>
                    <span className="text-xl font-bold w-10 text-center">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="size-11 border border-subtle rounded-card flex items-center justify-center active:scale-[0.95] transition-transform"
                    >
                        <Icon name="add" />
                    </button>
                </div>

                {/* Add to Cart */}
                <button
                    onClick={() => addToCart(product, quantity)}
                    className="mt-6 w-full bg-brand text-white py-4 rounded-card font-bold text-base flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98] transition-transform"
                >
                    <Icon name="shopping_cart" className="text-xl" />
                    Savatga qo'shish — {(parseFloat(product.price) * quantity).toLocaleString()} so'm
                </button>
            </div>
        </div>
    );
};

export default ProductDetailsView;
