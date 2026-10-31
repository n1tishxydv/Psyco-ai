import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../cards/Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { InitialsAvatar } from './InitialsAvatar';
import {
  MapPin,
  Video,
  Languages,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function PsychologistCard({ psychologist, onSelectProfile, className = '' }) {
  if (!psychologist) return null;

  const {
    uid,
    id,
    fullName = 'Licensed Clinician',
    licenseNumber,
    bio,
    specializations = [],
    qualifications = [],
    languages = ['English'],
    offeredModes = 'both',
    clinicAddress,
  } = psychologist;

  const clinicianId = uid || id;
  const isOnline = offeredModes === 'online' || offeredModes === 'both';
  const isInPerson = offeredModes === 'in_person' || offeredModes === 'both';

  return (
    <Card className={`border-slate-800 bg-deepBlueGray/80 hover:border-softTeal/40 hover:shadow-lg transition-all flex flex-col justify-between ${className}`}>
      <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header & Verification */}
          <div className="flex items-start gap-4">
            <InitialsAvatar
              name={fullName}
              size="lg"
              className="rounded-2xl border-2 border-slate-700 shadow-sm shrink-0"
            />
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 truncate">
                  {fullName}
                </h3>
                <Badge variant="teal" size="sm" className="shrink-0 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-softTeal" />
                  <span>Verified</span>
                </Badge>
              </div>

              <p className="text-xs text-softTeal font-medium">
                {licenseNumber ? `License: ${licenseNumber}` : 'Licensed Clinical Psychologist'}
              </p>

              {qualifications && qualifications.length > 0 && (
                <p className="text-[11px] text-slate-400 truncate">
                  {qualifications.join(' • ')}
                </p>
              )}
            </div>
          </div>

          {/* Bio Snippet */}
          {bio && (
            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
              {bio}
            </p>
          )}

          {/* Specializations Tags */}
          {specializations && specializations.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Clinical Focus & Methods
              </span>
              <div className="flex flex-wrap gap-1.5">
                {specializations.slice(0, 4).map((spec, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    {spec}
                  </span>
                ))}
                {specializations.length > 4 && (
                  <span className="text-[11px] px-1.5 py-0.5 text-slate-400">
                    +{specializations.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Consultation Modes & Languages */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              {offeredModes === 'online' ? (
                <Video className="w-3.5 h-3.5 text-softTeal shrink-0" />
              ) : offeredModes === 'in_person' ? (
                <MapPin className="w-3.5 h-3.5 text-softTeal shrink-0" />
              ) : (
                <span className="flex items-center gap-1 text-softTeal">
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                </span>
              )}
              <span className="truncate">
                {offeredModes === 'both'
                  ? 'Video & Clinic'
                  : offeredModes === 'online'
                  ? 'Video Only'
                  : 'Clinic Only'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <Languages className="w-3.5 h-3.5 text-softTeal shrink-0" />
              <span className="truncate">
                {languages && languages.length > 0 ? languages.join(', ') : 'English'}
              </span>
            </div>

            {clinicAddress?.city && (
              <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Clinic: {clinicAddress.city}, {clinicAddress.state}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
          {onSelectProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectProfile(psychologist)}
              className="text-xs text-slate-300 hover:text-slate-100 flex-1"
            >
              View Profile
            </Button>
          )}

          <Link to={`/book/${clinicianId}`} className="flex-1">
            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Book Consult
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default PsychologistCard;
