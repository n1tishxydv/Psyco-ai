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
        'bg-psyco-slate border border-psyco-steel/70 rounded-2xl p-5 shadow-sm transition-all duration-150',
        hoverEffect && 'hover:border-psyco-coolGrey/50 hover:shadow-md cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={cn('flex items-center justify-between pb-3 mb-4 border-b border-psyco-steel/50', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={cn('text-base font-semibold text-psyco-softGrey tracking-tight', className)}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={cn('text-xs text-psyco-coolGrey mt-0.5', className)}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}
