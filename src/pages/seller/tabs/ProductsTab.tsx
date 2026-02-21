import React, { useState } from 'react';
import { ApiCategory, sellerApi } from '@/services/api';
import { SellerProductUI } from '@/hooks/useSellerData';
import { ProductFormData } from '../types';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import ProductModal from '../modals/ProductModal';

interface ProductsTabProps {
    products: SellerProductUI[];
    categories: ApiCategory[];
    onCreateProduct: (data: ProductFormData) => Promise<void>;
    onUpdateProduct: (id: number, data: ProductFormData) => Promise<void>;
    onDeleteProduct: (id: number) => Promise<void>;
    onRefetch: () => Promise<void>;
}

const ProductsTab: React.FC<ProductsTabProps> = ({
    products, categories,
    onCreateProduct, onUpdateProduct, onDeleteProduct, onRefetch,
}) => {
    // Local state — owned by this tab, not the shell
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<SellerProductUI | null>(null);

    const filteredProducts = searchQuery
        ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : products;

    const openAddProduct = () => { setEditingProduct(null); setShowProductModal(true); };
    const openEditProduct = (product: SellerProductUI) => { setEditingProduct(product); setShowProductModal(true); };
    const closeProductModal = () => { setShowProductModal(false); setEditingProduct(null); };

    return (
        <>
            <div className="pb-32">
                <header className="sticky top-0 z-[50] bg-card/90 backdrop-blur-md p-4 border-b border-subtle">
                    {showSearch ? (
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
                                <Icon name="arrow_back" />
                            </button>
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Mahsulot qidirish..."
                                autoFocus className="flex-1 bg-gray-100 rounded-card px-4 py-3 text-sm outline-none" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold">Mahsulotlar</h1>
                            <button onClick={() => setShowSearch(true)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <Icon name="search" className="text-muted" />
                            </button>
                        </div>
                    )}
                </header>

                <div className="px-4 space-y-3 mt-2">
                    {filteredProducts.length === 0 ? (
                        <EmptyState icon="inventory_2" message="Mahsulot topilmadi" />
                    ) : (
                        filteredProducts.map(product => (
                            <div key={product.id} className="bg-card rounded-card p-3 border border-subtle flex items-center gap-4">
                                <div className="size-20 rounded-card bg-cover bg-center shrink-0 bg-gray-100 flex items-center justify-center"
                                    style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}>
                                    {!product.image && <Icon name="image" className="text-2xl text-gray-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{product.name}</p>
                                    <p className="text-brand font-bold">{product.price.toLocaleString()} so'm</p>
                                    <p className="text-xs text-muted">{product.categoryName} • {product.unit}</p>
                                </div>
                                <button onClick={() => openEditProduct(product)}
                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400">
                                    <Icon name="edit" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <button onClick={openAddProduct}
                    className="fixed bottom-24 right-6 size-14 bg-brand text-white rounded-full flex items-center justify-center shadow-lg z-[50] active:scale-[0.95] transition-transform">
                    <Icon name="add" className="text-2xl" />
                </button>
            </div>

            <ProductModal
                isOpen={showProductModal}
                onClose={closeProductModal}
                product={editingProduct}
                categories={categories}
                onSave={async (data) => {
                    if (editingProduct) {
                        await onUpdateProduct(editingProduct.id, data);
                    } else {
                        await onCreateProduct(data);
                    }
                }}
                onDelete={editingProduct ? async (id) => onDeleteProduct(id) : undefined}
                onAddCategory={async (name) => {
                    const cat = await sellerApi.createCategory({ name });
                    await onRefetch();
                    return cat;
                }}
            />
        </>
    );
};

export default ProductsTab;
