import React, { useState } from 'react';
import { SellerTabState } from './types';
import {
    useSellerData,
    UIOrderStatus,
    SellerOrderUI,
    SellerProductUI,
    VALID_UNITS,
} from './hooks/useSellerData';
import { ApiCategory } from './services/api';

// --- Icon Component ---
const Icon = ({ name, className = "", filled = false }: { name: string, className?: string, filled?: boolean }) => (
    <span className={`material-symbols-outlined ${filled ? 'material-symbols-filled' : ''} ${className}`}>
        {name}
    </span>
);

// --- Status Badge Component ---
const StatusBadge = ({ status, onClick }: { status: UIOrderStatus, onClick?: () => void }) => {
    const colors = {
        'KUTILMOQDA': 'text-yellow-600 bg-yellow-50',
        'YETKAZILDI': 'text-green-600 bg-green-50',
        'BEKOR_QILINDI': 'text-red-600 bg-red-50',
    };
    return (
        <span onClick={onClick} className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${colors[status]}`}>
            {status}
        </span>
    );
};

// --- Toast/Error Message Component ---
const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
    <div className="fixed top-4 left-4 right-4 z-[300] bg-red-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-down">
        <Icon name="error" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={onClose} className="p-1">
            <Icon name="close" />
        </button>
    </div>
);

// --- Modal Component ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-hidden animate-slide-up">
                <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 -mr-2">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Add/Edit Product Screen ---
const ProductModal = ({
    isOpen,
    onClose,
    product,
    categories,
    onSave,
    onDelete,
}: {
    isOpen: boolean,
    onClose: () => void,
    product: SellerProductUI | null,
    categories: ApiCategory[],
    onSave: (data: { name: string; price: number; unit: string; categoryId: number }) => Promise<void>,
    onDelete?: (productId: number) => Promise<void>,
}) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('dona');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    React.useEffect(() => {
        setSaveError(null);
        if (product) {
            setName(product.name);
            setPrice(product.price.toString());
            setUnit(product.unit);
            setCategoryId(product.categoryId);
        } else {
            setName('');
            setPrice('');
            setUnit('dona');
            setCategoryId(categories[0]?.id || '');
        }
    }, [product, isOpen, categories]);

    const handleSave = async () => {
        if (!name || !price || !categoryId) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave({
                name,
                price: parseFloat(price) || 0,
                unit,
                categoryId: categoryId as number,
            });
            onClose();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Mahsulotni saqlashda xatolik");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!product || !onDelete) return;
        if (!confirm('Bu mahsulotni o\'chirishni xohlaysizmi?')) return;
        setIsDeleting(true);
        setSaveError(null);
        try {
            await onDelete(product.id);
            onClose();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Mahsulotni o'chirishda xatolik");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-1 active:scale-90 transition-transform">
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="text-lg font-bold">
                        {product ? "Mahsulotni tahrirlash" : "Yangi Mahsulot Qo'shish"}
                    </h1>
                </div>
                {product && onDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 text-red-500 active:scale-90 transition-transform"
                    >
                        <Icon name="delete" />
                    </button>
                )}
            </header>

            {/* Content */}
            <div className="px-4 pb-32 overflow-y-auto h-[calc(100vh-60px)]">
                {/* Error display */}
                {saveError && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">
                        {saveError}
                    </div>
                )}

                {/* Product Name */}
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Mahsulot nomi *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masalan: Sement M-500"
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>

                {/* Category Select */}
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Kategoriya *</label>
                    <div className="relative">
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(Number(e.target.value))}
                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white appearance-none pr-12"
                        >
                            <option value="">Kategoriyani tanlang</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Icon name="unfold_more" className="text-primary" />
                        </div>
                    </div>
                </div>

                {/* Price and Unit */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Narxi (so'm) *</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0"
                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">O'lchov *</label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                            {VALID_UNITS.map((u) => (
                                <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSave}
                    disabled={!name || !price || !categoryId || isSaving}
                    className="w-full bg-primary text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
                >
                    {isSaving ? (
                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Icon name="send" className="text-lg" />
                            {product ? 'Saqlash' : "Saqlash va e'lon qilish"}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- Notifications Modal ---
const NotificationsModal = ({ isOpen, onClose, orders }: { isOpen: boolean, onClose: () => void, orders: SellerOrderUI[] }) => {
    // Derive notifications from real orders
    const notifications = orders.slice(0, 5).map(order => {
        const statusText = {
            KUTILMOQDA: 'Yangi buyurtma',
            YETKAZILDI: 'Buyurtma yetkazildi',
            BEKOR_QILINDI: 'Buyurtma bekor qilindi',
        };
        return {
            title: statusText[order.status] || 'Buyurtma',
            desc: `${order.customerName} — ${order.productSummary}`,
            time: new Date(order.createdAt).toLocaleDateString('uz-UZ'),
            unread: order.status === 'KUTILMOQDA',
        };
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bildirishnomalar">
            <div className="space-y-3">
                {notifications.length === 0 ? (
                    <div className="text-center py-8">
                        <Icon name="notifications_off" className="text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500">Bildirishnomalar yo'q</p>
                    </div>
                ) : (
                    notifications.map((notif, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${notif.unread ? 'bg-primary/5 border-primary/20' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-sm">{notif.title}</p>
                                {notif.unread && <span className="size-2 bg-primary rounded-full" />}
                            </div>
                            <p className="text-gray-500 text-xs">{notif.desc}</p>
                            <p className="text-gray-400 text-[10px] mt-2">{notif.time}</p>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};

// --- Order Details Modal ---
const OrderDetailsModal = ({
    isOpen,
    onClose,
    order,
    onUpdateStatus
}: {
    isOpen: boolean,
    onClose: () => void,
    order: SellerOrderUI | null,
    onUpdateStatus: (orderId: number, status: UIOrderStatus) => Promise<boolean>
}) => {
    const [isUpdating, setIsUpdating] = useState(false);

    if (!order) return null;

    const handleStatusChange = async (status: UIOrderStatus) => {
        setIsUpdating(true);
        const success = await onUpdateStatus(order.id, status);
        setIsUpdating(false);
        if (success) {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buyurtma tafsilotlari">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="size-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-600">{order.customerInitials}</span>
                    </div>
                    <div>
                        <p className="font-bold text-lg">{order.customerName}</p>
                        <p className="text-gray-500 text-sm">{order.customerPhone || 'Xaridor'}</p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Buyurtma</p>
                    <p className="font-bold">{order.productSummary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Miqdor</p>
                        <p className="font-bold">{order.quantitySummary}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Summa</p>
                        <p className="font-bold text-primary">{order.totalPrice.toLocaleString()} so'm</p>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Statusni o'zgartirish</p>
                    <div className="flex gap-2">
                        {(['KUTILMOQDA', 'YETKAZILDI', 'BEKOR_QILINDI'] as UIOrderStatus[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                disabled={isUpdating}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${order.status === status
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                                    }`}
                            >
                                {isUpdating ? '...' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {order.customerPhone ? (
                    <a
                        href={`tel:${order.customerPhone}`}
                        className="w-full bg-primary/10 text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        <Icon name="call" />
                        Xaridorga qo'ng'iroq qilish
                    </a>
                ) : (
                    <div className="w-full bg-gray-100 dark:bg-gray-800 text-gray-400 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                        <Icon name="call" />
                        Telefon raqam mavjud emas
                    </div>
                )}
            </div>
        </Modal>
    );
};

