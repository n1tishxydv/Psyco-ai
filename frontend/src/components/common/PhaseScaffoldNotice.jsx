import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../cards/Card';
import { Badge } from './Badge';
import { Layers, Calendar, CheckCircle2, Clock } from 'lucide-react';

export function PhaseScaffoldNotice({
  moduleName,
  targetPhase,
  description,
  prerequisites = [],
}) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Card className="border-psyco-steel/70 bg-psyco-slate">
        <CardHeader>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm">Phase 0 Architectural Scaffold</Badge>
              <Badge variant="amber" size="sm">Planned for {targetPhase}</Badge>
            </div>
            <CardTitle className="text-xl mt-2 text-psyco-softGrey">{moduleName}</CardTitle>
            <CardDescription className="text-sm text-psyco-coolGrey">
              {description}
            </CardDescription>
          </div>
          <div className="hidden sm:flex p-3 rounded-xl bg-psyco-darkNavy text-psyco-softGrey border border-psyco-steel">
            <Layers className="w-6 h-6" />
          </div>
        </CardHeader>

        <CardContent>
          <div className="bg-psyco-darkNavy/80 rounded-xl p-4 border border-psyco-steel/60 space-y-3">
            <h4 className="text-xs font-semibold text-psyco-softGrey uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Scheduled Implementation Roadmap
            </h4>
            <p className="text-xs text-psyco-coolGrey leading-relaxed">
              In Phase 0, the routing foundation, API client boundaries, and security contracts have been established. This screen will be populated with full interactive workflows in {targetPhase}.
            </p>

            {prerequisites.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-medium text-psyco-coolGrey block mb-1.5">Upstream Architecture & Dependencies:</span>
                <ul className="space-y-1">
                  {prerequisites.map((req, idx) => (
                    <li key={idx} className="text-xs text-psyco-coolGrey flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-psyco-softGrey shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
