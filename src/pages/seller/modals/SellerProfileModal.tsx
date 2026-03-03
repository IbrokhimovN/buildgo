import React, { useState, useEffect } from 'react';
import { ApiCustomer, sellerApi, ApiSellerStore, ApiSellerWorkingHour } from '@/services/api';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SellerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    sellerName: string;
    storeName: string;
    customer: ApiCustomer | null; // Customer data from parent if any
}

const DAYS_OF_WEEK = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

const SellerProfileModal: React.FC<SellerProfileModalProps> = ({
    isOpen, onClose,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');
    const [workingHours, setWorkingHours] = useState<ApiSellerWorkingHour[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchStore();
        }
    }, [isOpen]);

    const fetchStore = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await sellerApi.getProfile();
            if (res.is_seller && res.seller) {
                const s = res.seller.store;
                setName(s.name || '');
                setDescription(s.description || '');
                setPhone(s.phone || '');
                setWorkingHours(s.working_hours || []);
            }
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await sellerApi.updateStore({
                name,
                description,
                phone,
                working_hours: workingHours
            });
            onClose();
            // Refresh to reflect the new name in dashboard
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Saqlashda xatolik');
        } finally {
            setIsSaving(false);
        }
    };

    const updateWorkingHour = (day: number, open: string, close: string) => {
        const newHours = [...workingHours];
        const index = newHours.findIndex(h => h.day_of_week === day);
        if (index >= 0) {
            newHours[index] = { ...newHours[index], open_time: open, close_time: close };
        } else {
            newHours.push({ day_of_week: day, open_time: open, close_time: close });
        }
        setWorkingHours(newHours);
    };

    const toggleWorkingHour = (day: number, enabled: boolean) => {
        if (!enabled) {
            setWorkingHours(workingHours.filter(h => h.day_of_week !== day));
        } else {
            updateWorkingHour(day, '09:00', '18:00');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Do'kon sozlamalari">
            {isLoading ? (
                <div className="py-10"><LoadingSpinner /></div>
            ) : (
                <div className="space-y-6 pt-2 pb-6">
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Do'kon nomi</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-gray-50 border border-subtle rounded-xl px-4 py-3 focus:outline-brand focus:bg-white transition-colors text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Tavsif</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-gray-50 border border-subtle rounded-xl px-4 py-3 focus:outline-brand focus:bg-white transition-colors text-sm min-h-[80px]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Telefon raqam</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full bg-gray-50 border border-subtle rounded-xl px-4 py-3 focus:outline-brand focus:bg-white transition-colors text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-3">Ish vaqtlari</label>
                            <div className="space-y-3 bg-gray-50 p-4 rounded-card border border-subtle">
                                {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                                    const hour = workingHours.find(h => h.day_of_week === dayIndex);
                                    const isEnabled = !!hour;

                                    return (
                                        <div key={dayIndex} className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={(e) => toggleWorkingHour(dayIndex, e.target.checked)}
                                                className="w-4 h-4 text-brand rounded focus:ring-brand border-gray-300"
                                            />
                                            <span className="w-24 text-sm font-medium">{dayName}</span>
                                            {isEnabled && (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="time"
                                                        value={hour.open_time.slice(0, 5)}
                                                        onChange={(e) => updateWorkingHour(dayIndex, e.target.value, hour.close_time)}
                                                        className="w-full text-xs p-1 border border-subtle rounded"
                                                    />
                                                    <span className="text-gray-400">-</span>
                                                    <input
                                                        type="time"
                                                        value={hour.close_time.slice(0, 5)}
                                                        onChange={(e) => updateWorkingHour(dayIndex, hour.open_time, e.target.value)}
                                                        className="w-full text-xs p-1 border border-subtle rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-brand text-white font-bold py-3.5 rounded-xl text-[15px] active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2 select-none"
                    >
                        {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                    </button>

                </div>
            )}
        </Modal>
    );
};

export default SellerProfileModal;
