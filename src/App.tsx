/**
 * App.tsx — Yangilangan
 *
 * Tuzatishlar:
 * 1. profileRes.seller → profileRes.store, profileRes.user
 * 2. window.confirm() → Modal component
 * 3. Cart conflict → Modal bilan
 * 4. authApi.telegramAuth() → JWT olib keyin seller check
 */

import React, { useState, useEffect } from 'react';
import { ViewState } from '@/types';
import { useStores, useCart, useLocations } from '@/hooks/useBuyerData';
import {
  sellerApi, buyerApi,
  ApiStore, ApiProduct, ApiProductVariant, ApiOrder,
  ApiError, AuthError, ForbiddenError, RateLimitError, ConflictError,
  authApi, setTokens,
} from '@/services/api';
import { getTelegramUser, TelegramUser, getInitData } from '@/services/telegram';

import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import AuthErrorScreen from '@/components/ui/AuthErrorScreen';
import RateLimitScreen from '@/components/ui/RateLimitScreen';
import Modal from '@/components/ui/Modal';
import AddressConfirmModal from '@/components/buyer/AddressConfirmModal';
import TabBar from '@/components/buyer/TabBar';

import HomeView from '@/pages/buyer/Home';
import SearchView from '@/pages/buyer/Search';
import StoreDetailsView from '@/pages/buyer/StoreDetails';
import ProductDetailsView from '@/pages/buyer/ProductDetails';
import CartView from '@/pages/buyer/Cart';
import CheckoutView from '@/pages/buyer/Checkout';
import OrderSuccessView from '@/pages/buyer/OrderSuccess';
import ProfileView from '@/pages/buyer/Profile';
import OrdersView from '@/pages/buyer/Orders';
import SellerDashboard from '@/pages/seller/SellerDashboard';

