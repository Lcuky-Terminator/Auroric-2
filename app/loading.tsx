'use client';

import Skeleton, { SkeletonGrid } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Skeleton className="w-32 h-8" variant="text" />
          <div className="flex gap-4">
            <Skeleton className="w-32 h-8" variant="text" />
            <Skeleton className="w-10 h-10" variant="circle" />
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <section className="w-full bg-gradient-to-b from-card/30 to-background py-20 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="w-64 h-12 mb-4" variant="text" />
          <Skeleton className="w-full h-20 mb-4" variant="text" />
          <div className="flex gap-4">
            <Skeleton className="w-48 h-10" variant="text" />
            <Skeleton className="w-48 h-10" variant="text" />
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <main className="flex-1 w-full py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="w-48 h-8 mb-8" variant="text" />
          <SkeletonGrid count={6} />
        </div>
      </main>
    </div>
  );
}
