'use client';

import React from 'react';
import { getInitials, generateAvatarColor } from '@/lib/helpers';

interface UserAvatarProps {
  userId?: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-32 h-32 text-5xl',
};

export default function UserAvatar({ userId = '', displayName, size = 'md', className = '' }: UserAvatarProps) {
  const gradient = generateAvatarColor(userId);
  const initials = getInitials(displayName);

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
