import React from 'react';
import Icon from '@/components/ui/Icon';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { ApiCartItem, ApiProductVariant } from '@/services/api';

interface CartViewProps {
  cart: ApiCartItem[];
  cartTotal: number;
  updateCartQuantity: (itemId: number, quantity: number) => void;
  removeFromCart: (itemId: number) => void;
  onCheckout: () => void;
  onBack: () => void;
}

const CartView: React.FC<CartViewProps> = ({
  cart, cartTotal, updateCartQuantity, removeFromCart, onCheckout, onBack,
}) => {
  const isStoreClosed = cart.some(item => item.product && (item.product as any).store_is_closed);

  return (
    <div className="min-h-screen bg-surface pb-32">
      <PageHeader title="Savat" onBack={onBack} />

      {cart.length === 0 ? (
        <EmptyState icon="shopping_bag" message="Savat bo'sh" hint="Mahsulot qo'shing!" />
      ) : (
        <>
          <div className="p-4 space-y-3">
            {cart.map(item => {
              const price = item.variant ? item.variant.price : item.product.price;
              const imgUrl = item.product.images?.length
                ? item.product.images[0].image
                : item.product.image;

              return (
                <div key={item.id} className="bg-card rounded-card p-4 border border-subtle flex items-center gap-4">
                  <div
                    className="size-16 rounded-lg bg-gray-100 bg-cover bg-center shrink-0"
                    style={{ backgroundImage: imgUrl ? `url(${imgUrl})` : undefined }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.product.name}</p>
                    {item.variant && item.variant.attributes.map(attr => (
                      <p key={attr.id} className="text-xs text-muted truncate">
                        {attr.attribute_name}: {attr.value}
                      </p>
                    ))}
                    <p className="text-brand font-bold mt-0.5 text-sm">
                      {parseFloat(price).toLocaleString()} so'm
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <QuantitySelector
                      quantity={item.quantity}
                      onChange={(newQty) => updateCartQuantity(item.id, newQty)}
                      onRemove={() => removeFromCart(item.id)}
                      maxQuantity={item.variant ? item.variant.quantity : item.product.quantity}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="fixed bottom-[90px] left-0 right-0 px-4 pb-4 pt-3 bg-card border-t border-subtle">
            {isStoreClosed && (
              <div className="mb-3 p-3 bg-danger-light text-danger text-sm font-semibold rounded-card flex items-start gap-2 border border-red-200">
                <Icon name="error_outline" className="text-xl shrink-0 mt-0.5" />
                <p>Do'kon hozirda yopiq. Buyurtma berish vaqtincha to'xtatilgan.</p>
              </div>
            )}
            <div className="flex justify-between items-center mb-3">
              <span className="text-muted text-sm font-medium">Jami:</span>
              <span className="text-xl font-black text-brand">{cartTotal.toLocaleString()} so'm</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={isStoreClosed}
              className="w-full bg-brand text-white py-4 rounded-card font-bold text-base flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
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
