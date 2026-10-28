import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { transcriptionService } from '../../services/transcriptionService';
import { FileText, AlertCircle, CheckCircle, Upload, Sparkles, Languages } from 'lucide-react';

export function ManualImportModal({ sessionId, isOpen, onClose, onSuccess }) {
  const [text, setText] = useState('');
  const [sourceLabel, setSourceLabel] = useState('manual_import');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const sampleHinglish = `Psychologist: Namaste Rahul, pichle session ke baad se aap kaisa feel kar rahe hain?
Patient: Doctor sahab, mujhe pichle do hafton se office mein bohot zyada anxiety feel hoti hai. Presentation se pehle heartbeat tez ho jaati hai, sweat aane lagta hai aur lagta hai main sab bhool jaunga.
Psychologist: Samajh raha hoon. Neend aur diet ka kya routine chal raha hai abhi?
Patient: Raat ko neend theek se nahi aati, late night tak overthinking chalti rehti hai. Morning mein continuous exhaustion rehta hai. Lekin walk pe jaata hoon toh thoda fresh lagta hai.
Psychologist: Good. Aaj hum CBT cognitive restructuring aur box breathing technique practice karenge jab bhi panic ya anxiety trigger ho.`;

  const sampleEnglish = `Psychologist: Good morning Sarah, how have your anxiety levels been since our last appointment?
Patient: It's been tough this week. Work deadlines triggered panic attacks on Tuesday and Thursday. My chest felt tight and I couldn't focus.
Psychologist: I hear you. Did you have an opportunity to try the 4-7-8 breathing exercises we discussed?
Patient: Yes, it helped slow my heart rate during the meeting, but the recurring catastrophic thoughts are still persistent.
Psychologist: Today we will practice cognitive reframing for those catastrophic thoughts and outline your treatment goals.`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Transcript text cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await transcriptionService.importManualTextTranscript({
        sessionId,
        text: text.trim(),
        source: sourceLabel || 'manual_import',
        notes: notes || undefined,
      });

      if (onSuccess) onSuccess(res.data?.transcript);
      onClose();
    } catch (err) {
      console.error('Manual import error:', err);
      setError(err.message || 'Failed to import manual text transcript.');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-navy-900 border border-teal-500/40 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-4">
          <div className="flex items-center gap-2.5 text-teal-400">
            <FileText className="w-5 h-5" />
            <h3 className="text-base font-semibold text-slate-100">Import Consultation Transcript</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <Languages className="w-3 h-3 text-purple-400" /> English & Hinglish
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-xs text-slate-300 space-y-1">
            <p className="flex items-center gap-1.5 font-semibold text-purple-300">
              <Sparkles className="w-3.5 h-3.5" />
              English & Hinglish Typed Dialogue Fully Supported
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Type or paste dialogue in standard English or romanized Hinglish (e.g. <em>"Patient: Mujhe bohot anxiety hoti hai..."</em>). Once saved, Gemini Copilot will immediately process the dialogue into structured clinical notes and treatment plans in formal clinical English.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-300">Quick Test Templates:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setText(sampleHinglish);
                  setSourceLabel('hinglish_session_transcript');
                }}
                className="px-2.5 py-1 rounded bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-[11px] border border-teal-500/30 transition flex items-center gap-1"
              >
                Insert Hinglish Dialogue
              </button>
              <button
                type="button"
                onClick={() => {
                  setText(sampleEnglish);
                  setSourceLabel('english_session_transcript');
                }}
                className="px-2.5 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[11px] border border-blue-500/30 transition flex items-center gap-1"
              >
                Insert English Dialogue
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Source Attribution
            </label>
            <input
              type="text"
              placeholder="e.g. Dictation Service, External Audio Note, Pre-Session Log"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Transcript Dialogue Text (English or Hinglish) *
              </label>
              <span className="text-[11px] text-slate-400">
                {wordCount} words | {charCount} / 200,000 chars
              </span>
            </div>
            <textarea
              rows={8}
              required
              placeholder="Type or paste dialogue here in English or Hinglish (e.g.&#10;Psychologist: Aap kaisa feel kar rahe hain?&#10;Patient: Mujhe bohot anxiety feel ho rahi hai...)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-navy-950/70 border border-navy-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Clinical Ingestion Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Verified by clinician after offline consultation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-navy-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={loading || !text.trim()}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              {loading ? 'Importing...' : 'Save & Import to RTDB'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
