import React from 'react';
import Icon from './Icon';

interface PageHeaderProps {
    title: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    transparent?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, rightAction, transparent = false }) => (
    <header className={`sticky top-0 z-header ${transparent ? 'bg-card/80 backdrop-blur-md' : 'bg-card'} border-b border-subtle p-4 flex items-center justify-between`}>
        {onBack ? (
            <button
                onClick={onBack}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
            >
                <Icon name="arrow_back_ios" />
            </button>
        ) : (
            <div className="w-[44px]" />
        )}
        <h2 className="text-lg font-bold flex-1 text-center">{title}</h2>
        {rightAction || <div className="w-[44px]" />}
    </header>
);

export default PageHeader;
