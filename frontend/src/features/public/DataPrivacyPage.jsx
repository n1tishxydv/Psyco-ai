import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { ShieldCheck, Lock, Database, AlertCircle, FileText } from 'lucide-react';

export function DataPrivacyPage() {
  return (
    <div className="flex-1 max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="space-y-2 text-center">
        <Badge variant="teal">Data Governance</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-primaryText">
          Data Architecture & Clinical Privacy Information
        </h1>
        <p className="text-xs text-secondaryText">
          Architectural data controls and storage invariants for Psyco AI.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-5 h-5 text-softTeal" />
              1. The Strict Zero-Binary-Storage Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-secondaryText space-y-2 leading-relaxed">
            <p>
              Unlike conventional telehealth platforms that archive hours of high-definition video or audio files, Psyco AI is engineered on an absolute <strong>Zero Binary Media Invariant</strong>.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>No permanent audio or video recording archives exist on the platform.</li>
              <li>Future ambient transcription (Phase 5) uses transient, encrypted streaming buffers that are purged from memory immediately upon transcript text extraction.</li>
              <li>No image uploads or raw audio files are stored in the database.</li>
              <li>Authoritative clinical records and reports are stored solely in structured text/JSON form in Firebase Realtime Database.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-calmGreen" />
              2. Relationship-Based Access Control (ReBAC)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-secondaryText space-y-2 leading-relaxed">
            <p>
              Access to patient records is strictly governed by verified therapeutic relationships:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Patients may only view their personal profile, submitted intake forms, and clinician-shared goals.</li>
              <li>Psychologists may only view clinical notes for patients explicitly assigned to their practice.</li>
              <li><strong>Administrative accounts are mathematically barred</strong> from querying or viewing private therapy session notes and transcripts.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-mutedAmber" />
              3. Types of Stored Data
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-secondaryText space-y-2 leading-relaxed">
            <p>
              The platform stores structured text records required for clinical practice management:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Demographic Information:</strong> Patient name, contact email, gender, age, and emergency contact details.</li>
              <li><strong>Scheduling Records:</strong> Appointment timestamps (UTC), consultation modes (in-person or online), and booking statuses.</li>
              <li><strong>Clinical Documentation:</strong> SOAP/DAP notes, version history, diagnostic codes (ICD-11/DSM-5), and treatment plan goals.</li>
              <li><strong>Audit Trail:</strong> Append-only security audit events capturing actor ID, timestamp, and action without recording sensitive note contents.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Regulatory Disclaimer */}
        <div className="bg-midnightNavy/90 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-secondaryText">
          <AlertCircle className="w-4 h-4 text-mutedAmber shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-primaryText">Note on Legal & Compliance Jurisdiction:</strong> This page represents an architectural specification. Final compliance with specific jurisdictions (such as HIPAA in the United States, GDPR in the European Union, or the Digital Personal Data Protection Act in India) requires independent legal counsel and operational policy establishment prior to commercial patient onboarding.
          </p>
        </div>
      </div>
    </div>
  );
}
