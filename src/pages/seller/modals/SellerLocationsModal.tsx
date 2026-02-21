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
}

const SellerLocationsModal: React.FC<SellerLocationsModalProps> = ({ isOpen, onClose }) => {
    const [locations, setLocations] = useState<ApiLocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => { if (isOpen) fetchLocations(); }, [isOpen]);

    const fetchLocations = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const locs = await sellerApi.getLocations();
            setLocations(locs);
        } catch (err: any) {
            setError(err?.message || "Manzillarni yuklashda xatolik");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bu manzilni o'chirmoqchimisiz?")) return;
        try {
            await sellerApi.deleteLocation(id);
            setLocations(prev => prev.filter(l => l.id !== id));
        } catch (err: any) {
            alert(err?.message || "O'chirishda xatolik");
        }
    };

    if (showMap) {
        return (
            <MapLocationPicker
                onSave={async (data) => {
                    await sellerApi.createLocation({
                        name: data.name,
                        address: data.address,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        is_default: false,
                    });
                    setShowMap(false);
                    fetchLocations();
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
                ) : error ? (
                    <div className="text-center py-6">
                        <p className="text-danger text-sm mb-3">{error}</p>
                        <button onClick={fetchLocations} className="text-brand text-sm font-medium">
                            Qayta yuklash
                        </button>
                    </div>
                ) : (!Array.isArray(locations) || locations.length === 0) ? (
                    <div className="text-center py-8">
                        <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="location_off" className="text-gray-400 text-2xl" />
                        </div>
                        <p className="text-muted text-sm mb-1">Hali manzil qo'shilmagan</p>
                        <p className="text-xs text-gray-400">Do'koningiz manzilini qo'shing</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {locations.map(loc => (
                            <div key={loc.id} className="bg-gray-50 p-3 rounded-card flex items-start gap-3 border border-subtle">
                                <div className="size-10 bg-card rounded-lg flex items-center justify-center text-brand shrink-0">
                                    <Icon name="store" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm truncate">{loc.name}</p>
                                        {loc.is_default && (
                                            <span className="text-[10px] bg-brand-light text-brand px-1.5 py-0.5 rounded-full font-medium">Asosiy</span>
                                        )}
                                    </div>
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
                    <Icon name="add_location" /> Manzil qo'shish
                </button>
            </div>
        </Modal>
    );
};

export default SellerLocationsModal;
