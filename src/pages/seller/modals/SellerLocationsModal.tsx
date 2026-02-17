import React, { useState, useEffect } from 'react';
import { sellerApi, ApiLocation } from '@/services/api';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import MapLocationPicker from '@/components/map/MapLocationPicker';

interface SellerLocationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    telegramId: number;
}

const SellerLocationsModal: React.FC<SellerLocationsModalProps> = ({ isOpen, onClose, telegramId }) => {
    const [locations, setLocations] = useState<ApiLocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => { if (isOpen) fetchLocations(); }, [isOpen]);

    const fetchLocations = async () => {
        setIsLoading(true);
        try { const locs = await sellerApi.getLocations(telegramId); setLocations(locs); }
        catch { /* silent */ }
        finally { setIsLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bu manzilni o'chirmoqchimisiz?")) return;
        try { await sellerApi.deleteLocation(id, telegramId); setLocations(prev => prev.filter(l => l.id !== id)); }
        catch { alert("O'chirishda xatolik"); }
    };

    if (showMap) {
        return (
            <MapLocationPicker
                onSave={async (data: any) => {
                    await sellerApi.createLocation({ telegram_id: telegramId, name: data.name, address: data.address, latitude: data.latitude, longitude: data.longitude, is_default: false });
                    setShowMap(false); fetchLocations();
                }}
                onCancel={() => setShowMap(false)}
                saveLabel="Manzilni saqlash"
            />
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Do'kon manzillari">
            <div className="space-y-4 pt-2">
                {isLoading ? (
                    <LoadingSpinner message="Manzillar yuklanmoqda..." />
                ) : locations.length === 0 ? (
                    <EmptyState icon="location_off" message="Manzillar yo'q" />
                ) : (
                    <div className="space-y-3">
                        {locations.map(loc => (
                            <div key={loc.id} className="bg-gray-50 p-3 rounded-card flex items-start gap-3 border border-subtle">
                                <div className="size-10 bg-card rounded-lg flex items-center justify-center text-brand shrink-0">
                                    <Icon name="store" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{loc.name}</p>
                                    <p className="text-xs text-muted line-clamp-2">{loc.address}</p>
                                </div>
                                <button onClick={() => handleDelete(loc.id)} className="size-11 bg-card rounded-lg flex items-center justify-center text-danger">
                                    <Icon name="delete" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={() => setShowMap(true)} className="w-full py-3 bg-brand-light text-brand font-bold rounded-card flex items-center justify-center gap-2 min-h-[44px]">
                    <Icon name="add_location" /> Yangi manzil qo'shish
                </button>
            </div>
        </Modal>
    );
};

export default SellerLocationsModal;
