import React from 'react';
import Icon from './Icon';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
        <Icon name="error" className="text-4xl text-danger mb-4" />
        <p className="text-gray-700 text-center mb-4">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="bg-brand text-white px-6 py-3 rounded-card font-bold min-h-[44px]"
            >
                Qayta urinish
            </button>
        )}
    </div>
);

export default ErrorMessage;