// --- Settings Detail Modal ---
const SettingsDetailModal = ({ isOpen, onClose, title }: { isOpen: boolean, onClose: () => void, title: string }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="text-center py-8">
            <div className="size-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="construction" className="text-2xl text-gray-400" />
            </div>
            <p className="text-gray-500">Bu bo'lim tez orada qo'shiladi</p>
        </div>
    </Modal>
);

// --- Seller Tab Bar ---
const SellerTabBar = ({ activeTab, setActiveTab }: { activeTab: SellerTabState, setActiveTab: (t: SellerTabState) => void }) => {
    const tabs = [
        { id: 'DASHBOARD' as SellerTabState, icon: 'dashboard', label: 'Dashboard' },
        { id: 'REPORTS' as SellerTabState, icon: 'bar_chart', label: 'Hisobotlar' },
        { id: 'PRODUCTS' as SellerTabState, icon: 'inventory_2', label: 'Mahsulotlar' },
        { id: 'ORDERS' as SellerTabState, icon: 'shopping_bag', label: 'Buyurtmalar' },
        { id: 'SETTINGS' as SellerTabState, icon: 'settings', label: 'Sozlamalar' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 flex justify-around items-center pt-2 pb-6 px-2 z-[100]">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 flex-1 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <Icon name={tab.icon} filled={activeTab === tab.id} />
                    <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
            ))}
        </nav>
    );
};

