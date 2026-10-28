import React from 'react';
import { Calendar, Clock, UserCheck, FileText, Activity, MapPin, Sparkles } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

export function HeroArtwork() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none flex items-center justify-center select-none py-6">
      {/* Background radial glow */}
      <div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-deepJade/15 blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Main Illustration Canvas */}
      <div className="relative w-full aspect-square max-w-[480px] bg-gradient-to-b from-deepBlueGray/90 to-midnightNavy border border-slate-700/60 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Subtle decorative grid background */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#1D3042_1px,transparent_1px),linear-gradient(to_bottom,#1D3042_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"
          aria-hidden="true"
        />

        {/* Central Vector Consultation Vignette */}
        <div className="relative z-0 flex items-center justify-center my-auto py-4">
          <svg
            viewBox="0 0 320 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-[300px] h-auto drop-shadow-md"
            aria-label="Illustration of psychologist and patient in clinical consultation"
          >
            {/* Calm therapy room base elements */}
            <circle cx="160" cy="100" r="85" fill="#172536" stroke="#2D8276" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M40 160H280" stroke="#1D3042" strokeWidth="2" strokeLinecap="round" />

            {/* Ambient Room Lamp & Plant */}
            <path d="M60 160V120M50 120H70L65 105H55L50 120Z" fill="#1D3042" stroke="#E6B96C" strokeWidth="1.2" />
            <circle cx="60" cy="112" r="3" fill="#E6B96C" opacity="0.8" />
            <path d="M260 160V135M250 135C255 125 265 125 270 135M255 130C260 118 268 122 268 135" stroke="#65B891" strokeWidth="1.5" strokeLinecap="round" />

            {/* Psychologist Figure (Left) */}
            <circle cx="110" cy="90" r="14" fill="#1D3042" stroke="#79CBB8" strokeWidth="1.5" />
            <path d="M92 135C92 118 100 112 110 112C120 112 128 118 128 135" fill="#172536" stroke="#2D8276" strokeWidth="2" />
            {/* Clinician Notepad */}
            <rect x="114" y="120" width="18" height="22" rx="2" fill="#1D3042" stroke="#79CBB8" strokeWidth="1.2" transform="rotate(-10 114 120)" />
            <line x1="118" y1="126" x2="128" y2="124" stroke="#79CBB8" strokeWidth="1" />
            <line x1="119" y1="131" x2="127" y2="129" stroke="#79CBB8" strokeWidth="1" />

            {/* Patient Figure (Right) */}
            <circle cx="210" cy="90" r="14" fill="#1D3042" stroke="#65B891" strokeWidth="1.5" />
            <path d="M192 135C192 118 200 112 210 112C220 112 228 118 228 135" fill="#172536" stroke="#65B891" strokeWidth="2" />

            {/* Therapeutic Dialogue Arc */}
            <path
              d="M132 82C150 68 170 68 188 82"
              stroke="#79CBB8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 4"
            />
            {/* Empathy pulse icon in center */}
            <circle cx="160" cy="74" r="5" fill="#2D8276" />
            <circle cx="160" cy="74" r="2.5" fill="#79CBB8" />
          </svg>
        </div>

        {/* Floating Card 1: Today's Appointments (Top Left) */}
        <div className="absolute top-4 left-4 z-10 bg-midnightNavy/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-lg max-w-[200px] transition-transform duration-300 hover:scale-105">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-softTeal/15 text-softTeal">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-semibold text-primaryText">Today's Schedule</span>
          </div>
          <p className="text-[10px] text-secondaryText leading-tight">4 Sessions Confirmed</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge variant="teal" size="sm">2 In-Person</Badge>
            <Badge variant="slate" size="sm">2 Online</Badge>
          </div>
        </div>

        {/* Floating Card 2: Upcoming Session (Top Right) */}
        <div className="absolute top-6 right-4 z-10 bg-midnightNavy/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-lg max-w-[190px] transition-transform duration-300 hover:scale-105">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-mutedAmber" />
            <span className="text-[11px] font-semibold text-primaryText">Next Consultation</span>
          </div>
          <p className="text-[11px] font-medium text-softTeal">10:30 AM (IST)</p>
          <div className="flex items-center gap-1 text-[10px] text-secondaryText mt-1">
            <MapPin className="w-3 h-3 text-calmGreen" />
            <span>In-Person Consultation</span>
          </div>
        </div>

        {/* Floating Card 3: Patient Intake Status (Bottom Left) */}
        <div className="absolute bottom-5 left-4 z-10 bg-midnightNavy/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-lg max-w-[195px] transition-transform duration-300 hover:scale-105">
          <div className="flex items-center gap-1.5 mb-1">
            <UserCheck className="w-3.5 h-3.5 text-calmGreen" />
            <span className="text-[11px] font-semibold text-primaryText">Patient Intake</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-secondaryText">
            <span>Questionnaire</span>
            <span className="text-calmGreen font-medium">Submitted</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5">
            <div className="bg-calmGreen h-1.5 rounded-full w-full" />
          </div>
        </div>

        {/* Floating Card 4: Session Notes Draft (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-10 bg-midnightNavy/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-lg max-w-[200px] transition-transform duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-softTeal" />
              <span className="text-[11px] font-semibold text-primaryText">Clinical Note</span>
            </div>
            <Badge variant="amber" size="sm">Draft</Badge>
          </div>
          <p className="text-[10px] text-secondaryText leading-tight">
            SOAP format • Awaiting clinician sign-off
          </p>
        </div>
      </div>
    </div>
  );
}
