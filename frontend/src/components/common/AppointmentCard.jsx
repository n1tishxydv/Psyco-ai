import React from 'react';
import { Card, CardContent } from '../cards/Card';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { InitialsAvatar } from './InitialsAvatar';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  RefreshCw,
  XCircle,
  FileText,
} from 'lucide-react';

export function AppointmentCard({
  appointment,
  onCancel,
  onReschedule,
  showActions = true,
  className = '',
}) {
  if (!appointment) return null;

  const {
    id,
    psychologistName,
    psychologistLicense,
    date,
    startTime,
    endTime,
    sessionMode,
    mode,
    status = 'pending',
    meetingLink,
    location,
    clinicAddress,
    reason,
  } = appointment;

  const consultationMode = sessionMode || mode || 'in_person';
  const isOnline = consultationMode === 'online' || consultationMode === 'video';
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const isConfirmed = status === 'confirmed';

  // Format date readable
  let displayDate = date;
  if (date) {
    try {
      const parsed = new Date(date + 'T00:00:00');
      displayDate = parsed.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      displayDate = date;
    }
  }

  return (
    <Card className={`border-slate-800 bg-deepBlueGray/80 hover:border-slate-700/80 transition-all ${className}`}>
      <CardContent className="p-5 space-y-4">
        {/* Top: Clinician Info & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <InitialsAvatar
              name={psychologistName || 'Clinical Psychologist'}
              size="md"
              className="border border-slate-700"
            />
            <div>
              <h4 className="text-sm font-semibold text-slate-100">
                {psychologistName || 'Clinical Psychologist'}
              </h4>
              <p className="text-xs text-slate-400">
                {psychologistLicense ? `Lic: ${psychologistLicense}` : 'Licensed Clinical Care'}
              </p>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>

        {/* Middle: Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-softTeal shrink-0" />
            <span>{displayDate || 'Date to be scheduled'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-softTeal shrink-0" />
            <span>
              {startTime ? `${startTime} - ${endTime || 'Session'}` : 'Time to be scheduled'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            {isOnline ? (
              <Video className="w-4 h-4 text-softTeal shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 text-softTeal shrink-0" />
            )}
            <span className="truncate">
              {isOnline
                ? 'Telehealth Consultation (Secure Encrypted Video)'
                : location || (clinicAddress ? `${clinicAddress.city}, ${clinicAddress.state}` : 'Clinic Consultation')}
            </span>
          </div>

          {reason && (
            <div className="flex items-start gap-2 sm:col-span-2 pt-1 text-slate-400">
              <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2 italic">“{reason}”</span>
            </div>
          )}
        </div>

        {/* Telehealth Link if Confirmed */}
        {isOnline && isConfirmed && meetingLink && (
          <div className="p-3 rounded-xl bg-softTeal/10 border border-softTeal/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-softTeal truncate">
              <Video className="w-4 h-4 shrink-0" />
              <span className="truncate">Google Meet Room Ready</span>
            </div>
            <a
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-softTeal text-slate-950 text-xs font-semibold hover:bg-softTeal/90 transition-colors shrink-0"
            >
              <span>Join Call</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Action Controls */}
        {showActions && !isCancelled && !isCompleted && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            {onReschedule && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReschedule(appointment)}
                className="text-xs flex items-center gap-1.5 text-slate-300 hover:text-slate-100"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule
              </Button>
            )}

            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(appointment)}
                className="text-xs flex items-center gap-1.5 text-mutedCoral/80 hover:text-mutedCoral hover:bg-mutedCoral/10"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AppointmentCard;
