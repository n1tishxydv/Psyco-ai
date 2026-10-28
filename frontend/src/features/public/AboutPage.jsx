import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  HeartHandshake,
  Database,
  Brain,
  ShieldCheck,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  Layers
} from 'lucide-react';

export function AboutPage() {
  return (
    <div className="flex-1 max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Page Heading */}
      <div className="space-y-3 text-center">
        <Badge variant="teal">Our Mission & Design Philosophy</Badge>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-primaryText">
          Reimagining Clinical Ergonomics for Mental Health
        </h1>
        <p className="text-sm sm:text-base text-secondaryText max-w-2xl mx-auto leading-relaxed">
          Psyco AI was conceived to resolve a critical paradox in modern mental healthcare: practitioners enter the field to care for human minds, yet spend up to a third of their professional lives burdened by disconnected administrative paperwork.
        </p>
      </div>

      {/* The Problem & Solution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-deepBlueGray/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-mutedAmber" />
              <CardTitle className="text-base">The Challenge of Disconnected Workflows</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-secondaryText space-y-2.5 leading-relaxed">
            <p>
              In many psychological practices today, scheduling calendars, clinical intake surveys, session note scribbles, and treatment goals reside in three or four isolated software tools.
            </p>
            <p>
              This fragmentation causes mental fatigue, scheduling errors, lack of buffer times between difficult sessions, and delayed clinical documentation.
            </p>
            <p>
              Patients, in turn, face opaque booking mechanisms, repetitive clipboard intake questionnaires, and little to no visibility into their therapeutic progression.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-deepBlueGray/70 border-softTeal/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-softTeal" />
              <CardTitle className="text-base">The Psyco AI Approach</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-secondaryText space-y-2.5 leading-relaxed">
            <p>
              Psyco AI unifies scheduling, patient intake, standardized clinical notes (SOAP/DAP), and treatment plans into one cohesive, calm digital environment.
            </p>
            <p>
              We treat in-person consultation as the primary, natural default mode, while seamlessly provisioning secure Google Meet video rooms for telehealth sessions.
            </p>
            <p>
              By removing friction from intake to sign-off, clinicians regain focus, and patients experience a dignified, organized healthcare journey.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4 Pillars of Product Design */}
      <div className="space-y-6 pt-4">
        <h2 className="text-2xl font-bold text-primaryText text-center">
          The Four Architectural Pillars
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-softTeal/15 text-softTeal">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">1. Human-Centered Practice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-secondaryText leading-relaxed">
              Software must support the therapeutic alliance, never intrude upon it. The platform stays out of the way during consultations and provides quiet, reliable ergonomics outside the session.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-calmGreen/15 text-calmGreen">
                  <Database className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">2. Zero Binary Storage Invariant</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-secondaryText leading-relaxed">
              We reject the practice of archiving hours of raw therapy audio or video recordings. All persistent records are structured text/JSON in Firebase Realtime Database. Any future ambient speech-to-text uses transient streaming buffers in memory.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-mutedAmber/15 text-mutedAmber">
                  <Brain className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">3. Human-in-the-Loop AI</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-secondaryText leading-relaxed">
              AI is an assistant, not a clinician. AI-generated notes, summaries, and treatment plan suggestions are strictly drafts that must be reviewed, edited, and digitally signed by the licensed psychologist.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-700/50 text-slate-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">4. Isolated Clinical Governance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-secondaryText leading-relaxed">
              System administrators verify credentials and monitor system health, but are barred by Relationship-Based Access Control from accessing patient therapy notes or private transcripts.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation CTA Banner */}
      <div className="bg-gradient-to-r from-deepBlueGray to-midnightNavy border border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-primaryText">Ready to Explore How It Works?</h3>
          <p className="text-xs text-secondaryText max-w-xl">
            Examine our connected 7-step clinical workflow from patient appointment discovery to final signed documentation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/services">
            <Button variant="outline" size="md">
              View Services
            </Button>
          </Link>
          <Link to="/get-started">
            <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
