import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { transcriptionService } from '../../services/transcriptionService';
import { AudioStreamer } from '../../utils/audioStreamer';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';

export function LiveTranscriptionWidget({ session, appointment, onTranscriptCompleted, onNavigateToCopilot }) {
  const sessionId = session?.sessionId || session?.id;
  const patientId = session?.patientId;

  // Device & Stream State
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [streamState, setStreamState] = useState('idle'); // 'idle' | 'requesting' | 'recording' | 'paused' | 'finalizing' | 'stopped'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState(null);

  // Consent State
  const [consentStatus, setConsentStatus] = useState('checking');
  const [consentModal, setConsentModal] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [consentNotes, setConsentNotes] = useState('');

  // Transcripts State
  const [transcriptId, setTranscriptId] = useState(null);
  const [partialText, setPartialText] = useState('');
  const [turns, setTurns] = useState([]);
  const [turnCounter, setTurnCounter] = useState(0);

  const streamerRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch Consent on mount
  const checkConsent = async () => {
    if (!sessionId) return;
    try {
      setConsentStatus('checking');
      const res = await transcriptionService.getConsentStatus(sessionId);
      setConsentStatus(res.data?.consentStatus || 'not_recorded');
    } catch (err) {
      console.warn('Consent fetch error:', err);
      setConsentStatus('not_recorded');
    }
  };

  // Enumerate Microphones
  const enumerateDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devList = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devList.filter((d) => d.kind === 'audioinput');
        setDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      }
    } catch (err) {
      console.warn('Microphone enumeration warning:', err);
    }
  };

  useEffect(() => {
    if (sessionId) {
      checkConsent();
      enumerateDevices();
    }
    return () => {
      stopRecording();
    };
  }, [sessionId]);

  // Elapsed Timer
  useEffect(() => {
    if (streamState === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [streamState]);

  // Format Timer mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Record Consent
  const handleRecordConsent = async () => {
    try {
      setError(null);
      await transcriptionService.recordConsent({
        sessionId,
        patientId,
        consentType: 'in_person_ambient',
        confirmed: true,
        patientInformed: true,
        zeroAudioRetentionAcknowledged: true,
        notes: consentNotes || undefined,
      });
      setConsentStatus('granted');
      setConsentModal(false);
    } catch (err) {
      setError(err.message || 'Failed to record patient consent.');
    }
  };

  // Start Ambient Transcription
  const startRecording = async () => {
    if (consentStatus !== 'granted') {
      setConsentModal(true);
      return;
    }

    try {
      setError(null);
      setStreamState('requesting');

      // 1. Request short-lived token from backend
      const tokenRes = await transcriptionService.requestStreamingToken(sessionId);
      const { token, wsUrl, transcriptId: tid, isSimulated } = tokenRes.data;
      setTranscriptId(tid);

      // 2. Initialize streamer
      const streamer = new AudioStreamer({
        wsUrl,
        isSimulated,
        sampleRate: 16000,
        onOpen: () => {
          setStreamState('recording');
        },
        onTurn: async (turnData) => {
          if (!turnData.endOfTurn) {
            setPartialText(turnData.transcript);
          } else {
            setPartialText('');
            setTurns((prev) => [...prev, turnData]);
            setTurnCounter((prev) => prev + 1);

            // Ingest finalized turn into RTDB
            try {
              await transcriptionService.saveTranscriptTurn({
                sessionId,
                transcriptId: tid,
                turnOrder: turnCounter,
                transcript: turnData.transcript,
                speaker: turnData.speaker || (turnCounter % 2 === 0 ? 'Patient' : 'Psychologist'),
                endOfTurn: true,
                audioStart: turnData.audioStart,
                audioEnd: turnData.audioEnd,
              });
            } catch (saveErr) {
              console.error('Failed saving turn to RTDB:', saveErr);
            }
          }
        },
        onError: (err) => {
          console.error('Transcription error:', err);
          setError(err.message || 'Streaming transcription encountered an error.');
          setStreamState('stopped');
        },
        onClose: () => {
          if (streamState === 'recording') {
            setStreamState('stopped');
          }
        },
      });

      streamerRef.current = streamer;
      await streamer.start(selectedDeviceId || null);
    } catch (err) {
      console.error('Start recording failed:', err);
      setError(err.message || 'Could not access microphone or initiate transcription.');
      setStreamState('idle');
    }
  };

  // Pause Recording
  const pauseRecording = () => {
    if (streamerRef.current) {
      streamerRef.current.pause();
      setStreamState('paused');
    }
  };

  // Resume Recording
  const resumeRecording = () => {
    if (streamerRef.current) {
      streamerRef.current.resume();
      setStreamState('recording');
    }
  };

  // Stop Recording
  const stopRecording = async () => {
    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }
    setStreamState('stopped');

    if (transcriptId) {
      try {
        await transcriptionService.finalizeTranscript({
          sessionId,
          transcriptId,
          completeness: 'completed',
        });
        if (onTranscriptCompleted) {
          onTranscriptCompleted({ sessionId, transcriptId, turnsCount: turns.length });
        }
      } catch (finErr) {
        console.warn('Finalize error:', finErr);
      }
    }
  };

  return (
    <Card className="border border-teal-500/30 bg-navy-900/60 shadow-xl overflow-hidden">
      <CardContent className="p-6">
        {/* Header & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-navy-700">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${streamState === 'recording' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-teal-500/10 text-teal-400'}`}>
                {streamState === 'recording' ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  Ambient In-Person Transcription
                  <Badge variant={streamState === 'recording' ? 'danger' : 'outline'} className="text-xs">
                    {streamState === 'recording' ? 'RECORDING LIVE' : streamState === 'paused' ? 'PAUSED' : 'READY'}
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  AssemblyAI v3 streaming with Zero Audio Persistence. Real-time speech converted directly to text.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Counter */}
            <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 flex items-center gap-2 text-slate-200 text-sm font-mono">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            {/* Transcript Studio Link */}
            {sessionId && (
              <Link to={`/psychologist/sessions/${sessionId}/transcript`}>
                <Button variant="outline" size="sm" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                  <FileText className="w-4 h-4 mr-1.5" />
                  Review Studio
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* 50-minute Warning Alert */}
        {elapsedSeconds >= 3000 && (
          <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-lg flex items-center gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Consultation time has reached 50 minutes. Remember to prepare for wrap-up and documentation review.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Controls Bar */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Microphone Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Microphone Input</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={streamState === 'recording'}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-50"
            >
              {devices.length === 0 && <option value="">Default System Microphone</option>}
              {devices.map((dev, i) => (
                <option key={dev.deviceId || i} value={dev.deviceId}>
                  {dev.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Consent Status Badge */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Patient Informed Consent</label>
            <div className="flex items-center gap-2">
              <Badge variant={consentStatus === 'granted' ? 'success' : 'warning'} className="text-xs py-1.5 px-2.5">
                {consentStatus === 'granted' ? (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Consent Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Consent Required
                  </span>
                )}
              </Badge>
              {consentStatus !== 'granted' && (
                <button
                  type="button"
                  onClick={() => setConsentModal(true)}
                  className="text-xs text-teal-400 hover:underline"
                >
                  Record Consent
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end justify-start md:justify-end gap-2.5">
            {streamState === 'idle' || streamState === 'stopped' ? (
              <Button
                variant="primary"
                onClick={startRecording}
                className="bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-lg shadow-teal-900/30 text-xs px-4 py-2"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Start Transcription
              </Button>
            ) : null}

            {streamState === 'recording' ? (
              <>
                <Button
                  variant="outline"
                  onClick={pauseRecording}
                  className="border-navy-600 text-slate-300 hover:bg-navy-700 text-xs px-3 py-2"
                >
                  <Pause className="w-3.5 h-3.5 mr-1" />
                  Pause
                </Button>
                <Button
                  variant="danger"
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs px-4 py-2"
                >
                  <Square className="w-3.5 h-3.5 mr-1.5" />
                  Stop & Finalize
                </Button>
              </>
            ) : null}

            {streamState === 'paused' ? (
              <>
                <Button
                  variant="primary"
                  onClick={resumeRecording}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-2"
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Resume
                </Button>
                <Button
                  variant="danger"
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs px-4 py-2"
                >
                  <Square className="w-3.5 h-3.5 mr-1.5" />
                  Stop
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/* Live Speech Stream Preview */}
        <div className="mt-5 p-4 rounded-xl bg-navy-950/70 border border-navy-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Live Transcript Turns ({turns.length} confirmed)
            </span>
            {streamState === 'recording' && (
              <span className="text-red-400 flex items-center gap-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Streaming Audio Transiently
              </span>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
            {turns.length === 0 && !partialText ? (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                {streamState === 'recording'
                  ? 'Listening for speech... Audio chunks are transcribed live and discarded from memory.'
                  : 'Start transcription above to capture live speech turns for this consultation.'}
              </div>
            ) : null}

            {turns.map((turn, i) => (
              <div key={i} className="text-xs bg-navy-900/60 p-2.5 rounded-lg border border-navy-800/80">
                <div className="flex items-center justify-between text-[11px] text-teal-400/90 font-medium mb-1">
                  <span>{turn.speaker || 'Speaker'}</span>
                  <span className="text-slate-500">Confirmed turn</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{turn.transcript}</p>
              </div>
            ))}

            {/* Provisional Partial */}
            {partialText && (
              <div className="text-xs bg-teal-950/30 p-2.5 rounded-lg border border-teal-500/30">
                <div className="text-[11px] text-teal-300 font-medium mb-1 italic">Interim speech...</div>
                <p className="text-slate-300 italic">{partialText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Post-Transcript Processing with Gemini Action Banner */}
        {turns.length > 0 && streamState !== 'recording' && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-navy-900 to-navy-900 border border-purple-500/30 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    Transcript Completed ({turns.length} turns recorded)
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      English & Hinglish
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ready for Gemini AI processing. Generate a structured clinical Treatment Plan and SOAP Notes from this consultation dialogue.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (onNavigateToCopilot) onNavigateToCopilot('GENERATE_BOTH');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-md shadow-purple-950/40 font-semibold"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  ⚡ Generate Both in 1-Click
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onNavigateToCopilot) onNavigateToCopilot('GENERATE_TREATMENT_PLAN_DRAFT');
                  }}
                  className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs px-2.5 py-1.5 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Plan Only
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onNavigateToCopilot) onNavigateToCopilot('GENERATE_SOAP');
                  }}
                  className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs px-2.5 py-1.5 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  Notes Only
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Strict Zero Audio Persistence Notice */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-navy-800/60 pt-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            Zero-Audio-Persistence Invariant: Audio buffers are wiped after WebSocket transmission. No raw audio is retained.
          </span>
          <span>AssemblyAI Streaming v3</span>
        </div>
      </CardContent>

      {/* Consent Modal */}
      {consentModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-navy-900 border border-teal-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-teal-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-base font-semibold text-slate-100">Patient Informed Consent</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clinical guidelines require informed patient consent prior to speech-to-text processing.
              Please confirm that the patient has been informed that:
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-400 list-disc list-inside bg-navy-950/50 p-3 rounded-lg border border-navy-800">
              <li>Audio is streamed transiently for real-time transcription only.</li>
              <li>No raw audio or video files are permanently stored by Psyco AI.</li>
              <li>The resulting text transcript will be stored securely in the patient's medical record.</li>
              <li>Consent may be withdrawn by the patient at any point during consultation.</li>
            </ul>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Consent Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Verbal consent confirmed at session start"
                value={consentNotes}
                onChange={(e) => setConsentNotes(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="rounded border-navy-700 bg-navy-800 text-teal-500 focus:ring-teal-500"
              />
              <label htmlFor="consentCheck" className="text-xs text-slate-300 select-none cursor-pointer">
                I verify that patient informed consent has been obtained.
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setConsentModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!consentConfirmed}
                onClick={handleRecordConsent}
                className="bg-teal-600 hover:bg-teal-500 text-white"
              >
                Confirm & Enable Recording
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
