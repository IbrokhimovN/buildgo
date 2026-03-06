import React from 'react';
import Icon from './Icon';

interface QuantitySelectorProps {
    quantity: number;
    onChange: (quantity: number) => void;
    onRemove?: () => void;
    maxQuantity?: number;
    size?: 'sm' | 'md' | 'lg' | 'full';
    className?: string;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    quantity,
    onChange,
    onRemove,
    maxQuantity = 999,
    size = 'md',
    className = ''
}) => {
    const handleDecrease = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity <= 1 && onRemove) {
            onRemove();
        } else if (quantity > 1) {
            onChange(quantity - 1);
        }
    };

    const handleIncrease = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity < maxQuantity) {
            onChange(quantity + 1);
        }
    };

    // Size variants
    const btnSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : size === 'full' ? 'h-full aspect-square' : 'w-10 h-10';
    const numSize = size === 'sm' ? 'w-6 text-sm' : size === 'lg' ? 'w-10 text-xl' : size === 'full' ? 'flex-1 text-sm' : 'w-8 text-base';
    const iconSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : size === 'full' ? 'text-base' : 'text-lg';

    // Wrapper variations
    const wrapperClass = size === 'full' ? 'flex items-center justify-between w-full h-full' : 'flex items-center gap-2';

    return (
        <div className={`${wrapperClass} ${className}`} onClick={(e) => e.stopPropagation()}>
            <button
                onClick={handleDecrease}
                className={`${btnSize} border border-subtle rounded-lg flex items-center justify-center active:scale-95 transition-transform bg-surface`}
            >
                <Icon name={quantity <= 1 && onRemove ? "delete" : "remove"} className={`${iconSize} ${quantity <= 1 && onRemove ? 'text-danger' : 'text-gray-700'}`} />
            </button>
            <span className={`${numSize} text-center font-bold text-gray-900`}>{quantity}</span>
            <button
                onClick={handleIncrease}
                disabled={quantity >= maxQuantity}
                className={`${btnSize} border border-subtle rounded-lg flex items-center justify-center active:scale-95 transition-transform ${quantity >= maxQuantity ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-surface'}`}
            >
                <Icon name="add" className={`${iconSize} text-gray-700`} />
            </button>
        </div>
    );
};

export default QuantitySelector;
