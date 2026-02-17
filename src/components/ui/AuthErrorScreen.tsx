import React from 'react';
import Icon from './Icon';

interface AuthErrorScreenProps {
    message?: string;
}

/**
 * Full-screen auth error for 401.
 * Displayed when initData is invalid or missing.
 */
const AuthErrorScreen: React.FC<AuthErrorScreenProps> = ({
    message = "Ilovani Telegram orqali qayta oching",
}) => (
    <div className="max-w-lg mx-auto bg-surface min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4">
            <div className="size-20 bg-danger-light rounded-full flex items-center justify-center mx-auto">
                <Icon name="lock" className="text-danger text-4xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Autentifikatsiya xatoligi</h2>
            <p className="text-muted text-sm leading-relaxed">{message}</p>
            <div className="pt-2">
                <p className="text-xs text-gray-400">
                    Bu ilova faqat Telegram orqali ishlaydi
                </p>
            </div>
        </div>
    </div>
);

export default AuthErrorScreen;
