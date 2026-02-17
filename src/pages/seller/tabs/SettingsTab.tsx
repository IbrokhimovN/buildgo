import React, { useState } from 'react';
import { ApiCustomer } from '@/services/api';
import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SellerProfileModal from '../modals/SellerProfileModal';
import SellerLocationsModal from '../modals/SellerLocationsModal';

interface SettingsTabProps {
    storeName: string;
    sellerName: string;
    telegramId: number;
    customerProfile: ApiCustomer | null;
}

const SETTINGS_ITEMS = [
    { icon: 'person', label: 'Profil sozlamalari' },
    { icon: 'location_on', label: "Do'kon manzili" },
    { icon: 'notifications', label: 'Bildirishnomalar' },
    { icon: 'security', label: 'Xavfsizlik' },
    { icon: 'help', label: 'Yordam markazi' },
    { icon: 'info', label: 'Ilova haqida' },
];

const SettingsTab: React.FC<SettingsTabProps> = ({
    storeName, sellerName, telegramId, customerProfile,
}) => {
    // Local state — owned by this tab
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showLocationsModal, setShowLocationsModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsModalTitle, setSettingsModalTitle] = useState('');

    const handleOpenSettingsItem = (label: string) => {
        if (label === 'Profil sozlamalari') { setShowProfileModal(true); return; }
        if (label === "Do'kon manzili") { setShowLocationsModal(true); return; }
        setSettingsModalTitle(label);
        setShowSettingsModal(true);
    };

    return (
        <>
            <div className="pb-32">
                <header className="sticky top-0 z-header bg-card/90 backdrop-blur-md p-4 border-b border-subtle">
                    <h1 className="text-2xl font-bold">Sozlamalar</h1>
                </header>

                <div className="px-4 space-y-3 mt-2">
                    <div onClick={() => handleOpenSettingsItem('Profil sozlamalari')}
                        className="bg-card rounded-card p-4 border border-subtle cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-4">
                            <div className="size-16 bg-brand-light rounded-full flex items-center justify-center">
                                <Icon name="storefront" className="text-brand text-2xl" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">{storeName || "Mening Do'konim"}</p>
                                <p className="text-muted text-sm">Sotuvchi akkaunt</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-card border border-subtle divide-y divide-subtle">
                        {SETTINGS_ITEMS.map((item) => (
                            <button key={item.label} onClick={() => handleOpenSettingsItem(item.label)}
                                className="w-full p-4 flex items-center gap-4 min-h-[52px]">
                                <Icon name={item.icon} className="text-muted" />
                                <span className="flex-1 text-left font-medium">{item.label}</span>
                                <Icon name="chevron_right" className="text-gray-400" />
                            </button>
                        ))}
                    </div>

                    <div className="w-full bg-gray-50 text-muted py-4 rounded-card text-center text-sm mt-4">
                        Sotuvchi: {sellerName}
                    </div>
                </div>
            </div>

            {/* Modals owned by Settings */}
            <SellerProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                sellerName={sellerName}
                storeName={storeName}
                customer={customerProfile}
            />
            <SellerLocationsModal
                isOpen={showLocationsModal}
                onClose={() => setShowLocationsModal(false)}
                telegramId={telegramId}
            />
            {showSettingsModal && (
                <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title={settingsModalTitle}>
                    <EmptyState icon="construction" message="Bu bo'lim tez orada qo'shiladi" />
                </Modal>
            )}
        </>
    );
};

export default SettingsTab;
