import React, { useState } from 'react';
import { ApiCategory } from '@/services/api';
import { SellerProductUI, VALID_UNITS } from '@/hooks/useSellerData';
import { ProductFormData } from '../types';
import Icon from '@/components/ui/Icon';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: SellerProductUI | null;
    categories: ApiCategory[];
    onSave: (data: ProductFormData) => Promise<void>;
    onDelete?: (productId: number) => Promise<void>;
    onAddCategory?: (name: string) => Promise<ApiCategory>;
}

const ProductModal: React.FC<ProductModalProps> = ({
    isOpen, onClose, product, categories, onSave, onDelete, onAddCategory,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('dona');
    const [quantity, setQuantity] = useState('0');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCat, setIsAddingCat] = useState(false);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !onAddCategory) return;
        setIsAddingCat(true);
        setSaveError(null);
        try {
            const cat = await onAddCategory(newCategoryName);
            setCategoryId(cat.id);
            setIsAddingCategory(false);
            setNewCategoryName('');
        } catch (err: any) {
            setSaveError(err?.message || "Kategoriya yaratishda xatolik");
        } finally {
            setIsAddingCat(false);
        }
    };

    React.useEffect(() => {
        setSaveError(null);
        if (product) {
            setName(product.name);
            setDescription(product.description || '');
            setPrice(product.price.toString());
            setUnit(product.unit);
            setQuantity(product.quantity.toString());
            setCategoryId(product.categoryId);
            setImagePreview(product.image || null);
            setImageFile(null);
        } else {
            setName(''); setDescription(''); setPrice(''); setUnit('dona'); setQuantity('0');
            setCategoryId(categories[0]?.id || '');
            setImagePreview(null); setImageFile(null);
        }
    }, [product, isOpen, categories]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!name || !price || !categoryId || !quantity || parseInt(quantity) < 0) return;
        setIsSaving(true); setSaveError(null);
        try {
            await onSave({
                name,
                description: description || undefined,
                price: parseFloat(price) || 0,
                unit,
                quantity: parseInt(quantity) || 0,
                categoryId: categoryId as number,
                image: imageFile
            });
            onClose();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Mahsulotni saqlashda xatolik");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!product || !onDelete) return;
        if (!confirm('Bu mahsulotni o\'chirishni xohlaysizmi?')) return;
        setIsDeleting(true); setSaveError(null);
        try {
            await onDelete(product.id);
            onClose();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Mahsulotni o'chirishda xatolik");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-surface">
            <header className="sticky top-0 z-[50] bg-card/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-subtle">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="text-lg font-bold">{product ? "Mahsulotni tahrirlash" : "Yangi Mahsulot Qo'shish"}</h1>
                </div>
                {product && onDelete && (
                    <button onClick={handleDelete} disabled={isDeleting} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-danger">
                        <Icon name="delete" />
                    </button>
                )}
            </header>

            <div className="px-4 pb-32 overflow-y-auto h-[calc(100vh-60px)]">
                {saveError && (
                    <div className="mb-4 p-4 bg-danger-light border border-red-200 text-danger rounded-card text-sm">{saveError}</div>
                )}

                <div className="mb-4 mt-4">
                    <label className="block text-sm font-bold mb-2">Mahsulot nomi *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Sement M-500"
                        className="w-full p-4 rounded-card border border-subtle bg-card text-gray-900 placeholder-gray-400 outline-none focus:border-brand" />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Tavsifi</label>
                    <textarea
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Mahsulot haqida qo'shimcha ma'lumot (ixtiyoriy)"
                        rows={3}
                        className="w-full p-4 rounded-card border border-subtle bg-card text-gray-900 placeholder-gray-400 outline-none focus:border-brand"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Kategoriya *</label>
                    {!isAddingCategory ? (
                        <div className="relative">
                            <select value={categoryId} onChange={(e) => e.target.value === 'new' ? setIsAddingCategory(true) : setCategoryId(Number(e.target.value))}
                                className="w-full p-4 rounded-card border border-subtle bg-card text-gray-900 appearance-none pr-12 outline-none focus:border-brand">
                                <option value="">Kategoriyani tanlang</option>
                                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                {onAddCategory && <option value="new">+ Yangi kategoriya qo'shish</option>}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Icon name="unfold_more" className="text-brand" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Kategoriya nomi"
                                className="flex-1 p-4 rounded-card border border-subtle bg-card outline-none focus:border-brand" autoFocus />
                            <button onClick={handleAddCategory} disabled={isAddingCat || !newCategoryName.trim()}
                                className="bg-brand text-white p-4 rounded-card font-bold flex items-center justify-center min-w-[52px] min-h-[52px]">
                                {isAddingCat ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="check" />}
                            </button>
                            <button onClick={() => setIsAddingCategory(false)}
                                className="bg-gray-100 text-muted p-4 rounded-card font-bold flex items-center justify-center min-w-[52px] min-h-[52px]">
                                <Icon name="close" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Mahsulot rasmi</label>
                    <div className="flex items-center gap-4">
                        <div className="size-20 bg-gray-100 rounded-card overflow-hidden flex items-center justify-center border border-subtle">
                            {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <Icon name="image" className="text-gray-400 text-2xl" />}
                        </div>
                        <label className="bg-card border border-subtle px-4 py-3 rounded-card text-sm font-bold cursor-pointer flex items-center gap-2 min-h-[44px]">
                            <Icon name="add_photo_alternate" className="text-brand" /> Rasm yuklash
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                        {imagePreview && (
                            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="size-11 bg-danger-light text-danger rounded-card flex items-center justify-center">
                                <Icon name="delete" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Narxi (so'm) *</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
                            className="w-full p-4 rounded-card border border-subtle bg-card text-gray-900 placeholder-gray-400 outline-none focus:border-brand" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">O'lchov *</label>
                        <select value={unit} onChange={(e) => setUnit(e.target.value)}
                            className="w-full p-4 rounded-card border border-subtle bg-card text-gray-900 outline-none focus:border-brand">
                            {VALID_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Miqdori (sotuvdagi zaxira) *</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" min="0"
                        className="w-full p-4 rounded-card border border-subtle bg-card text-gray-900 placeholder-gray-400 outline-none focus:border-brand" />
                </div>

                <button onClick={handleSave} disabled={!name || !price || !categoryId || !quantity || parseInt(quantity) < 0 || isSaving}
                    className="w-full bg-brand text-white py-4 rounded-pill font-bold flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px] active:scale-[0.98] transition-transform">
                    {isSaving ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                        <><Icon name="send" className="text-lg" /> {product ? 'Saqlash' : "Saqlash va e'lon qilish"}</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProductModal;
