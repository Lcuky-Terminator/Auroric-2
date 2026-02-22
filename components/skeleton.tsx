'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'image';
}

export default function Skeleton({
  className = '',
  variant = 'card',
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-card/50 via-card to-card/50 animate-pulse';

  const variantClasses = {
    card: 'rounded-2xl h-64 w-full',
    text: 'rounded-lg h-4 w-full',
    circle: 'rounded-full w-8 h-8',
    image: 'rounded-lg h-40 w-full',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton variant="card" />
        </div>
      ))}
    </div>
  );
}
