import React, { useState, useMemo, useEffect } from 'react';
import Icon from './Icon';
import { ApiProduct, ApiProductVariant, ApiProductAttribute } from '@/services/api';

interface VariantSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    onSelectVariant: (variant: ApiProductVariant, quantity: number) => void;
}

const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({
    isOpen,
    onClose,
    product,
    onSelectVariant
}) => {
    // 1. Group variants by their attributes to figure out what options exist
    // Example: we might have variants with Color and / or Size
    const { variants } = product;

    // Safety check
    if (!variants || variants.length === 0) return null;

    // Determine all unique attribute names available across all variants
    // e.g. ["Color", "Size"]
    const availableAttributeNames = useMemo(() => {
        const names = new Set<string>();
        variants.forEach(v => {
            v.attributes.forEach(attr => names.add(attr.attribute_name));
        });
        return Array.from(names);
    }, [variants]);

    // Keep track of user's current selection mapping: { "Color": "Red", "Size": "XL" }
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);

    // When modal opens, auto-select first available variant's attributes
    useEffect(() => {
        if (isOpen && variants.length > 0) {
            const initialSelection: Record<string, string> = {};
            variants[0].attributes.forEach(attr => {
                initialSelection[attr.attribute_name] = attr.value;
            });
            setSelections(initialSelection);
            setQuantity(1);
        }
    }, [isOpen, variants]);

    // Compute which options are valid given CURRENT selections
    // For a complex matrix, we'd need more logic, but here we just find the matching variant
    const currentVariant = useMemo(() => {
        return variants.find(variant => {
            return availableAttributeNames.every(attrName => {
                const variantAttr = variant.attributes.find(a => a.attribute_name === attrName);
                return variantAttr && variantAttr.value === selections[attrName];
            });
        });
    }, [selections, variants, availableAttributeNames]);

    const handleSelectOption = (attrName: string, value: string) => {
        setSelections(prev => ({
            ...prev,
            [attrName]: value
        }));
    };

    const handleAddToCart = () => {
        if (currentVariant) {
            onSelectVariant(currentVariant, quantity);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/50 p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-surface rounded-modal w-full max-h-[85vh] overflow-y-auto max-w-lg mx-auto shadow-elevation animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-surface/90 backdrop-blur-md z-10 flex items-center justify-between p-4 border-b border-subtle">
                    <h3 className="font-bold text-lg">Variantni tanlang</h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-500 rounded-full active:bg-gray-100 transition-colors">
                        <Icon name="close" className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {/* Selected Variant Preview */}
                    <div className="flex gap-4 items-center">
                        <div
                            className="size-20 bg-gray-100 rounded-lg bg-cover bg-center shrink-0 border border-subtle"
                            style={{ backgroundImage: product.images?.length ? `url(${product.images[0].image})` : (product.image ? `url(${product.image})` : undefined) }}
                        />
                        <div>
                            <p className="font-bold text-gray-900">{product.name}</p>
                            {currentVariant ? (
                                <p className="text-brand font-black text-lg mt-1">{parseFloat(currentVariant.price).toLocaleString()} so'm</p>
                            ) : (
                                <p className="text-danger font-medium text-sm mt-1">Sotuvda yo'q</p>
                            )}
                            {currentVariant && (
                                <p className="text-muted text-xs mt-0.5">Qoldiq: {currentVariant.quantity} ta</p>
                            )}
                        </div>
                    </div>

                    {/* Attributes */}
                    {availableAttributeNames.map(attrName => {
                        // Extract all unique values for this specific attribute across ALL variants
                        const values = Array.from(new Set(
                            variants
                                .flatMap(v => v.attributes)
                                .filter(a => a.attribute_name === attrName)
                                .map(a => a.value)
                        ));

                        return (
                            <div key={attrName} className="space-y-3">
                                <h4 className="font-bold text-sm text-gray-700">{attrName}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {values.map(val => {
                                        const isSelected = selections[attrName] === val;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => handleSelectOption(attrName, val)}
                                                className={`px-4 py-2 border rounded-lg font-semibold text-sm transition-all ${isSelected
                                                        ? 'border-brand bg-brand-light text-brand'
                                                        : 'border-subtle bg-white text-gray-700 active:bg-gray-50'
                                                    }`}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Quantity */}
                    <div className="space-y-3 pt-2">
                        <h4 className="font-bold text-sm text-gray-700">Miqdor</h4>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="size-11 border border-subtle rounded-card flex items-center justify-center active:bg-gray-50 bg-white"
                            >
                                <Icon name="remove" className="text-gray-700" />
                            </button>
                            <span className="w-10 text-center font-bold text-xl">{quantity}</span>
                            <button
                                onClick={() => setQuantity(currentVariant ? Math.min(currentVariant.quantity, quantity + 1) : quantity + 1)}
                                disabled={!currentVariant || quantity >= currentVariant.quantity}
                                className={`size-11 border border-subtle rounded-card flex items-center justify-center ${!currentVariant || quantity >= currentVariant.quantity ? 'opacity-50 bg-gray-50' : 'active:bg-gray-50 bg-white'}`}
                            >
                                <Icon name="add" className="text-gray-700" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-subtle sticky bottom-0 bg-surface">
                    <button
                        onClick={handleAddToCart}
                        disabled={!currentVariant || currentVariant.quantity === 0}
                        className="w-full bg-brand text-white py-4 rounded-card font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:bg-gray-400"
                    >
                        <Icon name="shopping_cart" className="text-xl" />
                        {!currentVariant
                            ? "Tanlangan shaklda yo'q"
                            : currentVariant.quantity === 0
                                ? "Sotuvda yo'q"
                                : `Savatga qo'shish — ${(parseFloat(currentVariant.price) * quantity).toLocaleString()} so'm`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariantSelectorModal;
