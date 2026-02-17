import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import PageHeader from '@/components/ui/PageHeader';
import MapLocationPicker from '@/components/map/MapLocationPicker';
import { ApiLocation, ApiOrder, ApiError, AuthError, RateLimitError } from '@/services/api';
import { CartItem } from './Cart';

interface CheckoutViewProps {
    cart: CartItem[];
    locations: ApiLocation[];
    onSuccess: () => void;
    onBack: () => void;
    clearCart: () => void;
    submitOrder: () => Promise<ApiOrder>;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({
    cart,
    locations,
    onSuccess,
    onBack,
    clearCart,
    submitOrder,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<ApiLocation | null>(locations[0] || null);

    const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

    // Group items by store
    const storeGroups = cart.reduce((groups, item) => {
        const storeId = item.product.store;
        if (!groups[storeId]) groups[storeId] = { storeName: item.product.store_name, items: [] };
        groups[storeId].items.push(item);
        return groups;
    }, {} as Record<number, { storeName: string; items: CartItem[] }>);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await submitOrder();
            onSuccess();
        } catch (err) {
            if (err instanceof AuthError) {
                setError("Ilovani Telegram orqali qayta oching");
            } else if (err instanceof RateLimitError) {
                setError(`Juda ko'p so'rov. ${err.retryAfter} soniyadan keyin qayta urinib ko'ring.`);
            } else {
                setError(err instanceof ApiError ? err.message : "Buyurtma yuborishda xatolik yuz berdi");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showMap) {
        return (
            <div className="fixed inset-0 z-modal bg-surface">
                <PageHeader title="Joylashuvni tanlang" onBack={() => setShowMap(false)} />
                <MapLocationPicker
                    onConfirm={(loc) => { setSelectedLocation(loc); setShowMap(false); }}
                    onCancel={() => setShowMap(false)}
                    existingLocations={locations}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-32">
            <PageHeader title="Buyurtma berish" onBack={onBack} />

            <div className="p-4 space-y-6">
                {error && (
                    <div className="p-4 bg-danger-light border border-red-200 text-danger rounded-card text-sm">{error}</div>
                )}

                {/* Location */}
                <div>
                    <h3 className="text-base font-bold mb-3">Yetkazish manzili</h3>
                    <button
                        onClick={() => setShowMap(true)}
                        className="w-full p-4 rounded-card border border-subtle bg-card flex items-center gap-3 min-h-[52px]"
                    >
                        <Icon name="location_on" className="text-brand" />
                        <span className="flex-1 text-left text-sm">
                            {selectedLocation ? selectedLocation.address || "Manzil tanlangan" : "Manzilni tanlash"}
                        </span>
                        <Icon name="chevron_right" className="text-gray-400" />
                    </button>
                </div>

                {/* Order Summary */}
                <div className="bg-card rounded-card border border-subtle p-4">
                    <h3 className="text-base font-bold mb-3">Buyurtma</h3>
                    {Object.entries(storeGroups).map(([storeId, group]) => (
                        <div key={storeId} className="mb-3 last:mb-0">
                            <p className="text-sm font-semibold text-muted mb-1">{group.storeName}</p>
                            {group.items.map(item => (
                                <div key={item.product.id} className="flex justify-between text-sm py-1">
                                    <span>{item.product.name} × {item.quantity}</span>
                                    <span className="font-bold">{(parseFloat(item.product.price) * item.quantity).toLocaleString()} so'm</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="border-t border-subtle mt-3 pt-3 flex justify-between">
                        <span className="font-bold">Jami:</span>
                        <span className="font-black text-brand text-lg">{cartTotal.toLocaleString()} so'm</span>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-subtle">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full bg-brand text-white py-4 rounded-card font-bold text-base flex items-center justify-center gap-2 min-h-[52px] disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                    {isSubmitting ? (
                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Icon name="send" className="text-xl" /> Buyurtma berish
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CheckoutView;
