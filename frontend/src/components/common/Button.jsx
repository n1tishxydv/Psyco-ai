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
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-psyco-softGrey/70 focus-visible:ring-offset-2 focus-visible:ring-offset-psyco-deepNavy active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-psyco-softGrey hover:bg-white text-psyco-deepNavy font-semibold shadow-sm hover:shadow-md border border-psyco-softGrey active:bg-psyco-softGrey/90',
    secondary:
      'bg-psyco-slate hover:bg-psyco-steel/50 text-psyco-softGrey border border-psyco-steel shadow-sm',
    outline:
      'bg-transparent hover:bg-psyco-slate/50 text-psyco-softGrey border border-psyco-steel hover:border-psyco-coolGrey',
    ghost:
      'bg-transparent hover:bg-psyco-slate/40 text-psyco-coolGrey hover:text-psyco-softGrey',
    danger:
      'bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-700/60',
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
