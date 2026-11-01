import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = null,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-psyco-steel bg-psyco-darkNavy/50',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-psyco-slate border border-psyco-steel flex items-center justify-center text-psyco-softGrey mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-base font-semibold text-psyco-softGrey mb-1">{title}</h4>
      <p className="text-sm text-psyco-coolGrey max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
