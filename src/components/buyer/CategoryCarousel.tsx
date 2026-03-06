import React, { useEffect, useState } from 'react';
import { publicApi, ApiCategory } from '@/services/api';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface CategoryCarouselProps {
    selectedCategoryId?: number | null;
    onSelectCategory: (categoryId: number | null) => void;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ selectedCategoryId, onSelectCategory }) => {
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await publicApi.getCategories();
            if (data && data.results) {
                setCategories(data.results);
            } else if (Array.isArray(data)) {
                setCategories(data as unknown as ApiCategory[]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    if (error) {
        return <div className="px-4 py-2"><ErrorMessage message={error} onRetry={fetchCategories} /></div>;
    }

    if (!isLoading && categories.length === 0) {
        return null; // hide if no categories
    }

    return (
        <div className="w-full overflow-x-auto no-scrollbar py-3 px-4 flex gap-2 snap-x">
            <button
                onClick={() => onSelectCategory(null)}
                className={`shrink-0 snap-start px-4 py-2 rounded-xl text-sm font-bold border ${selectedCategoryId == null
                        ? 'bg-brand text-white border-brand'
                        : 'bg-card text-gray-700 border-subtle active:bg-gray-50'
                    } transition-colors`}
            >
                Barchasi
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`shrink-0 snap-start px-4 py-2 rounded-xl text-sm font-bold border ${selectedCategoryId === cat.id
                            ? 'bg-brand text-white border-brand'
                            : 'bg-card text-gray-700 border-subtle active:bg-gray-50'
                        } transition-colors`}
                >
                    {/* Add icon placeholder if icon is present in future API models */}
                    {cat.name}
                </button>
            ))}
            {isLoading && (
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="shrink-0 w-24 h-9 rounded-xl bg-gray-200 animate-pulse"></div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryCarousel;
