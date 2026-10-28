import React from 'react';
import { cn } from '../../utils/cn';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-softTeal/20 border-t-softTeal',
        sizeMap[size] || sizeMap.md,
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
