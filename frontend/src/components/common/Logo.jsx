import React from 'react';
import { cn } from '../../utils/cn';

export function Logo({
  variant = 'full', // 'full' | 'symbol' | 'wordmark'
  size = 'md',     // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const sizeMap = {
    sm: { symbol: 'w-6 h-6', text: 'text-base', badge: 'text-[9px] px-1 py-0.2' },
    md: { symbol: 'w-8 h-8', text: 'text-xl', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { symbol: 'w-10 h-10', text: 'text-2xl', badge: 'text-xs px-2 py-0.5' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const symbolElement = (
    <div className={cn('relative flex items-center justify-center shrink-0', currentSize.symbol)}>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="psycoGradient" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#79CBB8" />
            <stop offset="1" stopColor="#2D8276" />
          </linearGradient>
        </defs>

        {/* Primary therapeutic speech bubble */}
        <path
          d="M7 13C7 9.13401 10.134 6 14 6H20C23.866 6 27 9.13401 27 13V17C27 20.866 23.866 24 20 24H15L9 29V23.5C7.75545 22.3486 7 20.7327 7 19V13Z"
          fill="#172536"
          stroke="url(#psycoGradient)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Continuous human-centered neural / empathy curve */}
        <path
          d="M12 15.5C14.5 11 18 20 21.5 14.5C22.8 12.5 24.5 14 25 15.5"
          stroke="#79CBB8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Empathy node */}
        <circle cx="18" cy="15.8" r="1.6" fill="#79CBB8" />
      </svg>
    </div>
  );

  const textElement = (
    <div className="flex items-center gap-1.5 font-sans tracking-tight select-none">
      <span className={cn('font-bold text-primaryText dark:text-primaryText light:text-light-textPrimary', currentSize.text)}>
        Psyco
      </span>
      <span
        className={cn(
          'font-semibold uppercase tracking-wider rounded-md border border-softTeal/40 bg-softTeal/10 text-softTeal',
          currentSize.badge
        )}
      >
        AI
      </span>
    </div>
  );

  if (variant === 'symbol') {
    return <div className={cn('inline-flex items-center', className)}>{symbolElement}</div>;
  }

  if (variant === 'wordmark') {
    return <div className={cn('inline-flex items-center', className)}>{textElement}</div>;
  }

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      {symbolElement}
      {textElement}
    </div>
  );
}
