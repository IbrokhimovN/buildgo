import React, { useState, useEffect } from 'react';
import { ViewState } from '@/types';
import { useStores, useCart, useLocations } from '@/hooks/useBuyerData';
import {
    sellerApi,
    buyerApi,
    ApiStore,
    ApiProduct,
    ApiOrder,
    ApiSeller,
    ApiError,
    AuthError,
    ForbiddenError,
    RateLimitError,
} from '@/services/api';
import { getTelegramUser, TelegramUser, isInsideTelegram } from '@/services/telegram';

// UI Components
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import AuthErrorScreen from '@/components/ui/AuthErrorScreen';
import RateLimitScreen from '@/components/ui/RateLimitScreen';
import TabBar from '@/components/buyer/TabBar';

// Buyer Pages
import HomeView from '@/pages/buyer/Home';
import SearchView from '@/pages/buyer/Search';
import StoreDetailsView from '@/pages/buyer/StoreDetails';
import ProductDetailsView from '@/pages/buyer/ProductDetails';
import CartView from '@/pages/buyer/Cart';
import CheckoutView from '@/pages/buyer/Checkout';
import OrderSuccessView from '@/pages/buyer/OrderSuccess';
import ProfileView from '@/pages/buyer/Profile';
import OrdersView from '@/pages/buyer/Orders';

// Seller
import SellerDashboard from '@/pages/seller/SellerDashboard';

type AppMode = 'loading' | 'customer' | 'seller' | 'auth_error' | 'rate_limited' | 'error';

