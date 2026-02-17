import React from 'react';
import Icon from '@/components/ui/Icon';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { ApiProduct } from '@/services/api';

export interface CartItem {
    product: ApiProduct;
    quantity: number;
}

interface CartViewProps {
    cart: CartItem[];
    updateCartQuantity: (productId: number, quantity: number) => void;
    removeFromCart: (productId: number) => void;
    onCheckout: () => void;
    onBack: () => void;
}

const CartView: React.FC<CartViewProps> = ({ cart, updateCartQuantity, removeFromCart, onCheckout, onBack }) => {
    const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

    return (
        <div className="min-h-screen bg-surface pb-32">
            <PageHeader title="Savat" onBack={onBack} />

            {cart.length === 0 ? (
                <EmptyState icon="shopping_bag" message="Savat bo'sh" hint="Mahsulot qo'shing!" />
            ) : (
                <>
                    <div className="p-4 space-y-3">
                        {cart.map(item => (
                            <div key={item.product.id} className="bg-card rounded-card p-4 border border-subtle flex items-center gap-4">
                                <div
                                    className="size-16 rounded-lg bg-gray-100 bg-cover bg-center shrink-0"
                                    style={{ backgroundImage: item.product.image ? `url(${item.product.image})` : undefined }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{item.product.name}</p>
                                    <p className="text-brand font-bold mt-0.5 text-sm">{parseFloat(item.product.price).toLocaleString()} so'm</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                        className="size-9 border border-subtle rounded-lg flex items-center justify-center"
                                    >
                                        <Icon name="remove" className="text-lg" />
                                    </button>
                                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                    <button
                                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                        className="size-9 border border-subtle rounded-lg flex items-center justify-center"
                                    >
                                        <Icon name="add" className="text-lg" />
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="size-9 text-danger flex items-center justify-center ml-1"
                                    >
                                        <Icon name="delete" className="text-lg" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cart Summary */}
                    <div className="fixed bottom-[90px] left-0 right-0 px-4 pb-4 pt-3 bg-card border-t border-subtle">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-muted text-sm font-medium">Jami:</span>
                            <span className="text-xl font-black text-brand">{cartTotal.toLocaleString()} so'm</span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-brand text-white py-4 rounded-card font-bold text-base flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98] transition-transform"
                        >
                            <Icon name="shopping_cart_checkout" className="text-xl" />
                            Buyurtma berish
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CartView;
