import React from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';

export function TermsPage() {
  return (
    <div className="flex-1 max-w-4xl mx-auto py-12 px-4 space-y-6">
      <div className="space-y-2">
        <Badge variant="teal">Legal</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-primaryText">Terms of Service</h1>
        <p className="text-xs text-secondaryText">Phase 0 Architectural Baseline</p>
      </div>

      <Card>
        <CardContent className="space-y-4 text-xs text-secondaryText leading-relaxed pt-4">
          <h3 className="text-sm font-semibold text-primaryText">1. Clinical Accountability & AI Copilot</h3>
          <p>
            Psyco AI provides practice management tooling and assistive clinical documentation drafting.
            The platform does not provide medical diagnoses or independent healthcare decisions.
            The licensed psychologist retains sole and unalienable clinical responsibility for all finalized patient notes, assessments, and treatment plans.
          </p>

          <h3 className="text-sm font-semibold text-primaryText">2. Emergency and Crisis Disclaimer</h3>
          <p>
            Psyco AI is not an emergency hotline or crisis service. In the event of acute psychiatric distress or immediate risk of self-harm, clients must contact local emergency medical services or verified suicide prevention hotlines immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
