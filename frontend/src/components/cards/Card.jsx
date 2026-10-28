import React from 'react';
import { cn } from '../../utils/cn';

export function Card({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-deepBlueGray/80 border border-slate-700/70 rounded-xl p-5 shadow-sm transition-all duration-150',
        hoverEffect && 'hover:border-softTeal/40 hover:shadow-md cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={cn('flex items-center justify-between pb-3 mb-4 border-b border-slate-700/50', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={cn('text-base font-semibold text-primaryText tracking-tight', className)}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={cn('text-xs text-secondaryText mt-0.5', className)}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}
