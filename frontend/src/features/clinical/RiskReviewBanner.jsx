import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { analyticsService } from '../../services/analyticsService';
import { RiskReviewModal } from './RiskReviewModal';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export function RiskReviewBanner({ patientId, onFlagUpdated }) {
  const [flags, setFlags] = useState([]);
  const [activeFlag, setActiveFlag] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getRiskFlags(patientId, 'pending');
      setFlags(res.data?.data?.flags || []);
    } catch (err) {
      console.error('Failed to load risk review flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [patientId]);

  if (loading || flags.length === 0) return null;

  return (
    <>
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-rose-300">
                Active Clinical Risk-Review Flags ({flags.length})
              </span>
              <Badge variant="rose" size="sm">Action Required</Badge>
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              Potential safety signal detected in recent session transcript or psychometric questionnaire. Clinician review required.
            </p>
          </div>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setActiveFlag(flags[0])}
          className="shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Review Evidence</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <RiskReviewModal
        flag={activeFlag}
        isOpen={Boolean(activeFlag)}
        onClose={() => setActiveFlag(null)}
        onAcknowledged={() => {
          fetchFlags();
          if (onFlagUpdated) onFlagUpdated();
        }}
      />
    </>
  );
}