export default function App() {
    const [appMode, setAppMode] = useState<AppMode>('loading');
    const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
    const [sellerStoreId, setSellerStoreId] = useState<number>(0);
    const [sellerStoreName, setSellerStoreName] = useState<string>('');
    const [sellerName, setSellerName] = useState<string>('');
    const [bootError, setBootError] = useState<string | null>(null);
    const [rateLimitRetry, setRateLimitRetry] = useState<number>(30);
    const [view, setView] = useState<ViewState>('HOME');

    // Hooks (called before any early returns)
    const { stores, isLoading: isLoadingStores, error: storesError, refetch: fetchStores } = useStores();
    const {
        items: cart,
        addItem,
        updateQuantity: updateCartQty,
        removeItem: removeFromCart,
        clearCart,
        submitOrder,
    } = useCart();
    const { locations } = useLocations();

    // Navigation states
    const [selectedStore, setSelectedStore] = useState<ApiStore | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
    const [previousView, setPreviousView] = useState<ViewState>('HOME');

    // Bootstrap: determine if user is seller via optimistic probe
    useEffect(() => {
        const bootstrap = async () => {
            const tgUser = getTelegramUser();

            if (!tgUser) {
                // Dev mode — no Telegram context
                const devUser: TelegramUser = {
                    telegram_id: 123456789,
                    first_name: 'Dev',
                    last_name: 'User',
                };
                setTelegramUser(devUser);

                const params = new URLSearchParams(window.location.search);
                if (params.get('mode') === 'seller') {
                    // In dev mode, attempt seller endpoint probe
                    try {
                        const ordersRes = await sellerApi.getOrders();
                        // If we get here, user is a seller — but we need store info
                        // Try to get it from the orders or fallback
                        setSellerStoreId(1); // Dev fallback
                        setSellerStoreName("Dev Do'kon");
                        setSellerName('Dev Seller');
                        setAppMode('seller');
                        return;
                    } catch {
                        // Not a seller or no auth — fallback to dev seller with mock data
                        setSellerStoreId(1);
                        setSellerStoreName("Dev Do'kon");
                        setSellerName('Dev Seller');
                        setAppMode('seller');
                        return;
                    }
                }
                setAppMode('customer');
                return;
            }

            setTelegramUser(tgUser);

            // Optimistic seller probe: try to hit a seller endpoint
            // If it succeeds (200), user is a seller
            // If 403, user is a customer
            // If 401, auth failed
            try {
                const ordersRes = await sellerApi.getOrders();
                // Success → user is a seller. Extract store info from first order if available
                if (ordersRes.results.length > 0) {
                    const firstOrder = ordersRes.results[0];
                    setSellerStoreId(firstOrder.store);
                    setSellerStoreName(firstOrder.store_name);
                } else {
                    // Seller with no orders — try products endpoint via stores
                    // We still know they're a seller because endpoint succeeded
                    setSellerStoreId(0); // Will be resolved below
                    setSellerStoreName('');
                }
                setSellerName(tgUser.first_name);
                setAppMode('seller');
            } catch (err) {
                if (err instanceof AuthError) {
                    setAppMode('auth_error');
                } else if (err instanceof ForbiddenError) {
                    // Not a seller → customer mode
                    setAppMode('customer');
                } else if (err instanceof RateLimitError) {
                    setRateLimitRetry(err.retryAfter);
                    setAppMode('rate_limited');
                } else {
                    // Network error or unexpected → show error with retry
                    setBootError("Tarmoq xatoligi. Qayta urinib ko'ring.");
                    setAppMode('error');
                }
            }
        };
        bootstrap();
    }, []);

    // Cart helper
    const addToCart = (product: ApiProduct, quantity: number) => {
        const result = addItem(product, quantity);
        if (result === 'conflict') {
            const storeName = cart[0]?.product.store_name || "boshqa do'kon";
            if (window.confirm(`Savatingizda "${storeName}" do'konidan mahsulotlar bor. Savatni tozalab, yangi mahsulot qo'shilsinmi?`)) {
                clearCart();
                addItem(product, quantity);
            }
        }
    };

    // ─── RENDER ───
    if (appMode === 'loading') {
        return (
            <div className="max-w-lg mx-auto bg-surface min-h-screen flex items-center justify-center font-sans text-gray-900">
                <LoadingSpinner />
            </div>
        );
    }

    if (appMode === 'auth_error') {
        return <AuthErrorScreen />;
    }

    if (appMode === 'rate_limited') {
        return <RateLimitScreen retryAfter={rateLimitRetry} />;
    }

    if (appMode === 'error') {
        return (
            <div className="max-w-lg mx-auto bg-surface min-h-screen flex items-center justify-center p-6 font-sans text-gray-900">
                <ErrorMessage message={bootError || "Serverga ulanib bo'lmadi"} onRetry={() => window.location.reload()} />
            </div>
        );
    }

    if (appMode === 'seller' && telegramUser) {
        return (
            <div className="max-w-lg mx-auto bg-surface min-h-screen relative font-sans text-gray-900 overflow-x-hidden">
                <SellerDashboard
                    storeId={sellerStoreId}
                    storeName={sellerStoreName}
                    sellerName={sellerName}
                />
            </div>
        );
    }

    // ─── CUSTOMER MODE ───
    const renderContent = () => {
        switch (view) {
            case 'HOME':
                return (
                    <HomeView
                        stores={stores}
                        isLoading={isLoadingStores}
                        error={storesError}
                        onRetry={fetchStores}
                        onSelectStore={(s) => { setSelectedStore(s); setPreviousView('HOME'); setView('STORE_DETAILS'); }}
                        onOpenSearch={() => { setPreviousView('HOME'); setView('SEARCH'); }}
                    />
                );
            case 'SEARCH':
                return (
                    <SearchView
                        onSelectProduct={(p) => { setSelectedProduct(p); setPreviousView('SEARCH'); setView('PRODUCT_DETAILS'); }}
                        addToCart={addToCart}
                        onBack={() => setView('HOME')}
                    />
                );
            case 'STORE_DETAILS':
                return selectedStore ? (
                    <StoreDetailsView
                        store={selectedStore}
                        onSelectProduct={(p) => { setSelectedProduct(p); setPreviousView('STORE_DETAILS'); setView('PRODUCT_DETAILS'); }}
                        addToCart={addToCart}
                        onBack={() => setView('HOME')}
                    />
                ) : null;
            case 'PRODUCT_DETAILS':
                return selectedProduct ? (
                    <ProductDetailsView
                        product={selectedProduct}
                        addToCart={addToCart}
                        onBack={() => setView(previousView)}
                    />
                ) : null;
            case 'CART':
                return (
                    <CartView
                        cart={cart}
                        updateCartQuantity={updateCartQty}
                        removeFromCart={removeFromCart}
                        onCheckout={() => setView('CHECKOUT')}
                        onBack={() => setView('HOME')}
                    />
                );
            case 'CHECKOUT':
                return telegramUser ? (
                    <CheckoutView
                        cart={cart}
                        locations={locations}
                        onSuccess={() => { clearCart(); setView('ORDER_SUCCESS'); }}
                        onBack={() => setView('CART')}
                        clearCart={clearCart}
                        submitOrder={submitOrder}
                    />
                ) : null;
            case 'ORDER_SUCCESS':
                return (
                    <OrderSuccessView
                        onGoHome={() => setView('HOME')}
                        onViewOrders={() => setView('ORDERS')}
                    />
                );
            case 'ORDERS':
                return (
                    <OrdersView onBack={() => setView('HOME')} />
                );
            case 'PROFILE':
                return telegramUser ? <ProfileView telegramUser={telegramUser} /> : null;
            default:
                return (
                    <HomeView
                        stores={stores}
                        isLoading={isLoadingStores}
                        error={storesError}
                        onRetry={fetchStores}
                        onSelectStore={(s) => { setSelectedStore(s); setView('STORE_DETAILS'); }}
                        onOpenSearch={() => setView('SEARCH')}
                    />
                );
        }
    };

    return (
        <div className="max-w-lg mx-auto bg-surface min-h-screen relative font-sans text-gray-900 overflow-x-hidden">
            {renderContent()}
            {view !== 'CHECKOUT' && view !== 'ORDER_SUCCESS' && (
                <TabBar
                    currentView={view}
                    setView={setView}
                    cartItemCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
                />
            )}
        </div>
    );
}
