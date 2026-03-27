import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/Icon';
import { authApi } from '@/services/api';

interface StoreVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DOC_TYPES = [
    { value: 'guvohnoma', label: 'Guvohnoma' },
    { value: 'passport', label: 'Passport' },
];

const StoreVerificationModal: React.FC<StoreVerificationModalProps> = ({ isOpen, onClose }) => {
    const [legalName, setLegalName] = useState('');
    const [inn, setInn] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [docTypes, setDocTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selected]);
            setDocTypes(prev => [...prev, ...selected.map(() => 'guvohnoma')]);
        }
    };

    const handleDocTypeChange = (index: number, value: string) => {
        setDocTypes(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setDocTypes(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!legalName.trim() || !inn.trim()) {
            setError('Yuridik nom va INN kiritilishi shart.');
            return;
        }

        setLoading(true);
        try {
            await authApi.verifyStore({
                legal_name: legalName.trim(),
                inn: inn.trim(),
                documents: files,
                document_types: docTypes,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err?.message || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setLegalName('');
            setInn('');
            setFiles([]);
            setDocTypes([]);
            setError(null);
            setSuccess(false);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Do'konni tasdiqlash">
            {success ? (
                <div className="text-center py-8 space-y-4">
                    <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Icon name="check_circle" className="text-green-600 text-3xl" />
                    </div>
                    <p className="font-bold text-lg">Hujjatlar yuborildi!</p>
                    <p className="text-muted text-sm">
                        Do'koningiz tekshiruv jarayonida. Natija tez orada ma'lum qilinadi.
                    </p>
                    <button
                        onClick={handleClose}
                        className="bg-brand text-white px-6 py-3 rounded-xl font-medium mt-4"
                    >
                        Yopish
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Yuridik nomi</label>
                        <input
                            type="text"
                            value={legalName}
                            onChange={e => setLegalName(e.target.value)}
                            placeholder="OOO BuildGo"
                            className="w-full bg-subtle rounded-xl px-4 py-3 border border-subtle focus:border-brand focus:outline-none"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">INN</label>
                        <input
                            type="text"
                            value={inn}
                            onChange={e => setInn(e.target.value)}
                            placeholder="123456789"
                            className="w-full bg-subtle rounded-xl px-4 py-3 border border-subtle focus:border-brand focus:outline-none"
                            disabled={loading}
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-2">Hujjatlar</label>

                        {files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 mb-2 bg-subtle rounded-xl px-3 py-2">
                                <Icon name="description" className="text-muted" />
                                <span className="flex-1 text-sm truncate">{file.name}</span>
                                <select
                                    value={docTypes[i]}
                                    onChange={e => handleDocTypeChange(i, e.target.value)}
                                    className="text-sm bg-card rounded-lg px-2 py-1 border border-subtle"
                                    disabled={loading}
                                >
                                    {DOC_TYPES.map(dt => (
                                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => removeFile(i)}
                                    className="p-1 text-red-400 hover:text-red-600"
                                    disabled={loading}
                                >
                                    <Icon name="close" className="text-sm" />
                                </button>
                            </div>
                        ))}

                        <label className="flex items-center gap-2 border-2 border-dashed border-subtle rounded-xl p-4 cursor-pointer hover:border-brand transition-colors">
                            <Icon name="cloud_upload" className="text-brand text-2xl" />
                            <span className="text-sm text-muted">Hujjat qo'shish (guvohnoma yoki passport)</span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={loading}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Yuborilmoqda...
                            </>
                        ) : (
                            <>
                                <Icon name="verified" />
                                Tasdiqlashga yuborish
                            </>
                        )}
                    </button>
                </form>
            )}
        </Modal>
    );
};

export default StoreVerificationModal;
