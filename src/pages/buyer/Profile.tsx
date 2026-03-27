import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import MapLocationPicker from '@/components/map/MapLocationPicker';
import { useLocations } from '@/hooks/useBuyerData';
import { buyerApi, authApi } from '@/services/api';
import { TelegramUser } from '@/services/telegram';

interface ProfileViewProps {
    telegramUser: TelegramUser;
}

const ProfileView: React.FC<ProfileViewProps> = ({ telegramUser }) => {
    // @ts-ignore — Telegram WebApp global
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    const [profileView, setProfileView] = useState<'main' | 'locations' | 'add_location'>('main');
    const { locations, isLoading: isLoadingLocations, addLocation, deleteLocation, refetch: refetchLocations } = useLocations();

    // Seller registration state
    const [showSellerModal, setShowSellerModal] = useState(false);
    const [storeName, setStoreName] = useState('');
    const [sellerLoading, setSellerLoading] = useState(false);
    const [sellerError, setSellerError] = useState<string | null>(null);

    const displayName = `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || 'Foydalanuvchi';

    const handleRegisterStore = async () => {
        if (!storeName.trim()) {
            setSellerError("Do'kon nomini kiriting");
            return;
        }
        setSellerError(null);
        setSellerLoading(true);
        try {
            await authApi.registerStore({ name: storeName.trim() });
            // Reload the app to enter seller mode
            window.location.reload();
        } catch (err: any) {
            setSellerError(err?.message || 'Xatolik yuz berdi');
        } finally {
            setSellerLoading(false);
        }
    };

    // Map picker
    if (profileView === 'add_location') {
        return (
            <MapLocationPicker
                onSave={async (data: any) => {
                    await buyerApi.createLocation({
                        name: data.name,
                        address: data.address,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        is_default: false,
                    });
                    refetchLocations();
                    setProfileView('locations');
                }}
                onCancel={() => setProfileView('locations')}
            />
        );
    }

    // Saved locations view
    if (profileView === 'locations') {
        return (
            <div className="pb-32">
                <PageHeader title="Saqlangan manzillar" onBack={() => setProfileView('main')} />

                <div className="px-4 mt-4">
                    {isLoadingLocations ? (
                        <SkeletonLoader variant="list-item" count={2} />
                    ) : locations.length === 0 ? (
                        <EmptyState icon="location_off" message="Saqlangan manzillar yo'q" hint="Xaritadan yangi manzil qo'shing" />
                    ) : (
                        <div className="space-y-3">
                            {locations.map((loc) => (
                                <div
                                    key={loc.id}
                                    className="bg-card rounded-card p-4 border border-subtle flex items-start gap-3"
                                >
                                    <div className="size-10 bg-blue-50 rounded-card flex items-center justify-center mt-0.5 shrink-0">
                                        <Icon name="location_on" className="text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm">{loc.name}</p>
                                            {loc.is_default && (
                                                <span className="text-2xs bg-brand-light text-green-700 font-bold px-2 py-0.5 rounded-md">Asosiy</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted mt-1 line-clamp-2">{loc.address}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Bu manzilni o'chirmoqchimisiz?")) {
                                                deleteLocation(loc.id);
                                            }
                                        }}
                                        className="size-11 flex items-center justify-center rounded-lg shrink-0"
                                    >
                                        <Icon name="delete" className="text-danger text-lg" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => setProfileView('add_location')}
                        className="w-full mt-4 p-4 rounded-card border-2 border-dashed border-gray-300 text-sm font-medium text-muted flex items-center justify-center gap-2 min-h-[52px]"
                    >
                        <Icon name="add_location" className="text-brand text-lg" />
                        Xaritadan yangi manzil qo'shish
                    </button>
                </div>
            </div>
        );
    }

    // Main profile view
    return (
        <>
            <div className="pb-32">
                <header className="sticky top-0 z-[50] bg-card/80 backdrop-blur-md border-b border-subtle p-4">
                    <h2 className="text-lg font-bold text-center">Profil</h2>
                </header>

                <div className="px-4 mt-6">
                    {/* User Info Card */}
                    <div className="bg-card rounded-card p-6 border border-subtle mb-6">
                        <div className="flex items-center gap-4">
                            <div className="size-16 bg-brand-light rounded-full flex items-center justify-center">
                                <Icon name="person" className="text-3xl text-brand" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-lg truncate">{displayName}</p>
                                <p className="text-muted text-sm">
                                    {tgUser?.username ? `@${tgUser.username}` : 'Telegram orqali'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="bg-card rounded-card border border-subtle divide-y divide-subtle">
                        <button
                            onClick={() => setProfileView('locations')}
                            className="w-full p-4 flex items-center gap-4 min-h-[52px]"
                        >
                            <div className="size-10 bg-blue-50 rounded-card flex items-center justify-center">
                                <Icon name="location_on" className="text-blue-500" />
                            </div>
                            <span className="flex-1 text-left font-medium">Saqlangan manzillar</span>
                            <span className="bg-gray-100 text-xs font-bold px-2.5 py-1 rounded-full">
                                {isLoadingLocations ? '...' : locations.length}
                            </span>
                            <Icon name="chevron_right" className="text-gray-400" />
                        </button>
                        <button className="w-full p-4 flex items-center gap-4 min-h-[52px]">
                            <div className="size-10 bg-purple-50 rounded-card flex items-center justify-center">
                                <Icon name="help" className="text-purple-500" />
                            </div>
                            <span className="flex-1 text-left font-medium">Yordam</span>
                            <Icon name="chevron_right" className="text-gray-400" />
                        </button>
                    </div>

                    {/* Become a Seller Button */}
                    <button
                        onClick={() => setShowSellerModal(true)}
                        className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-card flex items-center gap-4 shadow-lg active:scale-[0.98] transition-transform"
                    >
                        <div className="size-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Icon name="storefront" className="text-white text-2xl" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold text-lg">Sotuvchi bo'lish</p>
                            <p className="text-white/80 text-xs">Do'kon oching va sotuvga boshlang</p>
                        </div>
                        <Icon name="chevron_right" className="text-white/70" />
                    </button>
                </div>
            </div>

            {/* Seller Registration Modal */}
            <Modal isOpen={showSellerModal} onClose={() => setShowSellerModal(false)} title="Do'kon ochish">
                <div className="space-y-4">
                    {sellerError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                            {sellerError}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Do'kon nomi</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={e => setStoreName(e.target.value)}
                            placeholder="Masalan: Premium Qurilish"
                            className="w-full bg-subtle rounded-xl px-4 py-3 border border-subtle focus:border-brand focus:outline-none"
                            disabled={sellerLoading}
                        />
                    </div>
                    <p className="text-xs text-muted">
                        Do'kon ochilgandan so'ng, siz guvohnoma va hujjatlaringizni yuklashingiz kerak bo'ladi.
                    </p>
                    <button
                        onClick={handleRegisterStore}
                        disabled={sellerLoading}
                        className="w-full bg-brand text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {sellerLoading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Yaratilmoqda...
                            </>
                        ) : (
                            <>
                                <Icon name="storefront" />
                                Do'konni ochish
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default ProfileView;
