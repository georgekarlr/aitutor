import { useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Radio, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.scrollTop = liveRef.current.scrollHeight;
    }
  }, [interimTranscript, lastModelText, voiceState]);

  if (!active) return null;

  const stateConfig: Record<VoiceState, { label: string; color: string; pulse: boolean }> = {
    idle: { label: 'Tap to talk', color: 'text-slate-400', pulse: false },
    listening: { label: 'Listening...', color: 'text-rose-500', pulse: true },
    thinking: { label: 'Thinking...', color: 'text-sky-500', pulse: false },
    speaking: { label: 'Speaking...', color: 'text-emerald-500', pulse: true },
  };

  const cfg = stateConfig[voiceState];

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 px-4 py-4 md:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Live transcript area */}
        <div
          ref={liveRef}
          className="mb-4 max-h-32 min-h-[3rem] overflow-y-auto rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm"
        >
          {interimTranscript && voiceState === 'listening' ? (
            <p className="text-slate-500 dark:text-slate-400 italic">
              {interimTranscript}
              <span className="inline-block w-0.5 h-4 bg-rose-500 ml-0.5 animate-pulse align-middle" />
            </p>
          ) : lastModelText ? (
            <div className="space-y-2">
              {lastUserText && (
                <p className="text-sky-600 dark:text-sky-400 font-medium text-xs">
                  You: {lastUserText.slice(0, 200)}
                </p>
              )}
              <p className="text-slate-700 dark:text-slate-200">
                {lastModelText.slice(0, 400)}
                {voiceState === 'speaking' && (
                  <span className="inline-block w-0.5 h-4 bg-emerald-500 ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-center py-1">
              {cfg.label}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-xs text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Close voice mode */}
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            aria-label="Close voice mode"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Main mic / talk button */}
          <button
            onClick={onToggle}
            className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all ${
              voiceState === 'listening'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105'
                : voiceState === 'speaking'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : voiceState === 'thinking'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                    : 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20 hover:scale-105'
            }`}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start talking'}
          >
            {cfg.pulse && (
              <span className="absolute inset-0 rounded-full animate-ping bg-current opacity-20" />
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
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              muted
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
            aria-label={muted ? 'Unmute voice' : 'Mute voice'}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>

        {/* Status label */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {voiceState === 'listening' && <Radio className="h-3 w-3 text-rose-500 animate-pulse" />}
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>
    </div>
  );
}
