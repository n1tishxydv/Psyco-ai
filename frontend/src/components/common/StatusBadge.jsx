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
      variant: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50',
      icon: CheckCircle2,
    },
    pending: {
      label: 'Pending Approval',
      variant: 'bg-amber-950/40 text-amber-300 border-amber-700/50',
      icon: Clock,
    },
    pending_verification: {
      label: 'Pending Verification',
      variant: 'bg-amber-950/40 text-amber-300 border-amber-700/50',
      icon: Clock,
    },
    completed: {
      label: 'Completed',
      variant: 'bg-psyco-slate text-psyco-softGrey border-psyco-steel',
      icon: CalendarCheck,
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'bg-red-950/40 text-red-300 border-red-700/50',
      icon: XCircle,
    },
    rescheduled: {
      label: 'Rescheduled',
      variant: 'bg-amber-950/40 text-amber-300 border-amber-700/50',
      icon: RefreshCw,
    },
    // Profiles & Verification
    approved: {
      label: 'Verified Clinician',
      variant: 'bg-psyco-slate text-psyco-softGrey border-psyco-steel',
      icon: ShieldCheck,
    },
    active: {
      label: 'Active',
      variant: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50',
      icon: CheckCircle2,
    },
    suspended: {
      label: 'Suspended',
      variant: 'bg-red-950/40 text-red-300 border-red-700/50',
      icon: AlertCircle,
    },
    // Intake
    submitted: {
      label: 'Intake Completed',
      variant: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50',
      icon: CheckCircle2,
    },
    draft: {
      label: 'Draft in Progress',
      variant: 'bg-amber-950/40 text-amber-300 border-amber-700/50',
      icon: FileText,
    },
    not_started: {
      label: 'Not Started',
      variant: 'bg-psyco-slate text-psyco-coolGrey border-psyco-steel',
      icon: AlertCircle,
    },
  };

  const current = config[normalized] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    variant: 'bg-psyco-slate text-psyco-coolGrey border-psyco-steel',
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
