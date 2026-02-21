import React from 'react';
import Icon from './Icon';

interface ToastProps {
    message: string;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => (
    <div className="fixed top-4 left-4 right-4 z-[300] bg-danger text-white p-4 rounded-card shadow-lg flex items-center gap-3 animate-slide-down">
        <Icon name="error" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={onClose} className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Icon name="close" />
        </button>
    </div>
);

export default Toast;
