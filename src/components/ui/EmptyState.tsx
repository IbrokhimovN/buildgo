import React from 'react';
import Icon from './Icon';

interface EmptyStateProps {
    icon: string;
    message: string;
    hint?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, hint }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icon name={icon} className="text-3xl text-gray-400" />
        </div>
        <p className="text-muted text-center">{message}</p>
        {hint && <p className="text-gray-400 text-sm text-center mt-1">{hint}</p>}
    </div>
);

export default EmptyState;
