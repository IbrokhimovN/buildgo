import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Yuklanmoqda...' }) => (
    <div className="flex flex-col items-center justify-center py-20">
        <div className="size-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted text-sm">{message}</p>
    </div>
);

export default LoadingSpinner;
