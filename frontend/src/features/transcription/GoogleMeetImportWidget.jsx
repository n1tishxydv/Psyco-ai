import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { transcriptionService } from '../../services/transcriptionService';
import { Video, RefreshCw, CheckCircle, AlertCircle, FileText, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function GoogleMeetImportWidget({ session, appointment, onTranscriptCompleted, onNavigateToCopilot }) {
  const sessionId = session?.sessionId || session?.id;
  const isOnline = session?.sessionMode === 'online' || appointment?.sessionMode === 'online';

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [customMeetingCode, setCustomMeetingCode] = useState('');

  const detectedUrl = appointment?.googleMeetUrl || appointment?.location?.addressOrUrl || '';

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await transcriptionService.importGoogleMeetTranscript({
        sessionId,
        meetingCode: customMeetingCode || undefined,
      });

      setResult(res.data?.transcript);
    } catch (err) {
      console.error('Meet import error:', err);
      setError(err.message || 'Failed to import Google Meet transcript.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOnline && !detectedUrl) {
    return null;
  }

  return (
    <Card className="border border-navy-700 bg-navy-900/60 shadow-xl overflow-hidden mt-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Google Meet Transcript Import
                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                  API v2 Official
                </Badge>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Retrieve official speech transcripts from Google Meet conference records for this online consultation.
              </p>
            </div>
          </div>

          {result && (
            <Link to={`/psychologist/sessions/${sessionId}/transcript`}>
              <Button variant="outline" size="sm" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                <FileText className="w-4 h-4 mr-1.5" />
                Open in Studio
              </Button>
            </Link>
          )}
        </div>

        {detectedUrl && (
          <div className="mt-4 p-3 bg-navy-950/70 border border-navy-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-400">Associated Meeting URL:</span>
            <a
              href={detectedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline font-mono"
            >
              {detectedUrl}
            </a>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Google Meet Code (Optional override)
            </label>
            <input
              type="text"
              placeholder="e.g. abc-mnop-xyz"
              value={customMeetingCode}
              onChange={(e) => setCustomMeetingCode(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end justify-start md:justify-end">
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Discovering Artifacts...
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5 mr-1.5" />
                  Import Meet Transcript
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Successfully imported {result.turnCount} turns ({result.completeness}) from Google Meet!
              </span>
              <Link to={`/psychologist/sessions/${sessionId}/transcript`} className="text-emerald-300 font-semibold underline flex items-center gap-1">
                View Transcript <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
              <span className="text-purple-300 font-medium">
                ✨ Ready to process dialogue with Gemini to draft Treatment Plan & SOAP Note?
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onNavigateToCopilot) onNavigateToCopilot('GENERATE_BOTH');
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-3.5 py-1.5 shrink-0 flex items-center gap-1.5 shadow-md shadow-purple-950/40"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                ⚡ Generate Both in 1-Click
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-navy-800/60 pt-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            Google Meet API v2 Conference Records & Transcript Entries. Text persisted to RTDB.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
