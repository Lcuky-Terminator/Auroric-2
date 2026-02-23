'use client';

import React from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/user-avatar';
import { X, Users } from 'lucide-react';
import { useApp } from '@/lib/app-context';

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: 'Followers' | 'Following';
    userIds: string[];
}

export default function FollowListModal({ isOpen, onClose, title, userIds }: FollowListModalProps) {
    const { getUser } = useApp();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-card border border-border/50 rounded-2xl w-full max-w-md mx-4 animate-slideUp relative max-h-[70vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/30">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-accent" />
                        {title}
                        <span className="text-sm font-normal text-foreground/50 ml-1">({userIds.length})</span>
                    </h2>
                    <button onClick={onClose} aria-label="Close" className="text-foreground/60 hover:text-foreground smooth-transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {userIds.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-10 h-10 text-foreground/15 mx-auto mb-3" />
                            <p className="text-foreground/40 text-sm">
                                {title === 'Followers' ? 'No followers yet' : 'Not following anyone yet'}
                            </p>
                        </div>
                    ) : (
                        userIds.map(userId => {
                            const user = getUser(userId);
                            if (!user) return null;
                            return (
                                <Link
                                    key={userId}
                                    href={`/user/${user.username}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-card/50 smooth-transition"
                                >
                                    <UserAvatar userId={user.id} displayName={user.displayName} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate">{user.displayName}</p>
                                        <p className="text-xs text-foreground/50 truncate">@{user.username}</p>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
