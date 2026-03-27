import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/Icon';
import { authApi } from '@/services/api';

interface SetWebPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SetWebPasswordModal: React.FC<SetWebPasswordModalProps> = ({ isOpen, onClose }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!phoneNumber.trim()) {
            setError('Telefon raqam kiritilishi shart.');
            return;
        }

        if (password.length < 6) {
            setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Parollar bir xil emas.');
            return;
        }

        setLoading(true);
        try {
            await authApi.setPassword({
                phone_number: phoneNumber.trim(),
                password,
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
            setPhoneNumber('');
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setError(null);
            setSuccess(false);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Web parol o'rnatish">
            {success ? (
                <div className="text-center py-8 space-y-4">
                    <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Icon name="lock" className="text-green-600 text-3xl" />
                    </div>
                    <p className="font-bold text-lg">Parol o'rnatildi!</p>
                    <p className="text-muted text-sm">
                        Endi siz web-saytga telefon raqam va parol orqali kirish imkoniyatiga egasiz.
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
                        <label className="block text-sm font-medium text-muted mb-1">Telefon raqam</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            placeholder="+998 90 123 45 67"
                            className="w-full bg-subtle rounded-xl px-4 py-3 border border-subtle focus:border-brand focus:outline-none"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Yangi parol</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Kamida 6 ta belgi"
                                className="w-full bg-subtle rounded-xl px-4 py-3 pr-12 border border-subtle focus:border-brand focus:outline-none"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted"
                            >
                                <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Parolni tasdiqlash</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Parolni qayta kiriting"
                            className="w-full bg-subtle rounded-xl px-4 py-3 border border-subtle focus:border-brand focus:outline-none"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Saqlanmoqda...
                            </>
                        ) : (
                            <>
                                <Icon name="lock" />
                                Parolni saqlash
                            </>
                        )}
                    </button>

                    <p className="text-xs text-muted text-center">
                        Bu parol web-sayt orqali kirish uchun ishlatiladi.
                        Telegram orqali kirish parolsiz davom etadi.
                    </p>
                </form>
            )}
        </Modal>
    );
};

export default SetWebPasswordModal;
