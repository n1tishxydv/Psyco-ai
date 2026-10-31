import React from 'react';
import { cn } from '../../utils/cn';

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80',
        className
      )}
    >
      <div className="space-y-1.5">
        {badge && <div className="mb-1">{badge}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
