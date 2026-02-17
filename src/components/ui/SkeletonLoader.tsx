import React from 'react';

interface SkeletonLoaderProps {
    variant: 'store-card' | 'product-card' | 'order-card' | 'list-item';
    count?: number;
}

const SkeletonPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
);

const StoreCardSkeleton: React.FC = () => (
    <div className="bg-card rounded-card overflow-hidden border border-subtle">
        <SkeletonPulse className="w-full h-48" />
        <div className="p-4 space-y-3">
            <SkeletonPulse className="h-5 w-3/4" />
            <div className="flex justify-between">
                <SkeletonPulse className="h-4 w-20" />
                <SkeletonPulse className="h-8 w-16 rounded-lg" />
            </div>
        </div>
    </div>
);

const ProductCardSkeleton: React.FC = () => (
    <div className="bg-card rounded-card overflow-hidden border border-subtle p-3">
        <SkeletonPulse className="aspect-square rounded-lg mb-2" />
        <SkeletonPulse className="h-4 w-3/4 mb-2" />
        <SkeletonPulse className="h-5 w-1/2 mb-3" />
        <SkeletonPulse className="h-10 w-full rounded-lg" />
    </div>
);

const OrderCardSkeleton: React.FC = () => (
    <div className="bg-card rounded-card p-4 border border-subtle space-y-3">
        <div className="flex items-center justify-between">
            <SkeletonPulse className="h-4 w-16" />
            <SkeletonPulse className="h-5 w-20 rounded-md" />
        </div>
        <SkeletonPulse className="h-4 w-2/3" />
        <SkeletonPulse className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-3 border-t border-subtle">
            <SkeletonPulse className="h-3 w-24" />
            <SkeletonPulse className="h-5 w-28" />
        </div>
    </div>
);

const ListItemSkeleton: React.FC = () => (
    <div className="bg-card rounded-card p-3 border border-subtle flex items-center gap-4">
        <SkeletonPulse className="size-20 rounded-card shrink-0" />
        <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
            <SkeletonPulse className="h-5 w-1/3" />
        </div>
    </div>
);

const VARIANTS = {
    'store-card': StoreCardSkeleton,
    'product-card': ProductCardSkeleton,
    'order-card': OrderCardSkeleton,
    'list-item': ListItemSkeleton,
};

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant, count = 3 }) => {
    const Component = VARIANTS[variant];
    const isGrid = variant === 'product-card';

    return (
        <div className={isGrid ? 'grid grid-cols-2 gap-3 p-4' : 'space-y-3 p-4'}>
            {Array.from({ length: count }).map((_, i) => (
                <Component key={i} />
            ))}
        </div>
    );
};

export default SkeletonLoader;
