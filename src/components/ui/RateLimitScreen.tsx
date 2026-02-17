import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface RateLimitScreenProps {
    retryAfter?: number; // seconds
    onRetry?: () => void;
}

/**
 * Rate limit screen for 429 responses.
 * Shows a countdown timer until retry is allowed.
 */
const RateLimitScreen: React.FC<RateLimitScreenProps> = ({
    retryAfter = 30,
    onRetry,
}) => {
    const [countdown, setCountdown] = useState(retryAfter);

    useEffect(() => {
        setCountdown(retryAfter);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [retryAfter]);

    return (
        <div className="max-w-lg mx-auto bg-surface min-h-screen flex items-center justify-center p-8">
            <div className="text-center space-y-4">
                <div className="size-20 bg-warning-light rounded-full flex items-center justify-center mx-auto">
                    <Icon name="speed" className="text-warning text-4xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Juda ko'p so'rov</h2>
                <p className="text-muted text-sm leading-relaxed">
                    Iltimos, qayta urinishdan oldin kuting
                </p>
                {countdown > 0 ? (
                    <div className="text-3xl font-black text-brand tabular-nums">
                        {countdown}s
                    </div>
                ) : (
                    <button
                        onClick={onRetry || (() => window.location.reload())}
                        className="bg-brand text-white font-bold px-8 py-3 rounded-card min-h-[44px] active:scale-[0.98] transition-transform"
                    >
                        Qayta urinish
                    </button>
                )}
            </div>
        </div>
    );
};

export default RateLimitScreen;
