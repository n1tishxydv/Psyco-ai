import React from 'react';
import { cn } from '../../utils/cn';
import {
  Clock,
  CheckCircle2,
  CalendarCheck,
  XCircle,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';

export function StatusBadge({ status, size = 'sm', className = '' }) {
  const normalized = (status || '').toLowerCase().trim();

  const config = {
    // Appointments
    confirmed: {
      label: 'Confirmed',
      variant: 'bg-calmGreen/15 text-calmGreen border-calmGreen/30',
      icon: CheckCircle2,
    },
    pending: {
      label: 'Pending Approval',
      variant: 'bg-mutedAmber/15 text-mutedAmber border-mutedAmber/30',
      icon: Clock,
    },
    pending_verification: {
      label: 'Pending Verification',
      variant: 'bg-mutedAmber/15 text-mutedAmber border-mutedAmber/30',
      icon: Clock,
    },
    completed: {
      label: 'Completed',
      variant: 'bg-softTeal/15 text-softTeal border-softTeal/30',
      icon: CalendarCheck,
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'bg-mutedCoral/15 text-mutedCoral border-mutedCoral/30',
      icon: XCircle,
    },
    rescheduled: {
      label: 'Rescheduled',
      variant: 'bg-mutedAmber/15 text-mutedAmber border-mutedAmber/30',
      icon: RefreshCw,
    },
    // Profiles & Verification
    approved: {
      label: 'Verified Clinician',
      variant: 'bg-softTeal/15 text-softTeal border-softTeal/30',
      icon: ShieldCheck,
    },
    active: {
      label: 'Active',
      variant: 'bg-calmGreen/15 text-calmGreen border-calmGreen/30',
      icon: CheckCircle2,
    },
    suspended: {
      label: 'Suspended',
      variant: 'bg-mutedCoral/15 text-mutedCoral border-mutedCoral/30',
      icon: AlertCircle,
    },
    // Intake
    submitted: {
      label: 'Intake Completed',
      variant: 'bg-calmGreen/15 text-calmGreen border-calmGreen/30',
      icon: CheckCircle2,
    },
    draft: {
      label: 'Draft in Progress',
      variant: 'bg-mutedAmber/15 text-mutedAmber border-mutedAmber/30',
      icon: FileText,
    },
    not_started: {
      label: 'Not Started',
      variant: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: AlertCircle,
    },
  };

  const current = config[normalized] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    variant: 'bg-slate-800 text-slate-400 border-slate-700',
    icon: AlertCircle,
  };

  const Icon = current.icon;
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border capitalize leading-none tracking-tight',
        current.variant,
        sizeClasses,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
}

export default StatusBadge;
