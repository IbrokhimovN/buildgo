import React from 'react';
import Icon from './Icon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card w-full max-w-lg rounded-t-modal max-h-[100dvh] sm:max-h-[90vh] overflow-hidden animate-slide-up flex flex-col pt-safe-top pb-safe-bottom">
                <div className="bg-card p-4 border-b border-subtle flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2.5 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <Icon name="close" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 h-full min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
