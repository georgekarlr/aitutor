import { useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Radio, Loader2, Sparkles } from 'lucide-react';
import { VoiceVisualizerOrb } from '@/components/VoiceVisualizerOrb';
import { VOICE_PERSONAS, getVoiceSettings } from '@/lib/voice';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceBarProps {
  active: boolean;
  voiceState: VoiceState;
  interimTranscript: string;
  lastUserText: string;
  lastModelText: string;
  error: string | null;
  onToggle: () => void;
  onClose: () => void;
  onMute: () => void;
  muted: boolean;
}

export default function VoiceBar({
  active,
  voiceState,
  interimTranscript,
  lastUserText,
  lastModelText,
  error,
  onToggle,
  onClose,
  onMute,
  muted,
}: VoiceBarProps) {
  const liveRef = useRef<HTMLDivElement>(null);
  const settings = getVoiceSettings();
  const activePersona = VOICE_PERSONAS[settings.persona] || VOICE_PERSONAS.athena;

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.scrollTop = liveRef.current.scrollHeight;
    }
  }, [interimTranscript, lastModelText, voiceState]);

  if (!active) return null;

  const stateConfig: Record<VoiceState, { label: string; color: string; pulse: boolean }> = {
    idle: { label: 'Tap mic to speak', color: 'text-slate-400', pulse: false },
    listening: { label: 'Listening to your voice...', color: 'text-rose-500', pulse: true },
    thinking: { label: 'Thinking & formulating...', color: 'text-sky-500', pulse: false },
    speaking: { label: `${activePersona.name} speaking...`, color: 'text-emerald-500', pulse: true },
  };

  const cfg = stateConfig[voiceState];

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 px-4 py-4 md:px-8 shadow-xl">
      <div className="mx-auto max-w-3xl">
        {/* Top Visualizer Orb */}
        <div className="mb-3 flex justify-center">
          <VoiceVisualizerOrb state={voiceState} size="sm" showControls={true} />
        </div>

        {/* Live transcript area */}
        <div
          ref={liveRef}
          className="mb-4 max-h-32 min-h-[3.5rem] overflow-y-auto rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm shadow-inner"
        >
          {interimTranscript && voiceState === 'listening' ? (
            <p className="text-slate-600 dark:text-slate-300 italic flex items-center gap-1.5">
              <span className="font-semibold text-rose-500">You:</span>
              <span>{interimTranscript}</span>
              <span className="inline-block w-1.5 h-4 bg-rose-500 ml-0.5 animate-pulse align-middle rounded-full" />
            </p>
          ) : lastModelText ? (
            <div className="space-y-1.5">
              {lastUserText && (
                <p className="text-sky-600 dark:text-sky-400 font-medium text-xs">
                  You: {lastUserText.slice(0, 200)}
                </p>
              )}
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1.5">
                  {activePersona.name}:
                </span>
                {lastModelText.slice(0, 400)}
                {voiceState === 'speaking' && (
                  <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-1 animate-pulse align-middle rounded-full" />
                )}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-center py-1 gap-2">
              <Sparkles className="h-4 w-4 text-sky-400 animate-pulse" />
              <span>{cfg.label}</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-xs text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Close voice mode */}
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close voice mode"
            title="Exit Voice Mode"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Main mic / talk button */}
          <button
            onClick={onToggle}
            className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all cursor-pointer ${
              voiceState === 'listening'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105 ring-4 ring-rose-500/20'
                : voiceState === 'speaking'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                  : voiceState === 'thinking'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 ring-4 ring-sky-500/20'
                    : 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-sky-500/30 hover:scale-105 hover:shadow-sky-500/40'
            }`}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start talking'}
          >
            {cfg.pulse && (
              <span className="absolute inset-0 rounded-full animate-ping bg-current opacity-25" />
            )}
            {voiceState === 'thinking' ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : voiceState === 'listening' ? (
              <MicOff className="h-7 w-7" />
            ) : (
              <Mic className="h-7 w-7" />
            )}
          </button>

          {/* Mute toggle */}
          <button
            onClick={onMute}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
              muted
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            aria-label={muted ? 'Unmute voice' : 'Mute voice'}
            title={muted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>

        {/* Status label */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {voiceState === 'listening' && <Radio className="h-3.5 w-3.5 text-rose-500 animate-pulse" />}
          <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>
    </div>
  );
}
