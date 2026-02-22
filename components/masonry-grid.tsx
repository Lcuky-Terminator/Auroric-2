'use client';

import React from 'react';

interface MasonryGridProps {
  children: React.ReactNode[];
  columns?: number;
}

export default function MasonryGrid({ children, columns = 4 }: MasonryGridProps) {
  // Distribute children into columns
  const columnArrays: React.ReactNode[][] = Array.from({ length: columns }, () => []);

  React.Children.forEach(children, (child, index) => {
    columnArrays[index % columns].push(child);
  });

  return (
    <div className="flex gap-4 w-full">
      {columnArrays.map((col, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-4 min-w-0">
          {col.map((child, childIdx) => (
            <div key={childIdx} className={`animate-slideUp masonry-delay-${Math.min(childIdx, 9)}`}>
              {child}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
