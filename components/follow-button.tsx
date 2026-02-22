'use client';

import React from 'react';
import { UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  isFollowing?: boolean;
  onToggle?: () => void;
  variant?: 'filled' | 'outline';
}

export default function FollowButton({
  isFollowing = false,
  onToggle,
  variant = 'filled',
}: FollowButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold smooth-transition ${
        isFollowing
          ? variant === 'filled'
            ? 'bg-accent/20 text-accent border border-accent/50 hover:bg-accent/30'
            : 'bg-transparent border-2 border-accent text-accent hover:bg-accent/10'
          : variant === 'filled'
          ? 'bg-accent text-accent-foreground hover:shadow-lg'
          : 'border-2 border-accent text-accent hover:bg-accent/10'
      }`}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  );
}
