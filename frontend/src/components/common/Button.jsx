import React from 'react';
import { cn } from '../../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md',         // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-softTeal focus-visible:ring-offset-2 focus-visible:ring-offset-midnightNavy active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-deepJade hover:bg-opacity-90 text-primaryText shadow-sm hover:shadow-md border border-deepJade/40',
    secondary:
      'bg-elevatedSlate hover:bg-slate-700/60 text-primaryText border border-slate-700',
    outline:
      'bg-transparent hover:bg-elevatedSlate/40 text-softTeal border border-softTeal/40 hover:border-softTeal',
    ghost:
      'bg-transparent hover:bg-elevatedSlate/50 text-secondaryText hover:text-primaryText',
    danger:
      'bg-mutedCoral/20 hover:bg-mutedCoral/30 text-mutedCoral border border-mutedCoral/40 hover:border-mutedCoral',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="text-current" />
          <span className="opacity-90">{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}