// --- Main Seller Dashboard Component ---
export default function SellerDashboard({ onBack }: { onBack: () => void }) {
    const {
        profile,
        orders,
        products,
        categories,
        isLoading,
        error,
        clearError,
        refetch,
        updateOrderStatus,
        createProduct,
        updateProduct,
        deleteProduct,
        newOrdersCount,
        totalRevenue,
    } = useSellerData();

    const [activeTab, setActiveTab] = useState<SellerTabState>('DASHBOARD');

    // Modal states
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<SellerProductUI | null>(null);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SellerOrderUI | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsModalTitle, setSettingsModalTitle] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [orderFilter, setOrderFilter] = useState<'all' | UIOrderStatus>('all');

    const filteredOrders = orderFilter === 'all'
        ? orders
        : orders.filter(o => o.status === orderFilter);

    // Handlers
    const handleSaveProduct = async (data: { name: string; price: number; unit: string; categoryId: number }) => {
        if (editingProduct) {
            await updateProduct(editingProduct.id, data);
        } else {
            await createProduct(data);
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        await deleteProduct(productId);
    };

    const handleOpenSettingsItem = (label: string) => {
        setSettingsModalTitle(label);
        setShowSettingsModal(true);
    };

    const filteredProducts = searchQuery
        ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : products;

    // Loading Screen
    if (isLoading) {
        return (
            <div className="max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Ma'lumotlar yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    // --- Dashboard Tab Content ---
    const DashboardTab = () => (
        <div className="px-4 pb-8">
            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                    className="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                    <Icon name="add_box" className="text-lg" />
                    Mahsulot
                </button>
                <button
                    onClick={() => setActiveTab('REPORTS')}
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <Icon name="bar_chart" className="text-lg" />
                    Hisobotlar
                </button>
            </div>

            {/* Statistics Section */}
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Statistika</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="size-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                        <Icon name="point_of_sale" className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-xs">Jami mahsulotlar</p>
                    <p className="text-2xl font-bold mt-1">{products.length} ta</p>
                </div>
                <div
                    onClick={() => setActiveTab('ORDERS')}
                    className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 cursor-pointer active:scale-95 transition-transform"
                >
                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                        <Icon name="shopping_basket" className="text-primary" />
                    </div>
                    <p className="text-gray-500 text-xs">Yangi buyurtmalar</p>
                    <p className="text-2xl font-bold mt-1">{newOrdersCount} ta</p>
                </div>
            </div>

            {/* Total Revenue Card */}
            <div
                onClick={() => setActiveTab('REPORTS')}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 mb-6 cursor-pointer active:scale-[0.98] transition-transform"
            >
                <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-sm">Jami daromad</p>
                    <span className="text-green-500 text-sm font-bold">Yetkazilgan</span>
                </div>
                <p className="text-3xl font-bold">{totalRevenue.toLocaleString()} so'm</p>
            </div>

            {/* Orders Management Section */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Buyurtmalar Boshqaruvi</h3>
                <button
                    onClick={() => setActiveTab('ORDERS')}
                    className="text-primary text-sm font-bold active:opacity-70"
                >
                    Hammasi
                </button>
            </div>

            <div className="space-y-3">
                {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Icon name="shopping_bag" className="text-4xl mb-2" />
                        <p>Buyurtmalar yo'q</p>
                    </div>
                ) : (
                    orders.slice(0, 3).map(order => (
                        <div
                            key={order.id}
                            onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                            <div className="size-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{order.customerInitials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{order.customerName}</p>
                                <p className="text-gray-500 text-xs truncate">{order.productSummary}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-bold text-sm">{order.totalPrice.toLocaleString()} so'm</p>
                                <StatusBadge status={order.status} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // --- Products Tab Content ---
    const ProductsTab = () => (
        <div className="pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md p-4">
                {showSearch ? (
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-1">
                            <Icon name="arrow_back" />
                        </button>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Mahsulot qidirish..."
                            autoFocus
                            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm"
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Mahsulotlar</h1>
                        <button onClick={() => setShowSearch(true)} className="p-2 active:scale-90 transition-transform">
                            <Icon name="search" className="text-gray-600" />
                        </button>
                    </div>
                )}
            </header>

            {/* Products List */}
            <div className="px-4 space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <Icon name="inventory_2" className="text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500">Mahsulot topilmadi</p>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                            <div
                                className="size-20 rounded-xl bg-cover bg-center shrink-0 bg-gray-200 flex items-center justify-center"
                                style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}
                            >
                                {!product.image && (
                                    <Icon name="image" className="text-2xl text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{product.name}</p>
                                <p className="text-primary font-bold">{product.price.toLocaleString()} so'm</p>
                                <p className="text-xs text-gray-500">{product.categoryName} • {product.unit}</p>
                            </div>
                            <button
                                onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                                className="p-2 text-gray-400 active:scale-90 transition-transform"
                            >
                                <Icon name="edit" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* FAB Button */}
            <button
                onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                className="fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all z-50"
            >
                <Icon name="add" className="text-2xl" />
            </button>
        </div>
    );

    // --- Reports Tab Content ---
    const ReportsTab = () => {
        const deliveredOrders = orders.filter(o => o.status === 'YETKAZILDI');
        const avgCheck = deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0;

        return (
            <div className="pb-32">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md p-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('DASHBOARD')} className="p-1 active:scale-90 transition-transform">
                            <Icon name="arrow_back" />
                        </button>
                        <h1 className="text-lg font-bold">Hisobotlar</h1>
                    </div>
                </header>

                <div className="px-4 space-y-4">
                    {/* Main Revenue Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-gray-500 text-sm">Yetkazilgan buyurtmalar jami</p>
                            <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                Barcha vaqt
                            </span>
                        </div>
                        <p className="text-3xl font-bold mb-6">{totalRevenue.toLocaleString()} so'm</p>

                        {/* Chart Area */}
                        <div className="h-32 relative mb-4">
                            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M 0 80 Q 30 70 60 50 T 120 30 T 180 60 T 240 40 T 300 50"
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 0 80 Q 30 70 60 50 T 120 30 T 180 60 T 240 40 T 300 50 L 300 100 L 0 100 Z"
                                    fill="url(#chartGradient)"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-gray-500 text-sm">Jami buyurtmalar</span>
                            </div>
                            <p className="text-2xl font-bold">{orders.length} ta</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-gray-500 text-sm">Yetkazildi</span>
                            </div>
                            <p className="text-2xl font-bold">{deliveredOrders.length} ta</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-gray-500 text-sm">O'rtacha chek</span>
                            </div>
                            <p className="text-2xl font-bold">{avgCheck.toLocaleString()} so'm</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-gray-500 text-sm">Kutilmoqda</span>
                            </div>
                            <p className="text-2xl font-bold">{newOrdersCount} ta</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Orders Tab Content ---
    const OrdersTab = () => {
        const filterOptions: { id: 'all' | UIOrderStatus; label: string }[] = [
            { id: 'all', label: 'Barchasi' },
            { id: 'KUTILMOQDA', label: 'Kutilmoqda' },
            { id: 'YETKAZILDI', label: 'Yetkazildi' },
            { id: 'BEKOR_QILINDI', label: 'Bekor' },
        ];

        return (
            <div className="pb-32">
                <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md p-4">
                    <h1 className="text-2xl font-bold">Buyurtmalar</h1>
                    <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                        {filterOptions.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setOrderFilter(filter.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${orderFilter === filter.id
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="px-4 space-y-3 mt-2">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon name="shopping_bag" className="text-4xl text-gray-300 mb-3" />
                            <p className="text-gray-500">Buyurtmalar yo'q</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                            >
                                <div className="size-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{order.customerInitials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{order.customerName}</p>
                                    <p className="text-gray-500 text-xs truncate">{order.productSummary}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-sm">{order.totalPrice.toLocaleString()} so'm</p>
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    // --- Settings Tab Content ---
    const SettingsTab = () => (
        <div className="pb-32">
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md p-4">
                <h1 className="text-2xl font-bold">Sozlamalar</h1>
            </header>

            <div className="px-4 space-y-3">
                {/* Profile Section */}
                <div
                    onClick={() => handleOpenSettingsItem('Profil sozlamalari')}
                    className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 cursor-pointer active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-4">
                        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Icon name="storefront" className="text-primary text-2xl" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{profile?.store.name || "Mening Do'konim"}</p>
                            <p className="text-gray-500 text-sm">Sotuvchi akkaunt</p>
                        </div>
                    </div>
                </div>

                {/* Settings Items */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                    {[
                        { icon: 'person', label: 'Profil sozlamalari' },
                        { icon: 'location_on', label: "Do'kon manzili" },
                        { icon: 'notifications', label: 'Bildirishnomalar' },
                        { icon: 'security', label: 'Xavfsizlik' },
                        { icon: 'help', label: 'Yordam markazi' },
                        { icon: 'info', label: 'Ilova haqida' },
                    ].map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handleOpenSettingsItem(item.label)}
                            className="w-full p-4 flex items-center gap-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
                        >
                            <Icon name={item.icon} className="text-gray-500" />
                            <span className="flex-1 text-left font-medium">{item.label}</span>
                            <Icon name="chevron_right" className="text-gray-400" />
                        </button>
                    ))}
                </div>

                {/* Exit to Buyer App */}
                <button
                    onClick={onBack}
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform"
                >
                    <Icon name="logout" />
                    Xaridor ilovasiga o'tish
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'DASHBOARD': return <DashboardTab />;
            case 'REPORTS': return <ReportsTab />;
            case 'PRODUCTS': return <ProductsTab />;
            case 'ORDERS': return <OrdersTab />;
            case 'SETTINGS': return <SettingsTab />;
            default: return <DashboardTab />;
        }
    };

    return (
        <div className="max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen relative font-sans text-gray-900 dark:text-white overflow-x-hidden">
            {/* Error Toast */}
            {error && <Toast message={error} onClose={clearError} />}

            {/* Header for Dashboard Tab */}
            {activeTab === 'DASHBOARD' && (
                <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md p-4 pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-2xl font-bold">{profile?.store.name || "Mening Do'konim"}</h1>
                            <p className="text-gray-500 text-sm">Sotuvchi paneli</p>
                        </div>
                        <button
                            onClick={() => setShowNotificationsModal(true)}
                            className="relative p-2 active:scale-90 transition-transform"
                        >
                            <Icon name="notifications" className="text-primary" />
                            {newOrdersCount > 0 && <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full" />}
                        </button>
                    </div>
                </header>
            )}

            {renderContent()}
            <SellerTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Modals */}
            <ProductModal
                isOpen={showProductModal}
                onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
                product={editingProduct}
                categories={categories}
                onSave={handleSaveProduct}
                onDelete={editingProduct ? handleDeleteProduct : undefined}
            />
            <NotificationsModal isOpen={showNotificationsModal} onClose={() => setShowNotificationsModal(false)} orders={orders} />
            <OrderDetailsModal
                isOpen={showOrderModal}
                onClose={() => { setShowOrderModal(false); setSelectedOrder(null); }}
                order={selectedOrder}
                onUpdateStatus={updateOrderStatus}
            />
            <SettingsDetailModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                title={settingsModalTitle}
            />

            {/* Animation styles */}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                @keyframes slide-down {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
