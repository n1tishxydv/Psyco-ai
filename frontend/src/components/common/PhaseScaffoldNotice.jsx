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
      <Card className="border-softTeal/30 bg-deepBlueGray/90">
        <CardHeader>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm">Phase 0 Architectural Scaffold</Badge>
              <Badge variant="amber" size="sm">Planned for {targetPhase}</Badge>
            </div>
            <CardTitle className="text-xl mt-2">{moduleName}</CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </div>
          <div className="hidden sm:flex p-3 rounded-xl bg-elevatedSlate text-softTeal">
            <Layers className="w-6 h-6" />
          </div>
        </CardHeader>

        <CardContent>
          <div className="bg-midnightNavy/60 rounded-xl p-4 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-primaryText uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-mutedAmber" />
              Scheduled Implementation Roadmap
            </h4>
            <p className="text-xs text-secondaryText leading-relaxed">
              In Phase 0, the routing foundation, API client boundaries, and security contracts have been established. This screen will be populated with full interactive workflows in {targetPhase}.
            </p>

            {prerequisites.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Upstream Architecture & Dependencies:</span>
                <ul className="space-y-1">
                  {prerequisites.map((req, idx) => (
                    <li key={idx} className="text-xs text-secondaryText flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-softTeal shrink-0" />
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
