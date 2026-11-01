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
      style: 'bg-psyco-slate/60 border-psyco-steel text-psyco-softGrey',
      titleColor: 'text-psyco-softGrey',
    },
    success: {
      icon: CheckCircle,
      style: 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300',
      titleColor: 'text-emerald-200',
    },
    warning: {
      icon: AlertTriangle,
      style: 'bg-amber-950/40 border-amber-700/50 text-amber-300',
      titleColor: 'text-amber-200',
    },
    error: {
      icon: AlertCircle,
      style: 'bg-red-950/40 border-red-700/50 text-red-300',
      titleColor: 'text-red-200',
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
        {message && <p className="text-psyco-coolGrey text-xs leading-relaxed">{message}</p>}
      </div>
    </div>
  );
}
