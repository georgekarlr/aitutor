import { useEffect, useState } from 'react';
import { Sparkles, Mic, Volume2, Radio, Loader2 } from 'lucide-react';
import {
  VOICE_PERSONAS,
  type VoicePersonaId,
  getVoiceSettings,
  saveVoiceSettings,
  type VoiceSettings,
} from '@/lib/voice';

interface VoiceVisualizerOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
  className?: string;
}

export function VoiceVisualizerOrb({
  state,
  size = 'md',
  showControls = false,
  className = '',
}: VoiceVisualizerOrbProps) {
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(getVoiceSettings());
  const [waveAmplitudes, setWaveAmplitudes] = useState<number[]>([12, 24, 38, 52, 34, 20, 14]);

  useEffect(() => {
    const handleSettingsChanged = () => {
      setVoiceSettingsState(getVoiceSettings());
    };
    window.addEventListener('aitutor_voice_settings_changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('aitutor_voice_settings_changed', handleSettingsChanged);
    };
  }, []);

  // Animate sound wave bars when speaking or listening
  useEffect(() => {
    if (state !== 'speaking' && state !== 'listening') {
      setWaveAmplitudes([10, 16, 20, 24, 20, 16, 10]);
      return;
    }

    const interval = setInterval(() => {
      setWaveAmplitudes([
        Math.floor(Math.random() * 25) + 10,
        Math.floor(Math.random() * 45) + 15,
        Math.floor(Math.random() * 70) + 20,
        Math.floor(Math.random() * 85) + 25,
        Math.floor(Math.random() * 70) + 20,
        Math.floor(Math.random() * 45) + 15,
        Math.floor(Math.random() * 25) + 10,
      ]);
    }, 90);

    return () => clearInterval(interval);
  }, [state]);

  const activePersona = VOICE_PERSONAS[voiceSettings.persona] || VOICE_PERSONAS.athena;

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-36 w-36',
  };

  const orbColorGradients = {
    idle: 'from-slate-400/20 via-sky-400/20 to-indigo-500/20 border-slate-300 dark:border-slate-700',
    listening: 'from-rose-500/30 via-amber-500/30 to-rose-600/40 border-rose-400 dark:border-rose-500 shadow-rose-500/20',
    thinking: 'from-sky-500/30 via-indigo-500/30 to-purple-600/40 border-indigo-400 dark:border-indigo-500 shadow-indigo-500/20',
    speaking: 'from-emerald-500/30 via-teal-500/30 to-sky-600/40 border-emerald-400 dark:border-emerald-500 shadow-emerald-500/25',
  };

  const stateLabels = {
    idle: 'Ready to converse',
    listening: 'Listening to your voice...',
    thinking: 'Synthesizing thoughtful response...',
    speaking: `${activePersona.name} is speaking...`,
  };

  const handlePersonaChange = (id: VoicePersonaId) => {
    const updated = saveVoiceSettings({ persona: id });
    setVoiceSettingsState(updated);
  };

  const handleSpeedToggle = () => {
    const speeds = [0.85, 1.0, 1.15, 1.3];
    const currentIndex = speeds.findIndex((s) => Math.abs(s - voiceSettings.speechRate) < 0.05);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    const updated = saveVoiceSettings({ speechRate: nextSpeed });
    setVoiceSettingsState(updated);
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Orb Visualizer */}
      <div className="relative flex items-center justify-center p-3">
        {/* Outer acoustic ripple rings */}
        {(state === 'speaking' || state === 'listening') && (
          <>
            <div
              className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                state === 'speaking' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <div
              className={`absolute -inset-2 rounded-full animate-pulse opacity-40 blur-sm ${
                state === 'speaking' ? 'bg-teal-400' : 'bg-amber-400'
              }`}
            />
          </>
        )}

        {/* Center Glowing Orb */}
        <div
          className={`relative ${sizeClasses[size]} rounded-full border shadow-xl bg-gradient-to-tr transition-all duration-500 flex items-center justify-center overflow-hidden backdrop-blur-md ${orbColorGradients[state]}`}
        >
          {/* Animated sound wave frequency bars */}
          <div className="flex items-center justify-center gap-1 h-12 z-10 px-2">
            {waveAmplitudes.map((amp, idx) => (
              <div
                key={idx}
                style={{ height: `${Math.max(6, amp * (size === 'sm' ? 0.4 : size === 'md' ? 0.6 : 0.9))}px` }}
                className={`w-1 rounded-full transition-all duration-75 ${
                  state === 'speaking'
                    ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                    : state === 'listening'
                    ? 'bg-gradient-to-t from-rose-500 to-amber-300'
                    : state === 'thinking'
                    ? 'bg-gradient-to-t from-indigo-500 to-sky-300 animate-pulse'
                    : 'bg-slate-400/60 dark:bg-slate-500/60'
                }`}
              />
            ))}
          </div>

          {/* Central state badge icon */}
          <div className="absolute bottom-1 right-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
            {state === 'speaking' ? (
              <Volume2 className="h-3 w-3 text-emerald-500 animate-pulse" />
            ) : state === 'listening' ? (
              <Mic className="h-3 w-3 text-rose-500 animate-bounce" />
            ) : state === 'thinking' ? (
              <Loader2 className="h-3 w-3 text-indigo-500 animate-spin" />
            ) : (
              <Radio className="h-3 w-3 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* State label & Persona subtitle */}
      <div className="text-center mt-1">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5">
          <span>{stateLabels[state]}</span>
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          Persona: <span className="font-medium text-sky-600 dark:text-sky-400">{activePersona.name}</span> ({activePersona.tagline})
        </p>
      </div>

      {/* Quick Interactive Persona & Speed Controls */}
      {showControls && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {(Object.keys(VOICE_PERSONAS) as VoicePersonaId[]).map((pId) => {
            const p = VOICE_PERSONAS[pId];
            const isSelected = voiceSettings.persona === pId;
            return (
              <button
                key={pId}
                type="button"
                onClick={() => handlePersonaChange(pId)}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-sm font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={p.description}
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>{p.name}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleSpeedToggle}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Toggle playback speed"
          >
            {voiceSettings.speechRate.toFixed(2)}x
          </button>
        </div>
      )}
    </div>
  );
}
