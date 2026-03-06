import React, { useState } from 'react';
import { ApiProduct } from '@/services/api';
import Icon from '@/components/ui/Icon';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { BASE_URL } from '@/services/telegram';
import { useCart } from '@/hooks/useBuyerData';

interface ProductCardProps {
    product: ApiProduct;
    onVariantSelect: (product: ApiProduct) => void;
    onClick: (product: ApiProduct) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onVariantSelect, onClick }) => {
    const { items: cartItems, addItem: addToCart, updateQuantity: updateCartQuantity, removeItem: removeFromCart } = useCart();

    // Check if the product is in cart (any variant or no variant)
    // If it has variants, we don't show the quantity selector on the card, we just show "Savatga"
    // Wait, the requirement says: "If no variants exist, Add to Cart swaps to QuantitySelector. If variants exist, opens VariantSelectorModal."

    const hasVariants = product.variants && product.variants.length > 0;

    // Get total quantity of this product in cart (across all variants, or if no variants)
    // Actually, if it has no variants, it's just the one cart item.
    const cartItem = cartItems.find(item => item.product.id === product.id && !item.variant);
    const inCartQuantity = cartItem ? cartItem.quantity : 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasVariants) {
            onVariantSelect(product);
        } else {
            addToCart(product, null, 1);
        }
    };

    const handleQuantityChange = (newQuantity: number) => {
        if (!hasVariants) {
            updateCartQuantity(product.id, null, newQuantity);
        }
    };

    const handleRemove = () => {
        if (!hasVariants) {
            removeFromCart(product.id, null);
        }
    };

    // Use default image or first variant/image
    const imageUrl = product.image
        ? `${BASE_URL}${product.image}`
        : (product.images && product.images.length > 0
            ? `${BASE_URL}${product.images[0].image}`
            : null);

    // Calc discount percentage if old_price exists
    const oldPrice = product.old_price ? parseFloat(product.old_price) : 0;
    const currentPrice = parseFloat(product.price);
    const discountPercent = oldPrice > currentPrice
        ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
        : 0;

    return (
        <div
            onClick={() => onClick(product)}
            className="bg-surface rounded-xl border border-subtle overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
        >
            {/* Image Box */}
            <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-2">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <Icon name="inventory_2" className="text-4xl text-gray-300" />
                )}

                {/* Discount Badge */}
                {discountPercent > 0 && (
                    <div className="absolute top-2 left-2 bg-danger text-white text-xs font-bold px-2 py-1 rounded-md">
                        -{discountPercent}%
                    </div>
                )}

                {/* Wishlist Button Placeholder */}
                <button
                    onClick={(e) => { e.stopPropagation(); /* TODO: Toggle Wishlist */ }}
                    className="absolute top-2 right-2 size-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-danger active:scale-90 transition-all"
                >
                    <Icon name="favorite_border" className="text-sm" />
                </button>
            </div>

            {/* Content Box */}
            <div className="p-3 flex flex-col flex-1 gap-1">
                {/* Installment Info */}
                {product.installment_price && (
                    <div className="bg-warning/10 text-warning-dark text-[10px] font-medium px-2 py-0.5 rounded w-fit">
                        {parseInt(product.installment_price).toLocaleString()} so'm/oyiga
                    </div>
                )}

                {/* Title */}
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight flex-1">
                    {product.name}
                </h3>

                {/* Rating */}
                {product.rating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5 mb-1">
                        <Icon name="star" className="text-warning text-xs" />
                        <span className="text-xs font-medium text-gray-700">{product.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-400">({product.reviews_count} sharh)</span>
                    </div>
                )}

                {/* Pricing Area */}
                <div className="mt-1 flex flex-col">
                    {oldPrice > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                            {oldPrice.toLocaleString()} so'm
                        </span>
                    )}
                    <span className="text-sm font-bold text-gray-900">
                        {parseInt(product.price).toLocaleString()} so'm
                    </span>
                </div>

                {/* Action Area */}
                <div className="mt-3 flex justify-center items-center h-9">
                    {!hasVariants && inCartQuantity > 0 ? (
                        <div className="w-full h-full">
                            <QuantitySelector
                                quantity={inCartQuantity}
                                onChange={handleQuantityChange}
                                onRemove={handleRemove}
                                maxQuantity={product.quantity || 99}
                                size="full"
                            />
                        </div>
                    ) : (
                        <button
                            onClick={handleAddToCart}
                            disabled={!product.is_available}
                            className={`w-full h-full rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-colors ${product.is_available
                                ? 'bg-brand text-white active:bg-brand-dark'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Icon name="shopping_cart" className="text-[16px]" />
                            <span>Savatga</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
