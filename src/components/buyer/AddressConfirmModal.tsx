import React from 'react';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/Icon';

interface AddressConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCurrent: () => void;
}

const AddressConfirmModal: React.FC<AddressConfirmModalProps> = ({ isOpen, onClose, onSelectCurrent }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Yetkazib berish manzili">
        <div className="flex flex-col items-center py-6 text-center">
            <div className="size-20 bg-brand-light rounded-full flex items-center justify-center mb-4">
                <Icon name="location_on" className="text-4xl text-brand" />
            </div>
            <h3 className="text-xl font-bold mb-2">Qayerga yetkazib beraylik?</h3>
            <p className="text-sm text-muted mb-6">Mamlakat bo'ylab tez yetkazib berish xizmati.</p>

            <div className="w-full space-y-3">
                <button
                    onClick={() => { onSelectCurrent(); onClose(); }}
                    className="w-full bg-brand text-white font-bold py-3.5 rounded-xl text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Icon name="my_location" />
                    Hozirgi joylashuvni aniqlash
                </button>
                <button
                    onClick={onClose}
                    className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl text-[15px] active:scale-[0.98] transition-all flex items-center justify-center"
                >
                    Men o'zim kiritaman
                </button>
            </div>
        </div>
    </Modal>
);

export default AddressConfirmModal;
