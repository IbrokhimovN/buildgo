import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewState } from './types';
import SellerDashboard from './SellerDashboard';
import { useStores, useCart, useOrderHistory, useLocations } from './hooks/useBuyerData';
import {
  buyerApi,
  ApiStore,
  ApiProduct,
  ApiCategory,
  ApiOrder,
  ApiLocation,
  ApiError,
} from './services/api';


function getInitialView(): ViewState {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  if (mode === 'seller') {
    return 'SELLER';
  }

  return 'HOME';
}

// --- Types ---
interface CartItem {
  product: ApiProduct;
  quantity: number;
}

// --- Sub-components ---

const Icon = ({ name, className = "", filled = false }: { name: string, className?: string, filled?: boolean }) => (
  <span className={`material-symbols-outlined ${filled ? 'material-symbols-filled' : ''} ${className}`}>
    {name}
  </span>
);

const LoadingSpinner = ({ message = "Yuklanmoqda..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <Icon name="error" className="text-4xl text-red-500 mb-4" />
    <p className="text-gray-700 dark:text-gray-300 text-center mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-primary text-white px-6 py-3 rounded-xl font-bold"
      >
        Qayta urinish
      </button>
    )}
  </div>
);

// --- Tab Bar ---

const TabBar = ({
  currentView,
  setView,
  cartItemCount,
}: {
  currentView: ViewState;
  setView: (v: ViewState) => void;
  cartItemCount: number;
}) => {
  const tabs = [
    { id: 'HOME', icon: 'home', label: 'Bosh sahifa' },
    { id: 'SEARCH', icon: 'search', label: 'Qidirish' },
    { id: 'CART', icon: 'shopping_bag', label: 'Savat' },
    { id: 'PROFILE', icon: 'person', label: 'Profil' },
  ] as const;

  return (
    <nav
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2
        w-[96%] max-w-2xl
        bg-white/95 dark:bg-background-dark/95
        backdrop-blur-lg
        border border-gray-100 dark:border-gray-800
        rounded-xl
        px-4 pt-2 pb-3
        z-[100]
      "
    >
      <div className="flex justify-between items-center">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as ViewState)}
              aria-label={tab.label}
              className={`
                flex flex-col items-center gap-1
                flex-1
                transition-all duration-150
                active:scale-95
                relative
                ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}
              `}
            >
              <div className="relative">
                <Icon name={tab.icon} filled={isActive} />
                {tab.id === 'CART' && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] size-4 rounded-full flex items-center justify-center font-bold">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </div>

              <span className="text-[10px] font-medium leading-none">
                {tab.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// --- Pages ---

const HomeView = ({
  stores,
  isLoading,
  error,
  onRetry,
  onSelectStore,
  onOpenSearch,
}: {
  stores: ApiStore[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectStore: (s: ApiStore) => void;
  onOpenSearch: () => void;
}) => (
  <div className="pb-32">
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-white/10 p-4 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Icon name="location_on" className="text-primary" />
        <span className="text-sm font-semibold">Toshkent</span>
      </div>
      <h1 className="text-lg font-bold tracking-tight">BuildGo</h1>
      <button onClick={onOpenSearch} className="p-2"><Icon name="search" /></button>
    </header>

    <div className="px-4 pt-6 pb-2">
      <h2 className="text-2xl font-bold leading-tight">Qurilish do'konlari</h2>
      <p className="text-gray-500 text-sm mt-1">Toshkentdagi eng yaxshi do'konlar</p>
    </div>

    {isLoading && <LoadingSpinner message="Do'konlar yuklanmoqda..." />}

    {error && <ErrorMessage message={error} onRetry={onRetry} />}

    {!isLoading && !error && stores.length === 0 && (
      <div className="text-center py-20">
        <Icon name="store" className="text-4xl text-gray-300 mb-4" />
        <p className="text-gray-500">Do'konlar topilmadi</p>
      </div>
    )}

    {!isLoading && !error && (
      <div className="space-y-4 px-4 mt-4">
        {stores.map(store => (
          <div
            key={store.id}
            onClick={() => onSelectStore(store)}
            className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer active:scale-[0.98] transition-all"
          >
            <div
              className="w-full h-48 bg-cover bg-center bg-gray-200"
              style={{ backgroundImage: store.image ? `url(${store.image})` : undefined }}
            >
              {!store.image && (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="storefront" className="text-4xl text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <p className="text-lg font-bold">{store.name}</p>
                {store.is_active && (
                  <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded">Ochiq</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  <Icon name="star" className="text-yellow-500 text-sm" filled />
                  <span className="text-xs font-bold">4.8 (120)</span>
                </div>
                <button className="bg-primary text-black text-sm font-bold px-4 py-2 rounded-lg">Kirish</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const SearchView = ({
  onSelectProduct,
  addToCart,
  onBack,
}: {
  onSelectProduct: (p: ApiProduct) => void;
  addToCart: (p: ApiProduct, q: number) => void;
  onBack: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const response = await buyerApi.searchProducts(searchQuery);
      setResults(response.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Qidiruvda xatolik");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-background-dark pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-4">
          <button onClick={onBack} className="p-1 -ml-1">
            <Icon name="chevron_left" className="text-3xl font-bold" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg">Qidiruv</h1>
          <div className="w-8" />
        </div>

        {/* Search Input */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
            <Icon name="search" className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mahsulot qidirish..."
              autoFocus
              className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium h-6"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <Icon name="cancel" className="text-gray-400" filled />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4">
        {isSearching && <LoadingSpinner message="Qidirilmoqda..." />}

        {error && <ErrorMessage message={error} />}

        {!isSearching && !error && query && results.length === 0 && (
          <div className="text-center py-20">
            <Icon name="search_off" className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">"{query}" bo'yicha hech narsa topilmadi</p>
          </div>
        )}

        {!isSearching && !error && results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Natijalar ({results.length})</h2>
            {results.map(product => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 flex items-center gap-4"
              >
                <div
                  onClick={() => onSelectProduct(product)}
                  className="size-20 rounded-xl bg-cover bg-center shrink-0 bg-gray-200"
                  style={{ backgroundImage: product.image ? `url(${product.image})` : undefined }}
                />
                <div className="flex-1" onClick={() => onSelectProduct(product)}>
                  <p className="font-bold text-sm">{product.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{product.store_name}</p>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="font-bold text-base">{parseFloat(product.price).toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 font-medium">so'm / {product.unit}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                  className="size-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all"
                >
                  <Icon name="add_shopping_cart" className="text-xl" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!query && (
          <div className="text-center py-20">
            <Icon name="search" className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">Mahsulot qidirish uchun yozing</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StoreDetailsView = ({
  store,
  onSelectProduct,
  addToCart,
  onBack,
}: {
  store: ApiStore;
  onSelectProduct: (p: ApiProduct) => void;
  addToCart: (p: ApiProduct, q: number) => void;
  onBack: () => void;
}) => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<number | null>(null);

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

  useEffect(() => {
    fetchData();
  }, [store.id]);

  const filteredProducts = activeCat
    ? products.filter(p => p.category === activeCat)
    : products;

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
        <button onClick={onBack}><Icon name="arrow_back_ios" /></button>
        <h2 className="text-lg font-bold">{store.name}</h2>
        <div className="w-8" />
      </header>

      {/* Categories */}
      <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar bg-white dark:bg-background-dark border-b border-gray-50 dark:border-gray-900">
        <button
          onClick={() => setActiveCat(null)}
          className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-colors ${activeCat === null ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}
        >
          <span className="text-sm font-semibold">Barchasi</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-colors ${activeCat === cat.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}
          >
            <span className="text-sm font-semibold">{cat.name}</span>
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner message="Mahsulotlar yuklanmoqda..." />}

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <Icon name="inventory_2" className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500">Mahsulotlar topilmadi</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 p-3 flex flex-col cursor-pointer active:scale-95 transition-all"
            >
              <div
                onClick={() => onSelectProduct(product)}
                className="aspect-square bg-cover bg-center rounded-lg mb-2 bg-gray-200"
                style={{ backgroundImage: product.image ? `url(${product.image})` : undefined }}
              />
              <p onClick={() => onSelectProduct(product)} className="text-sm font-bold line-clamp-2 h-10">{product.name}</p>
              <p className="text-primary text-base font-black mt-1">{parseFloat(product.price).toLocaleString()} so'm</p>
              <button
                onClick={() => addToCart(product, 1)}
                className="mt-3 w-full bg-primary text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <Icon name="shopping_cart" className="text-lg" /> Savatga
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductDetailsView = ({
  product,
  addToCart,
  onBack,
}: {
  product: ApiProduct;
  addToCart: (p: ApiProduct, q: number) => void;
  onBack: () => void;
}) => {
  const [qty, setQty] = useState(1);
  const price = parseFloat(product.price);

  return (
    <div className="pb-40">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
        <button onClick={onBack}><Icon name="arrow_back_ios" /></button>
        <h2 className="text-lg font-bold">Mahsulot Tafsilotlari</h2>
        <button><Icon name="share" /></button>
      </header>

      <div className="p-4">
        <div
          className="w-full h-80 bg-cover bg-center rounded-xl shadow-sm relative bg-gray-200"
          style={{ backgroundImage: product.image ? `url(${product.image})` : undefined }}
        >
          {!product.image && (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="image" className="text-6xl text-gray-400" />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-start gap-4">
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
          <button className="bg-primary/10 p-2 rounded-lg"><Icon name="bookmark" className="text-primary" filled /></button>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold">{price.toLocaleString()} so'm</span>
          <span className="text-gray-500 text-sm font-medium">{product.unit} uchun</span>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">Ma'lumotlar</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 text-xs uppercase font-semibold">Kategoriya</p>
              <p className="font-bold mt-1">{product.category_name}</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 text-xs uppercase font-semibold">Do'kon</p>
              <p className="font-bold mt-1">{product.store_name}</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 text-xs uppercase font-semibold">O'lchov</p>
              <p className="font-bold mt-1">{product.unit}</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 text-xs uppercase font-semibold">Mavjud</p>
              <p className="font-bold mt-1">{product.is_available ? 'Ha' : 'Yo\'q'}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <p className="font-medium">Miqdorni tanlang</p>
          <div className="flex items-center gap-4 bg-white dark:bg-gray-700 p-1 rounded-full border border-gray-100 dark:border-gray-600">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="size-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-600"><Icon name="remove" /></button>
            <span className="text-lg font-bold w-12 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="size-10 flex items-center justify-center rounded-full bg-primary text-white"><Icon name="add" /></button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="bg-white/90 dark:bg-background-dark/90 backdrop-blur-lg border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <button className="size-14 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
            <Icon name="chat_bubble" className="text-gray-700 dark:text-white" />
          </button>
          <button
            onClick={() => addToCart(product, qty)}
            className="flex-1 bg-primary text-white h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Icon name="shopping_cart" /> Savatga qo'shish
          </button>
        </div>
      </div>
    </div>
  );
};

const CartView = ({
  cartItems,
  updateQty,
  removeItem,
  clearCart,
  onCheckout,
}: {
  cartItems: CartItem[];
  updateQty: (id: number, q: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  onCheckout: () => void;
}) => {
  const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.product.price) * item.quantity), 0);

  return (
    <div className="pb-48">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold flex-1 text-center">Savat</h2>
        {cartItems.length > 0 && (
          <button onClick={clearCart} className="text-red-500 text-sm font-semibold">Tozalash</button>
        )}
      </header>

      {cartItems.length === 0 ? (
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <Icon name="shopping_cart" className="text-6xl text-gray-200" />
          <p className="text-gray-400">Savatingiz bo'sh</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {cartItems.map(item => (
            <div key={item.product.id} className="bg-white dark:bg-gray-900 px-4 py-4 flex gap-4 border-b border-gray-100 dark:border-gray-800">
              <div
                className="size-20 rounded-lg bg-cover bg-center border border-gray-100 dark:border-gray-800 bg-gray-200"
                style={{ backgroundImage: item.product.image ? `url(${item.product.image})` : undefined }}
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-semibold line-clamp-1">{item.product.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{parseFloat(item.product.price).toLocaleString()} so'm / {item.product.unit}</p>
                </div>
                <p className="text-primary font-bold">{(parseFloat(item.product.price) * item.quantity).toLocaleString()} so'm</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.product.id)}><Icon name="close" className="text-gray-400 text-xl" /></button>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-full p-1 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <button onClick={() => updateQty(item.product.id, Math.max(1, item.quantity - 1))} className="size-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-sm"><Icon name="remove" className="text-xs" /></button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="size-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-sm"><Icon name="add" className="text-xs" /></button>
                </div>
              </div>
            </div>
          ))}

          <div className="p-6 mt-4">
            <h3 className="text-base font-bold mb-4">Buyurtma tafsilotlari</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-500">Mahsulotlar narxi</p>
                <p className="font-medium">{subtotal.toLocaleString()} so'm</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-500">Yetkazib berish</p>
                <p className="font-medium text-gray-400 italic">Do'kon tomonidan hisoblanadi</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-300 dark:border-gray-700">
                <p className="font-bold">Mahsulotlar jami</p>
                <p className="text-lg font-bold">{subtotal.toLocaleString()} so'm</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 p-4 shadow-xl z-50">
          <div className="flex justify-between items-center mb-4 px-1">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Mahsulotlar jami</p>
              <p className="text-xl font-extrabold">{subtotal.toLocaleString()} so'm</p>
            </div>
            <p className="text-xs text-gray-500">{cartItems.length} xil mahsulot</p>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            Buyurtma berish
          </button>
        </div>
      )}
    </div>
  );
};

const CheckoutView = ({
  cartItems,
  onConfirm,
  onBack,
}: {
  cartItems: CartItem[];
  onConfirm: (data: { firstName: string; lastName: string; phone: string; address: string; locationId?: number }) => Promise<void>;
  onBack: () => void;
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locations, isLoading: isLoadingLocations } = useLocations();

  // Pre-fill from Telegram if available
  useEffect(() => {
    // @ts-ignore
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) {
      if (tgUser.first_name && !firstName) setFirstName(tgUser.first_name);
      if (tgUser.last_name && !lastName) setLastName(tgUser.last_name);
    }
  }, []);

  // Auto-select default location
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId && !useManualAddress) {
      const defaultLoc = locations.find(l => l.is_default);
      setSelectedLocationId(defaultLoc?.id || locations[0].id);
    }
  }, [locations]);

  const hasLocation = selectedLocationId || (useManualAddress && address);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !phone || !hasLocation) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm({
        firstName,
        lastName,
        phone,
        address: useManualAddress ? address : (locations.find(l => l.id === selectedLocationId)?.address || address),
        locationId: selectedLocationId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Buyurtma yuborishda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-[#111813] flex flex-col overflow-y-auto no-scrollbar pb-10">
      <header className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10">
        <button onClick={onBack}><Icon name="close" /></button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">Buyurtmani rasmiylashtirish</h2>
      </header>

      <div className="flex-1 px-6 pt-10">
        <h2 className="text-3xl font-bold text-center leading-tight">Ma'lumotlaringizni kiriting</h2>
        <p className="text-gray-500 text-center mt-3 max-w-[300px] mx-auto">
          Buyurtmani tasdiqlash uchun ismingiz va aloqa ma'lumotlaringizni kiriting.
        </p>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="mt-10 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 ml-1">Ism</label>
            <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-16 bg-gray-50 dark:bg-gray-800/50">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ismingizni kiriting"
                className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-medium px-4"
              />
              <Icon name="person" className="pr-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 ml-1">Familiya</label>
            <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-16 bg-gray-50 dark:bg-gray-800/50">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Familiyangizni kiriting"
                className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-medium px-4"
              />
              <Icon name="badge" className="pr-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 ml-1">Telefon raqami</label>
            <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-16 bg-gray-50 dark:bg-gray-800/50">
              <div className="px-4 font-bold text-lg border-r border-gray-200 dark:border-gray-700">+998</div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(_ _) _ _ _ - _ _ - _ _"
                className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-medium px-4"
              />
              <Icon name="call" className="pr-4 text-gray-400" />
            </div>
          </div>

          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 ml-1">Manzil (Lokatsiya)</label>

            {/* Saved locations */}
            {!useManualAddress && locations.length > 0 && (
              <div className="space-y-2 mb-3">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selectedLocationId === loc.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                  >
                    <Icon name="location_on" className={selectedLocationId === loc.id ? 'text-primary' : 'text-gray-400'} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{loc.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{loc.address}</p>
                    </div>
                    {loc.is_default && (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">Asosiy</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {isLoadingLocations && (
              <div className="text-center py-4">
                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}

            {/* Toggle to manual address */}
            {!useManualAddress && (
              <button
                onClick={() => { setUseManualAddress(true); setSelectedLocationId(null); }}
                className="w-full p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 flex items-center justify-center gap-2"
              >
                <Icon name="add_location" className="text-base" />
                Yangi manzil kiritish
              </button>
            )}

            {/* Manual address input */}
            {useManualAddress && (
              <div>
                <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-16 bg-gray-50 dark:bg-gray-800/50">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Yetkazib berish manzilini kiriting"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-medium px-4"
                  />
                  <Icon name="location_on" className="pr-4 text-gray-400" />
                </div>
                {locations.length > 0 && (
                  <button
                    onClick={() => { setUseManualAddress(false); setSelectedLocationId(locations[0].id); }}
                    className="mt-2 text-sm text-primary font-medium"
                  >
                    ← Saqlangan manzillardan tanlash
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <Icon name="verified_user" className="text-primary" />
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            Kiritilgan barcha ma'lumotlar buyurtma tafsilotlari bilan birga do'kon egalariga yuboriladi. Do'kon xodimi tez orada siz bilan bog'lanadi.
          </p>
        </div>
      </div>

      <div className="p-6 mt-6">
        <button
          onClick={handleSubmit}
          disabled={!firstName || !lastName || !phone || !hasLocation || isSubmitting}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Yuborilmoqda...
            </>
          ) : (
            'Buyurtmani yakunlash'
          )}
        </button>
        <p className="text-center text-[11px] text-gray-400 mt-4">
          "Buyurtmani yakunlash" tugmasini bosish orqali siz bizning <span className="underline">Foydalanish shartlarimizga</span> rozilik bildirasiz.
        </p>
      </div>
    </div>
  );
};

const OrderSuccessView = ({ order, onContinue }: { order: ApiOrder; onContinue: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
    <div className="size-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
      <Icon name="check_circle" className="text-5xl text-green-500" />
    </div>
    <h1 className="text-2xl font-bold mb-2">Buyurtma qabul qilindi!</h1>
    <p className="text-gray-500 mb-6">
      Buyurtma raqami: #{order.id}<br />
      Do'kon xodimi tez orada siz bilan bog'lanadi.
    </p>
    <button
      onClick={onContinue}
      className="bg-primary text-white px-8 py-4 rounded-xl font-bold"
    >
      Bosh sahifaga qaytish
    </button>
  </div>
);

// --- Order History View ---
const OrdersHistoryView = ({ onBack }: { onBack: () => void }) => {
  const { orders, isLoading, error, refetch } = useOrderHistory();

  const statusColors: Record<string, string> = {
    new: 'text-yellow-600 bg-yellow-50',
    done: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
  };
  const statusLabels: Record<string, string> = {
    new: 'Kutilmoqda',
    done: 'Yetkazildi',
    cancelled: 'Bekor qilindi',
  };

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
        <button onClick={onBack}><Icon name="arrow_back_ios" /></button>
        <h2 className="text-lg font-bold">Buyurtmalar tarixi</h2>
        <div className="w-8" />
      </header>

      {isLoading && <LoadingSpinner message="Buyurtmalar yuklanmoqda..." />}

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!isLoading && !error && orders.length === 0 && (
        <div className="text-center py-20">
          <Icon name="receipt_long" className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500">Hali buyurtmalar yo'q</p>
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <div className="px-4 mt-4 space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold">Buyurtma #{order.id}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{order.store_name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${statusColors[order.status] || ''}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className="space-y-1">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{item.product_name} × {item.quantity}</span>
                    <span className="font-medium">{(parseFloat(item.price_at_order) * item.quantity).toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                </span>
                <span className="font-bold text-primary">
                  {order.items.reduce((s, i) => s + parseFloat(i.price_at_order) * i.quantity, 0).toLocaleString()} so'm
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Profile View ---
const ProfileView = ({ onViewOrders }: { onViewOrders: () => void }) => {
  // @ts-ignore
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4">
        <h2 className="text-lg font-bold text-center">Profil</h2>
      </header>

      <div className="px-4 mt-6">
        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 flex items-center gap-4 mb-6">
          <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="person" className="text-3xl text-primary" />
          </div>
          <div>
            <p className="font-bold text-lg">
              {tgUser ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() : 'Foydalanuvchi'}
            </p>
            <p className="text-gray-500 text-sm">
              {tgUser?.username ? `@${tgUser.username}` : 'Telegram orqali'}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          <button
            onClick={onViewOrders}
            className="w-full p-4 flex items-center gap-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon name="receipt_long" className="text-primary" />
            </div>
            <span className="flex-1 text-left font-medium">Buyurtmalar tarixi</span>
            <Icon name="chevron_right" className="text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center gap-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
            <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Icon name="location_on" className="text-blue-500" />
            </div>
            <span className="flex-1 text-left font-medium">Saqlangan manzillar</span>
            <Icon name="chevron_right" className="text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center gap-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
            <div className="size-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Icon name="help" className="text-purple-500" />
            </div>
            <span className="flex-1 text-left font-medium">Yordam</span>
            <Icon name="chevron_right" className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  
  const [view, setView] = useState<ViewState>(() => getInitialView());


  // Data from hooks
  const { stores, isLoading: isLoadingStores, error: storesError, refetch: fetchStores } = useStores();
  const {
    items: cart,
    addItem,
    updateQuantity: updateCartQty,
    removeItem: removeFromCart,
    clearCart,
    submitOrder,
    isSubmitting: isOrderSubmitting,
    error: cartError,
  } = useCart();

  // Navigation states
  const [selectedStore, setSelectedStore] = useState<ApiStore | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [lastOrder, setLastOrder] = useState<ApiOrder | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>('HOME');

  // Wrapper around addItem that handles multi-store conflicts with a confirm dialog
  const addToCart = (product: ApiProduct, quantity: number) => {
    const result = addItem(product, quantity);
    if (result === 'conflict') {
      const storeName = cart[0]?.product.store_name || 'boshqa do\'kon';
      if (window.confirm(
        `Savatingizda "${storeName}" do'konidan mahsulotlar bor. Savatni tozalab, yangi mahsulot qo'shilsinmi?`
      )) {
        clearCart();
        addItem(product, quantity);
      }
    }
  };

  // Listen for URL changes (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Order submission — throws on failure so CheckoutView can display errors
  const handleCheckout = async (data: { firstName: string; lastName: string; phone: string; address: string; locationId?: number }) => {
    let locationId = data.locationId;

    // If no saved location selected, create one
    if (!locationId && data.address) {
      try {
        const location = await buyerApi.createLocation({
          name: `${data.firstName} ${data.lastName}`,
          address: data.address,
          is_default: true,
        });
        locationId = location.id;
      } catch {
        // Location creation might fail, continue without it
      }
    }

    const order = await submitOrder(locationId, {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });
    setLastOrder(order);
    setView('ORDER_SUCCESS');
  };



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
            cartItems={cart}
            updateQty={updateCartQty}
            removeItem={removeFromCart}
            clearCart={clearCart}
            onCheckout={() => setView('CHECKOUT')}
          />
        );
      case 'ORDER_SUCCESS':
        return lastOrder ? (
          <OrderSuccessView
            order={lastOrder}
            onContinue={() => { setLastOrder(null); setView('HOME'); }}
          />
        ) : null;
      case 'ORDERS':
        return (
          <OrdersHistoryView onBack={() => setView('HOME')} />
        );
      case 'SELLER':
        return (
          <SellerDashboard
            onBack={() => {
              window.history.pushState({}, '', '/');
              setView('HOME');
            }}
          />
        );
      case 'CHECKOUT':
        return (
          <CheckoutView
            cartItems={cart}
            onConfirm={handleCheckout}
            onBack={() => setView('CART')}
          />
        );
      case 'PROFILE':
        return (
          <ProfileView
            onViewOrders={() => setView('ORDERS')}
          />
        );
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
    <div className="max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen relative font-sans text-gray-900 dark:text-white overflow-x-hidden">
      {renderContent()}



      {view !== 'CHECKOUT' && view !== 'SELLER' && view !== 'ORDER_SUCCESS' && (
        <TabBar
          currentView={view === 'ORDERS' ? 'PROFILE' as ViewState : view}
          setView={setView}
          cartItemCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        />
      )}
    </div>
  );
}
