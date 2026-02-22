'use client';

import React from 'react';

interface VerifiedBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    type?: 'manual' | 'organic' | 'paid' | 'none';
}

const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
};

/**
 * Premium Verified Badge — displays next to usernames.
 * Shimmer animation for a luxury feel. Color varies by verification type.
 */
export default function VerifiedBadge({ size = 'md', className = '', type = 'manual' }: VerifiedBadgeProps) {
    if (type === 'none') return null;

    const colorMap = {
        manual: 'from-blue-400 to-blue-600',     // Founder-granted
        organic: 'from-emerald-400 to-emerald-600', // Activity-based
        paid: 'from-amber-400 to-amber-600',     // Paid subscription
    };

    const gradient = colorMap[type] || colorMap.manual;

    return (
        <span
            className={`inline-flex items-center justify-center ${sizeMap[size]} ${className}`}
            title={`Verified (${type})`}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`${sizeMap[size]} drop-shadow-sm`}
            >
                {/* Badge background with gradient */}
                <defs>
                    <linearGradient id={`badge-gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className={`text-${type === 'manual' ? 'blue' : type === 'organic' ? 'emerald' : 'amber'}-400`} style={{ stopColor: type === 'manual' ? '#60a5fa' : type === 'organic' ? '#34d399' : '#fbbf24' }} />
                        <stop offset="100%" className={`text-${type === 'manual' ? 'blue' : type === 'organic' ? 'emerald' : 'amber'}-600`} style={{ stopColor: type === 'manual' ? '#2563eb' : type === 'organic' ? '#059669' : '#d97706' }} />
                    </linearGradient>
                    {/* Shimmer animation */}
                    <linearGradient id={`shimmer-${type}`} x1="-100%" y1="0%" x2="200%" y2="0%">
                        <stop offset="0%" style={{ stopColor: 'transparent' }} />
                        <stop offset="50%" style={{ stopColor: 'rgba(255,255,255,0.3)' }} />
                        <stop offset="100%" style={{ stopColor: 'transparent' }} />
                        <animateTransform
                            attributeName="gradientTransform"
                            type="translate"
                            values="-1 0; 2 0"
                            dur="2.5s"
                            repeatCount="indefinite"
                        />
                    </linearGradient>
                </defs>
                {/* Shield / badge shape */}
                <path
                    d="M12 2L4.5 6.5V11.5C4.5 16.2 7.7 20.6 12 22C16.3 20.6 19.5 16.2 19.5 11.5V6.5L12 2Z"
                    fill={`url(#badge-gradient-${type})`}
                />
                {/* Shimmer overlay */}
                <path
                    d="M12 2L4.5 6.5V11.5C4.5 16.2 7.7 20.6 12 22C16.3 20.6 19.5 16.2 19.5 11.5V6.5L12 2Z"
                    fill={`url(#shimmer-${type})`}
                />
                {/* Checkmark */}
                <path
                    d="M9 12.5L11 14.5L15.5 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            </svg>
        </span>
    );
}