type AppMode = 'loading' | 'customer' | 'seller' | 'auth_error' | 'rate_limited' | 'error';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('loading');
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [sellerStoreId, setSellerStoreId] = useState<number>(0);
  const [sellerStoreName, setSellerStoreName] = useState<string>('');
  const [sellerStoreStatus, setSellerStoreStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [sellerStoreInn, setSellerStoreInn] = useState<string>('');
  const [bootError, setBootError] = useState<string | null>(null);
  const [rateLimitRetry, setRateLimitRetry] = useState<number>(30);
  const [view, setView] = useState<ViewState>('HOME');
  const [showAddressConfirm, setShowAddressConfirm] = useState(false);

  // Hooks
  const { stores, isLoading: isLoadingStores, error: storesError, refetch: fetchStores } = useStores();
  const { items: cart, cartStore, total: cartTotal, conflict: cartConflict, addItem, clearAndAdd, dismissConflict, updateQuantity: updateCartQty, removeItem: removeFromCart, clearCart, submitOrder } = useCart();
  const { locations } = useLocations();

  // Navigation state
  const [selectedStore, setSelectedStore] = useState<ApiStore | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>('HOME');

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    const tgUser = getTelegramUser();
    setTelegramUser(tgUser || {
      telegram_id: 123456789, first_name: 'Dev', last_name: 'User',
    });

    // Dev mode
    if (!tgUser) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'seller') {
        try {
          const profileRes = await sellerApi.getProfile();
          if (profileRes.is_seller && profileRes.store) {
            setSellerStoreId(profileRes.store.id);
            setSellerStoreName(profileRes.store.name);
            setSellerStoreStatus(profileRes.store.status || 'pending');
            setSellerStoreInn(profileRes.store.inn || '');
          } else {
            setSellerStoreId(1);
            setSellerStoreName("Dev Do'kon");
          }
        } catch {
          setSellerStoreId(1);
          setSellerStoreName("Dev Do'kon");
        }
        setAppMode('seller');
      } else {
        setAppMode('customer');
      }
      return;
    }

    // Telegram muhit — avval JWT olamiz
    try {
      const initData = getInitData();
      if (initData) {
        try {
          const authResult = await authApi.telegramAuth();
          if (authResult.access) setTokens(authResult.access, authResult.refresh);
        } catch {}
      }

      // Seller tekshirish
      const profileRes = await sellerApi.getProfile();

      // ✅ Yangi format: profileRes.store (eski: profileRes.seller.store)
      if (profileRes.is_seller && profileRes.store) {
        setSellerStoreId(profileRes.store.id);
        setSellerStoreName(profileRes.store.name);
        setSellerStoreStatus(profileRes.store.status || 'pending');
        setSellerStoreInn(profileRes.store.inn || '');
        setAppMode('seller');
      } else {
        setAppMode('customer');
        buyerApi.hasActiveOrder().then(hasOrder => {
          if (!hasOrder) setShowAddressConfirm(true);
        });
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setAppMode('auth_error');
      } else if (err instanceof ForbiddenError) {
        // Seller emas → customer
        setAppMode('customer');
        buyerApi.hasActiveOrder().then(hasOrder => {
          if (!hasOrder) setShowAddressConfirm(true);
        });
      } else if (err instanceof RateLimitError) {
        setRateLimitRetry(err.retryAfter);
        setAppMode('rate_limited');
      } else {
        setBootError("Tarmoq xatoligi. Qayta urinib ko'ring.");
        setAppMode('error');
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────

  if (appMode === 'loading') {
    return (
      <div className="max-w-lg mx-auto bg-surface min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (appMode === 'auth_error') return <AuthErrorScreen />;
  if (appMode === 'rate_limited') return <RateLimitScreen retryAfter={rateLimitRetry} />;

  if (appMode === 'error') {
    return (
      <div className="max-w-lg mx-auto bg-surface min-h-screen flex items-center justify-center p-6">
        <ErrorMessage message={bootError || "Serverga ulanib bo'lmadi"} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (appMode === 'seller') {
    return (
      <div className="max-w-lg mx-auto bg-surface min-h-screen relative overflow-x-hidden">
        <SellerDashboard
          storeId={sellerStoreId}
          storeName={sellerStoreName}
          storeStatus={sellerStoreStatus}
          storeInn={sellerStoreInn}
        />
      </div>
    );
  }

  // ─── Customer mode ───────────────────────────────────────

  const renderContent = () => {
    switch (view) {
      case 'HOME':
        return (
          <HomeView
            stores={stores}
            isLoading={isLoadingStores}
            error={storesError}
            onRetry={fetchStores}
            onSelectStore={s => { setSelectedStore(s); setPreviousView('HOME'); setView('STORE_DETAILS'); }}
            onOpenSearch={() => { setPreviousView('HOME'); setView('SEARCH'); }}
          />
        );
      case 'SEARCH':
        return (
          <SearchView
            onSelectProduct={p => { setSelectedProduct(p); setPreviousView('SEARCH'); setView('PRODUCT_DETAILS'); }}
            onSelectStore={s => { setSelectedStore(s); setPreviousView('SEARCH'); setView('STORE_DETAILS'); }}
            addToCart={addItem}
            onBack={() => setView('HOME')}
          />
        );
      case 'STORE_DETAILS':
        return selectedStore ? (
          <StoreDetailsView
            store={selectedStore}
            onSelectProduct={p => { setSelectedProduct(p); setPreviousView('STORE_DETAILS'); setView('PRODUCT_DETAILS'); }}
            addToCart={addItem}
            onBack={() => setView('HOME')}
          />
        ) : null;
      case 'PRODUCT_DETAILS':
        return selectedProduct ? (
          <ProductDetailsView
            product={selectedProduct}
            addToCart={addItem}
            onSelectProduct={setSelectedProduct}
            onBack={() => setView(previousView)}
          />
        ) : null;
      case 'CART':
        return (
          <CartView
            cart={cart}
            cartTotal={cartTotal}
            updateCartQuantity={updateCartQty}
            removeFromCart={removeFromCart}
            onCheckout={() => setView('CHECKOUT')}
            onBack={() => setView('HOME')}
          />
        );
      case 'CHECKOUT':
        return (
          <CheckoutView
            cart={cart}
            locations={locations}
            onSuccess={() => { setView('ORDER_SUCCESS'); }}
            onBack={() => setView('CART')}
            submitOrder={submitOrder}
          />
        );
      case 'ORDER_SUCCESS':
        return (
          <OrderSuccessView
            onGoHome={() => setView('HOME')}
            onViewOrders={() => setView('ORDERS')}
          />
        );
      case 'ORDERS':
        return <OrdersView onBack={() => setView('HOME')} />;
      case 'PROFILE':
        return telegramUser ? <ProfileView telegramUser={telegramUser} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-surface min-h-screen relative overflow-x-hidden">
      {renderContent()}

      {view !== 'CHECKOUT' && view !== 'ORDER_SUCCESS' && (
        <TabBar
          currentView={view}
          setView={setView}
          cartItemCount={cart.length}
        />
      )}

      {/* Address confirm modal */}
      {appMode === 'customer' && (
        <AddressConfirmModal
          isOpen={showAddressConfirm}
          onClose={() => setShowAddressConfirm(false)}
          onSelectCurrent={() => setShowAddressConfirm(false)}
        />
      )}

      {/* Cart conflict modal — window.confirm() o'rniga */}
      {cartConflict && (
        <Modal
          isOpen={!!cartConflict}
          onClose={dismissConflict}
          title="Savatcha tozalanadi"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Savatchada <strong>"{cartConflict.existingStoreName}"</strong> do'konidan
              mahsulotlar bor. Yangi mahsulot{' '}
              <strong>"{cartConflict.newStoreName}"</strong> do'konidan.
            </p>
            <p className="text-sm text-gray-600">
              Bir vaqtda faqat bitta do'kondan buyurtma berish mumkin.
              Avvalgi savatchani tozalab, yangi mahsulot qo'shilsinmi?
            </p>
            <div className="flex gap-3">
              <button
                onClick={dismissConflict}
                className="flex-1 py-3 rounded-card border border-subtle font-bold text-muted min-h-[48px]"
              >
                Bekor qilish
              </button>
              <button
                onClick={clearAndAdd}
                className="flex-1 py-3 rounded-card bg-brand text-white font-bold min-h-[48px]"
              >
                Ha, tozala
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
