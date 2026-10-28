import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export function AlertBanner({
  type = 'info', // 'info' | 'success' | 'warning' | 'error'
  title,
  message,
  className = '',
}) {
  const configs = {
    info: {
      icon: Info,
      style: 'bg-softTeal/10 border-softTeal/30 text-softTeal',
      titleColor: 'text-primaryText',
    },
    success: {
      icon: CheckCircle,
      style: 'bg-calmGreen/10 border-calmGreen/30 text-calmGreen',
      titleColor: 'text-primaryText',
    },
    warning: {
      icon: AlertTriangle,
      style: 'bg-mutedAmber/10 border-mutedAmber/30 text-mutedAmber',
      titleColor: 'text-primaryText',
    },
    error: {
      icon: AlertCircle,
      style: 'bg-mutedCoral/10 border-mutedCoral/30 text-mutedCoral',
      titleColor: 'text-primaryText',
    },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-sm',
        config.style,
        className
      )}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        {title && <h5 className={cn('font-semibold', config.titleColor)}>{title}</h5>}
        {message && <p className="text-secondaryText text-xs leading-relaxed">{message}</p>}
      </div>
    </div>
  );
}
