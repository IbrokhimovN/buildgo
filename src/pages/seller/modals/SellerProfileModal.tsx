import React from 'react';
import { ApiCustomer } from '@/services/api';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/Icon';

interface SellerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    sellerName: string;
    storeName: string;
    customer: ApiCustomer | null;
}

const SellerProfileModal: React.FC<SellerProfileModalProps> = ({
    isOpen, onClose, sellerName, storeName, customer,
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil sozlamalari">
        <div className="space-y-6 pt-2">
            <div className="flex items-center gap-4">
                <div className="size-20 bg-brand-light rounded-full flex items-center justify-center">
                    <Icon name="storefront" className="text-4xl text-brand" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">{storeName}</h3>
                    <p className="text-muted">Sotuvchi: {sellerName}</p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-card border border-subtle">
                <p className="text-xs text-muted uppercase font-bold mb-3">Shaxsiy ma'lumotlar</p>
                {customer ? (
                    <div className="space-y-4">
                        {[
                            { icon: 'person', label: 'Ism-familiya', value: `${customer.first_name} ${customer.last_name}` },
                            { icon: 'call', label: 'Telefon raqam', value: customer.phone },
                            { icon: 'badge', label: 'Telegram ID', value: customer.telegram_id },
                        ].map((item) => (
                            <div key={item.icon} className="flex items-center gap-3">
                                <div className="size-10 bg-card rounded-lg flex items-center justify-center text-gray-400">
                                    <Icon name={item.icon} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">{item.label}</p>
                                    <p className="font-medium">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-400"><p>Ma'lumotlar yuklanmadi</p></div>
                )}
            </div>
        </div>
    </Modal>
);

export default SellerProfileModal;
