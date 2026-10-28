import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { analyticsService } from '../../services/analyticsService';
import {
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

export function DocumentationQualityWidget({ patientId }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const fetchFindings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getDocumentationFindings({
        patientId: patientId || undefined,
        status: 'open',
      });
      setFindings(res.data?.data?.findings || []);
    } catch (err) {
      console.error('Failed to load documentation findings:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch findings');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      await analyticsService.scanDocumentationQuality(patientId || undefined);
      await fetchFindings();
    } catch (err) {
      console.error('Scan error:', err);
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (findingId) => {
    try {
      await analyticsService.resolveDocumentationFinding(findingId, {
        status: 'resolved',
        resolutionNotes: 'Verified and resolved by clinician in practice workflow.',
      });
      await fetchFindings();
    } catch (err) {
      console.error('Resolution error:', err);
      alert(`Could not resolve finding: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [patientId]);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-100">Documentation Quality & Completeness</h4>
              <p className="text-xs text-slate-400">Automated audit checks for required records, notes, and plan goals.</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleScan}
            disabled={scanning || loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-teal-400' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Run Audit Scan'}</span>
          </Button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            Checking documentation completeness...
          </div>
        ) : error ? (
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        ) : findings.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Documentation Complete</p>
              <p className="text-[11px] text-slate-400">
                All clinical session notes, treatment goals, and required assessments are up to date.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {findings.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{f.title || f.ruleId}</span>
                    <Badge variant={f.severity === 'high' ? 'rose' : 'amber'} size="sm">
                      {f.severity || 'Medium'}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-xs">{f.description}</p>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Detected: {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleResolve(f.id)}
                  className="shrink-0 flex items-center gap-1 text-[11px]"
                >
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  <span>Mark Resolved</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
