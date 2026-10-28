import React from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';

export function PrivacyPage() {
  return (
    <div className="flex-1 max-w-4xl mx-auto py-12 px-4 space-y-6">
      <div className="space-y-2">
        <Badge variant="teal">Governance</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-primaryText">Privacy Policy</h1>
        <p className="text-xs text-secondaryText">Last updated: October 2026 (Phase 0 Baseline)</p>
      </div>

      <Card>
        <CardContent className="space-y-4 text-xs text-secondaryText leading-relaxed pt-4">
          <h3 className="text-sm font-semibold text-primaryText">1. Core Commitment to Zero Binary Storage</h3>
          <p>
            Psyco AI guarantees that raw therapy audio and video recordings are never stored persistently.
            Any speech-to-text processing operates transiently in memory, immediately wiping the audio buffer upon transcript generation.
          </p>

          <h3 className="text-sm font-semibold text-primaryText">2. Therapeutic Relationship Isolation</h3>
          <p>
            Access to clinical records, intake forms, and session notes is strictly governed by Relationship-Based Access Control (ReBAC).
            Only the assigned psychologist and patient have visibility into their respective records. Administrative roles are explicitly barred from clinical note access.
          </p>

          <h3 className="text-sm font-semibold text-primaryText">3. Database & Security Controls</h3>
          <p>
            All persistent data is stored as structured text/JSON in Firebase Realtime Database. All network transmissions require TLS 1.3 encryption.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
