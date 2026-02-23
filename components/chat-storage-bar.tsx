'use client';

import React, { useEffect, useState } from 'react';
import { HardDrive, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

interface StorageData {
    usedBytes: number;
    limitBytes: number;
    percentage: number;
    isVerified: boolean;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Chat Storage Progress Bar for the Settings panel.
 * Shows usage, warning at 80%, critical at 95%, and upsell prompt.
 */
export default function ChatStorageBar() {
    const [data, setData] = useState<StorageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStorage() {
            try {
                const res = await fetch('/api/messages/storage');
                if (!res.ok) throw new Error('Failed to load');
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchStorage();
    }, []);

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-48 bg-foreground/10 rounded" />
                <div className="h-3 w-full bg-foreground/10 rounded-full" />
                <div className="h-3 w-32 bg-foreground/10 rounded" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-foreground/50 text-sm">
                Unable to load storage data.
            </div>
        );
    }

    const { usedBytes, limitBytes, percentage, isVerified } = data;

    // Determine state
    const isWarning = percentage >= 80 && percentage < 95;
    const isCritical = percentage >= 95;
    const showUpsell = percentage >= 80 && !isVerified;

    // Progress bar color
    const barColor = isCritical
        ? 'bg-gradient-to-r from-red-500 to-red-400'
        : isWarning
            ? 'bg-gradient-to-r from-amber-500 to-amber-400'
            : 'bg-gradient-to-r from-accent to-accent/80';

    const barBg = isCritical
        ? 'bg-red-500/10'
        : isWarning
            ? 'bg-amber-500/10'
            : 'bg-foreground/5';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-foreground/60" />
                    <span className="font-semibold text-foreground">Chat Storage</span>
                </div>
                <span className={`text-sm font-medium ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-foreground/60'}`}>
                    {percentage}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className={`w-full h-3 rounded-full ${barBg} overflow-hidden`}>
                <div
                    className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            {/* Usage Text */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/60">
                    {formatBytes(usedBytes)} / {formatBytes(limitBytes)} used
                </span>
                {isVerified && (
                    <span className="flex items-center gap-1 text-accent text-xs">
                        <Sparkles className="w-3 h-3" /> Pro Storage
                    </span>
                )}
            </div>

            {/* Warning message */}
            {isWarning && !isCritical && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-200">
                        You&apos;re running low on chat storage. Oldest messages will be auto-deleted when full.
                    </p>
                </div>
            )}

            {/* Critical message */}
            {isCritical && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-200">
                        Storage almost full! Your oldest messages are being automatically deleted to make room.
                    </p>
                </div>
            )}

            {/* Upsell Prompt */}
            {showUpsell && (
                <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 via-background to-accent/10 p-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-accent" />
                            <h4 className="font-bold text-foreground">Unlock More Storage</h4>
                        </div>
                        <p className="text-sm text-foreground/60 mb-4">
                            Switch to <span className="text-accent font-semibold">Pro</span> or{' '}
                            <span className="text-accent font-semibold">Get Verified</span> to upgrade
                            from 3 MB to 10 MB of chat storage.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button className="luxury-button text-sm px-4 py-2 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" /> Upgrade to Pro
                            </button>
                            <a
                                href="mailto:support@auroric.com?subject=Storage%20Upgrade%20Inquiry"
                                className="luxury-button-outline text-sm px-4 py-2 inline-flex items-center gap-1.5"
                            >
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
