import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { systemService } from '../../services/systemService';
import { isBackendConfigured } from '../../services/apiClient';

// Phase 1 Specialized Public Components
import { HeroArtwork } from './components/HeroArtwork';
import { HowItWorksWorkflow } from './components/HowItWorksWorkflow';
import { BenefitsSection } from './components/BenefitsSection';
import { ResponsibleAiSection } from './components/ResponsibleAiSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';

import {
  Sparkles,
  ArrowRight,
  Server,
  Layers,
  Database,
  Activity,
  HeartHandshake
} from 'lucide-react';

export function HomePage() {
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (!isBackendConfigured()) {
      setHealthLoading(false);
      return;
    }

    systemService
      .checkHealth()
      .then((res) => {
        if (mounted) {
          setHealthData(res.data);
          setHealthLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setHealthError(err.message);
          setHealthLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex-1 space-y-20 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* 1. Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-6 sm:pt-10 pb-4">
        {/* Left Column: Headline, Supporting Text, and CTAs */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-softTeal/40 bg-softTeal/10 text-softTeal text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Mental Health Practice-Management Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primaryText leading-[1.15]">
            Less time on paperwork. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-softTeal via-calmGreen to-softTeal">
              More time for patient care.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-secondaryText max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Bring appointments, patient information, session documentation and treatment planning together in one organized workspace designed for mental health professionals.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
            <Link to="/get-started">
              <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                Get Started
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="outline" size="lg">
                Explore Services
              </Button>
            </Link>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-secondaryText border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-calmGreen" />
              In-Person & Online Modes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-softTeal" />
              Strict Text/JSON Storage
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-mutedAmber" />
              Human-in-the-Loop Oversight
            </span>
          </div>
        </div>

        {/* Right Column: Hero Artwork with Consultation Vignette and Floating Cards */}
        <div className="lg:col-span-5 w-full">
          <HeroArtwork />
        </div>
      </section>

      {/* 2. About Us Summary Banner */}
      <section className="bg-gradient-to-r from-deepBlueGray to-midnightNavy border border-slate-700/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left max-w-2xl">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <HeartHandshake className="w-4 h-4 text-softTeal" />
            <span className="text-xs font-semibold text-softTeal uppercase tracking-wider">About Psyco AI</span>
          </div>
          <h2 className="text-xl font-bold text-primaryText">Built to Eliminate Clinical Documentation Burnout</h2>
          <p className="text-xs text-secondaryText leading-relaxed">
            Therapy is fundamentally a human relationship. Psyco AI unifies fragmented calendars, intakes, and notes into an organized workspace with zero permanent audio clutter.
          </p>
        </div>
        <Link to="/about" className="shrink-0">
          <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
            Read Our Full Mission
          </Button>
        </Link>
      </section>

      {/* 3. How It Works Section (7-Step Timeline) */}
      <HowItWorksWorkflow />

      {/* 4. Patient and Psychologist Benefits */}
      <BenefitsSection />

      {/* 5. Live Backend Health & Storage Policy Monitor */}
      <section className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-primaryText flex items-center gap-2">
              <Activity className="w-5 h-5 text-softTeal" />
              Live Backend & Integration Status
            </h2>
            <p className="text-xs text-secondaryText">
              Real-time process status returned by Express API server at <code className="text-softTeal">/api/v1/health</code>.
            </p>
          </div>
          <Badge variant={healthData ? 'green' : 'amber'}>
            {healthLoading
              ? 'Checking API...'
              : healthData
              ? 'Backend Connected'
              : !isBackendConfigured()
              ? 'Standalone Mode'
              : 'Backend Offline'}
          </Badge>
        </div>

        {healthLoading ? (
          <Card className="flex items-center justify-center py-10">
            <div className="text-center space-y-2">
              <LoadingSpinner size="md" />
              <p className="text-xs text-secondaryText">Querying backend process metrics...</p>
            </div>
          </Card>
        ) : !isBackendConfigured() ? (
          <Card className="p-6 border-slate-800 bg-slate-900/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-slate-300 font-medium text-sm">
              <Server className="w-4 h-4 text-softTeal" />
              Backend Service Integration Pending
            </div>
            <p className="text-xs text-secondaryText max-w-xl mx-auto">
              This frontend deployment is operating in standalone mode. Backend Express API endpoints and process telemetry will become visible once the backend service is connected.
            </p>
          </Card>
        ) : healthError ? (
          <AlertBanner
            type="warning"
            title="Backend Communication Notice"
            message={healthError}
          />
        ) : healthData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Process Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Server className="w-4 h-4 text-softTeal" />
                  Node.js Runtime
                </CardTitle>
                <Badge variant="teal" size="sm">Node {healthData.process.nodeVersion}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-secondaryText">API Status:</span>
                  <span className="font-semibold text-calmGreen">{healthData.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-secondaryText">Process Uptime:</span>
                  <span className="text-primaryText">{healthData.uptimeSeconds} seconds</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-secondaryText">Heap Memory:</span>
                  <span className="text-primaryText">{healthData.process.memoryUsageMb.heapUsed} MB / {healthData.process.memoryUsageMb.heapTotal} MB</span>
                </div>
              </CardContent>
            </Card>

            {/* Storage Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4 text-calmGreen" />
                  Storage Policy Invariant
                </CardTitle>
                <Badge variant="green" size="sm">Strict Text/JSON</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-secondaryText">Database:</span>
                  <span className="font-semibold text-primaryText">Firebase RTDB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-secondaryText">Binary Storage:</span>
                  <span className="font-semibold text-mutedCoral">Strictly Forbidden</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-secondaryText">Audio Recordings:</span>
                  <span className="font-semibold text-softTeal">Transient Buffers Only</span>
                </div>
              </CardContent>
            </Card>

            {/* External Adapters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-mutedAmber" />
                  Boundary Adapters
                </CardTitle>
                <Badge variant="slate" size="sm">Isolated</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-secondaryText">Google Calendar:</span>
                  <span className="text-secondaryText">Phase 3 Ready</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-secondaryText">AssemblyAI Audio:</span>
                  <span className="text-secondaryText">Phase 5 Ready</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-secondaryText">Gemini Clinical:</span>
                  <span className="text-secondaryText">Phase 6 Ready</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </section>

      {/* 6. Responsible AI & Privacy Section */}
      <ResponsibleAiSection />

      {/* 7. Interactive FAQ & Public Question Submission */}
      <FaqSection />

      {/* 8. Contact Section & Public Inquiry Form */}
      <ContactSection />
    </div>
  );
}
