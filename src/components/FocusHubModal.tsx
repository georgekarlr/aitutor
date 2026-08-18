/**
 * Gamified Mastery Streaks & Pomodoro Focus Hub Modal.
 * Integrates procedural Web Audio soundscapes, interval timers, streaks heatmap, and badges.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Award,
  Calendar,
  Sparkles,
  Maximize2,
  Minimize2,
  Clock,
  Radio,
  Sliders,
} from 'lucide-react';
import type {
  PomodoroMode,
  PomodoroConfig,
  PomodoroSessionState,
  SoundscapeType,
  FocusHubStats,
  MasteryBadge,
  BadgeCategory,
} from '@/types';

interface FocusHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PomodoroConfig;
  onUpdateConfig: (cfg: Partial<PomodoroConfig>) => void;
  sessionState: PomodoroSessionState;
  stats: FocusHubStats;
  badges: MasteryBadge[];
  activeSoundscape: SoundscapeType | null;
  soundscapeVolume: number;
  newlyUnlockedModal: MasteryBadge | null;
  onDismissUnlockedModal: () => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipInterval: () => void;
  onSwitchMode: (mode: PomodoroMode) => void;
  onToggleSoundscape: (type: SoundscapeType) => void;
  onSetSoundVolume: (vol: number) => void;
  onSetTaskGoal: (goal: string) => void;
}

const SOUNDSCAPES: Array<{
  id: SoundscapeType;
  name: string;
  category: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'brown_noise',
    name: 'Brown Noise',
    category: 'Deep Focus',
    description: 'Warm, low-pass weighted rumble for silencing distractions and inducing flow.',
    icon: '🌊',
  },
  {
    id: 'alpha_binaural',
    name: '10Hz Alpha Waves',
    category: 'Binaural Beats',
    description: 'Stereo 10Hz differential frequencies paired with harmonic sub-drone.',
    icon: '🎧',
  },
  {
    id: 'rainfall',
    name: 'Procedural Rain',
    category: 'Nature Synth',
    description: 'Dynamic water droplets with filtered bandpass body and low sub-thunder.',
    icon: '🌧️',
  },
  {
    id: 'campfire',
    name: 'Crackling Campfire',
    category: 'Warm Ambience',
    description: 'Stochastic ember crackles paired with warm resonant low-end warmth.',
    icon: '🔥',
  },
  {
    id: 'lofi_pad',
    name: 'Lofi Ambient Pad',
    category: 'Synthesizer',
    description: 'Gentle major 7th chord drone with slow tremolo modulation.',
    icon: '🎹',
  },
  {
    id: 'singing_bowl',
    name: 'Tibetan Bowl',
    category: 'Meditation',
    description: 'Harmonic overtone drone for deep contemplation and recharge breaks.',
    icon: '🥣',
  },
];

export function FocusHubModal({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  sessionState,
  stats,
  badges,
  activeSoundscape,
  soundscapeVolume,
  newlyUnlockedModal,
  onDismissUnlockedModal,
  onToggleTimer,
  onResetTimer,
  onSkipInterval,
  onSwitchMode,
  onToggleSoundscape,
  onSetSoundVolume,
  onSetTaskGoal,
}: FocusHubModalProps) {
  const [activeTab, setActiveTab] = useState<'timer' | 'soundscapes' | 'streaks' | 'badges' | 'settings'>('timer');
  const [isZenFullscreen, setIsZenFullscreen] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState<BadgeCategory | 'all'>('all');

  // Heatmap generation for past 28 days
  const heatmapDays = useMemo(() => {
    const days: Array<{ date: string; dayNum: number; minutes: number; intensity: number }> = [];
    const today = new Date();

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const log = stats.dailyLogs[dateStr];
      const mins = log ? log.focusMinutes : 0;
      let intensity = 0;
      if (mins > 0 && mins < 25) intensity = 1;
      else if (mins >= 25 && mins < 60) intensity = 2;
      else if (mins >= 60 && mins < 120) intensity = 3;
      else if (mins >= 120) intensity = 4;

      days.push({
        date: dateStr,
        dayNum: d.getDate(),
        minutes: mins,
        intensity,
      });
    }
    return days;
  }, [stats.dailyLogs]);

  // Escape key listener
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZenFullscreen) {
          setIsZenFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isZenFullscreen, onClose]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentTotalSeconds =
    sessionState.mode === 'work'
      ? config.workMinutes * 60
      : sessionState.mode === 'short_break'
      ? config.shortBreakMinutes * 60
      : config.longBreakMinutes * 60;

  const progressPercent = Math.max(
    0,
    Math.min(100, ((currentTotalSeconds - sessionState.secondsRemaining) / currentTotalSeconds) * 100)
  );

  // Filtered badges
  const filteredBadges = badges.filter((b) => (badgeFilter === 'all' ? true : b.category === badgeFilter));
  const userLevel = Math.max(1, Math.floor(stats.totalXp / 250) + 1);
  const xpInCurrentLevel = stats.totalXp % 250;

  // Zen Fullscreen Mode
  if (isZenFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-between p-8 select-none">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-semibold text-slate-400">
              Zen Focus Sanctuary
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsZenFullscreen(false)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Minimize2 className="h-4 w-4" />
            <span>Exit Zen</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center my-auto">
          {/* Large Zen Timer */}
          <div className="relative flex items-center justify-center">
            <svg className="h-72 w-72 sm:h-96 sm:w-96 -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                strokeWidth="6"
                className="stroke-slate-800 fill-none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                strokeWidth="8"
                strokeDasharray="276%"
                strokeDashoffset={`${276 - (276 * progressPercent) / 100}%`}
                strokeLinecap="round"
                className={`fill-none transition-all duration-1000 ${
                  sessionState.mode === 'work' ? 'stroke-indigo-500' : 'stroke-emerald-400'
                }`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-6xl sm:text-8xl font-black font-mono tracking-tighter tabular-nums text-white">
                {formatTime(sessionState.secondsRemaining)}
              </span>
              <span className="mt-2 text-xs uppercase tracking-widest font-bold text-indigo-400">
                {sessionState.mode === 'work' ? 'Deep Work Focus' : 'Recharge Interval'}
              </span>
            </div>
          </div>

          {sessionState.activeTaskGoal && (
            <p className="mt-6 text-sm text-slate-400 italic max-w-md text-center">
              Target: "{sessionState.activeTaskGoal}"
            </p>
          )}

          {/* Quick Zen Controls */}
          <div className="mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleTimer}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              {sessionState.isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={onResetTimer}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bottom Ambient Controller */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{activeSoundscape ? `Playing: ${activeSoundscape}` : 'Ambient Soundscape Paused'}</span>
          <button
            type="button"
            onClick={() => onToggleSoundscape(activeSoundscape || 'brown_noise')}
            className="text-slate-400 hover:text-white underline cursor-pointer"
          >
            {activeSoundscape ? 'Pause Sound' : 'Play Brown Noise'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 text-white shadow-sm">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Focus Hub & Mastery Streaks
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Flame className="h-3 w-3 fill-amber-500" />
                  <span>{stats.currentStreak}-Day Streak</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Procedural Soundscapes • Smart Pomodoro • Level {userLevel} Scholar ({xpInCurrentLevel}/250 XP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsZenFullscreen(true)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Zen Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Zen Mode</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-100/50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'timer'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pomodoro Timer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('soundscapes')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'soundscapes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Procedural Soundscapes</span>
            {activeSoundscape && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('streaks')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'streaks'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Streaks & Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'badges'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Mastery Badges ({stats.unlockedBadgeIds.length}/{badges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Timer Config</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: POMODORO TIMER */}
          {activeTab === 'timer' && (
            <div className="flex flex-col items-center">
              {/* Interval Mode Switcher */}
              <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-8 shadow-inner">
                <button
                  type="button"
                  onClick={() => onSwitchMode('work')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    sessionState.mode === 'work'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Deep Focus ({config.workMinutes}m)
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchMode('short_break')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    sessionState.mode === 'short_break'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Short Rest ({config.shortBreakMinutes}m)
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchMode('long_break')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    sessionState.mode === 'long_break'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Long Rest ({config.longBreakMinutes}m)
                </button>
              </div>

              {/* Circular SVG Timer */}
              <div className="relative flex items-center justify-center my-2">
                <svg className="h-64 w-64 -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="105"
                    strokeWidth="8"
                    className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="105"
                    strokeWidth="10"
                    strokeDasharray="660"
                    strokeDashoffset={`${660 - (660 * progressPercent) / 100}`}
                    strokeLinecap="round"
                    className={`fill-none transition-all duration-700 ${
                      sessionState.mode === 'work'
                        ? 'stroke-indigo-600 dark:stroke-indigo-500'
                        : sessionState.mode === 'short_break'
                        ? 'stroke-emerald-500'
                        : 'stroke-purple-500'
                    }`}
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-5xl font-black font-mono tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
                    {formatTime(sessionState.secondsRemaining)}
                  </span>
                  <span className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {sessionState.mode === 'work'
                      ? 'Deep Focus Interval'
                      : sessionState.mode === 'short_break'
                      ? 'Short Recharge'
                      : 'Extended Rest'}
                  </span>
                </div>
              </div>

              {/* Task Goal Input */}
              <div className="w-full max-w-md mt-6">
                <input
                  type="text"
                  value={sessionState.activeTaskGoal}
                  onChange={(e) => onSetTaskGoal(e.target.value)}
                  placeholder="What is your focus target for this session? (e.g. Master Optics Formulas)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-xs text-center text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={onResetTimer}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="Reset Interval"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onToggleTimer}
                  className={`flex h-14 px-8 items-center justify-center gap-2 rounded-2xl text-white font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer ${
                    sessionState.isRunning
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  {sessionState.isRunning ? (
                    <>
                      <Pause className="h-5 w-5" />
                      <span>Pause Focus</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 fill-white" />
                      <span>Start Interval</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onSkipInterval}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="Skip to Next Interval"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Cycle Tracker */}
              <div className="flex items-center gap-2 mt-8 text-xs text-slate-500">
                <span className="font-semibold">Cycle Progress:</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: config.cyclesBeforeLongBreak }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full transition-all ${
                        i < sessionState.completedWorkCycles % config.cyclesBeforeLongBreak
                          ? 'bg-indigo-600 scale-110'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2">({sessionState.completedWorkCycles} total intervals done)</span>
              </div>
            </div>
          )}

          {/* TAB 2: PROCEDURAL SOUNDSCAPES */}
          {activeTab === 'soundscapes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Pure Web Audio Soundscapes
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Procedural audio generated in real time in your browser without external audio files.
                  </p>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => onSetSoundVolume(soundscapeVolume > 0 ? 0 : 0.5)}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                  >
                    {soundscapeVolume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundscapeVolume}
                    onChange={(e) => onSetSoundVolume(parseFloat(e.target.value))}
                    className="h-1.5 w-24 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-500 w-8">
                    {Math.round(soundscapeVolume * 100)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SOUNDSCAPES.map((sc) => {
                  const isActive = activeSoundscape === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => onToggleSoundscape(sc.id)}
                      className={`relative flex flex-col justify-between rounded-2xl p-4 border transition-all cursor-pointer ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{sc.icon}</span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {sc.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sc.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {sc.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {isActive ? 'Playing Live' : 'Click to Play'}
                        </span>
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-white ${
                            isActive ? 'bg-indigo-600 shadow-sm' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STREAKS & ACTIVITY HEATMAP */}
          {activeTab === 'streaks' && (
            <div className="space-y-6">
              {/* Stat Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <div className="flex items-center gap-2 text-amber-500 mb-1">
                    <Flame className="h-4 w-4 fill-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {stats.currentStreak} <span className="text-xs font-normal text-slate-400">Days</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <div className="flex items-center gap-2 text-indigo-500 mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Longest Streak</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {stats.longestStreak} <span className="text-xs font-normal text-slate-400">Days</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <div className="flex items-center gap-2 text-emerald-500 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Focus</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {Math.floor(stats.totalFocusMinutes / 60)}h {stats.totalFocusMinutes % 60}m
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <div className="flex items-center gap-2 text-purple-500 mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Scholar XP</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {stats.totalXp} <span className="text-xs font-normal text-slate-400">XP</span>
                  </div>
                </div>
              </div>

              {/* 28-Day Study Heatmap */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      28-Day Active Study Heatmap
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>Less</span>
                    <span className="h-2.5 w-2.5 rounded-xs bg-slate-200 dark:bg-slate-700" />
                    <span className="h-2.5 w-2.5 rounded-xs bg-emerald-200 dark:bg-emerald-900" />
                    <span className="h-2.5 w-2.5 rounded-xs bg-emerald-400" />
                    <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
                    <span>More</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
                  {heatmapDays.map((d) => (
                    <div
                      key={d.date}
                      className={`flex flex-col items-center justify-center h-10 rounded-lg text-[10px] font-bold transition-transform hover:scale-105 cursor-pointer ${
                        d.intensity === 0
                          ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
                          : d.intensity === 1
                          ? 'bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : d.intensity === 2
                          ? 'bg-emerald-300 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : d.intensity === 3
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-600 text-white shadow-xs'
                      }`}
                      title={`${d.date}: ${d.minutes} min focused`}
                    >
                      <span>{d.dayNum}</span>
                      <span className="text-[8px] opacity-75">{d.minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MASTERY BADGES */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'focus', 'mastery', 'streak', 'exam'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setBadgeFilter(cat)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      badgeFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBadges.map((b) => {
                  const isUnlocked = b.unlockedAt !== null;
                  return (
                    <div
                      key={b.id}
                      className={`relative flex flex-col justify-between rounded-2xl p-4 border transition-all ${
                        isUnlocked
                          ? 'border-amber-400/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              isUnlocked
                                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                            }`}
                          >
                            <Award className="h-5 w-5" />
                          </div>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              b.tier === 'diamond'
                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300'
                                : b.tier === 'gold'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                : b.tier === 'silver'
                                ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300'
                            }`}
                          >
                            {b.tier}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {b.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {b.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          +{b.xpReward} XP
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {isUnlocked ? 'Unlocked ✓' : `${b.progress} / ${b.target}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: TIMER CONFIG */}
          {activeTab === 'settings' && (
            <div className="max-w-md mx-auto space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deep Work Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="90"
                  value={config.workMinutes}
                  onChange={(e) => onUpdateConfig({ workMinutes: parseInt(e.target.value) || 25 })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Short Recharge Break (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.shortBreakMinutes}
                  onChange={(e) => onUpdateConfig({ shortBreakMinutes: parseInt(e.target.value) || 5 })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Long Rest Break (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.longBreakMinutes}
                  onChange={(e) => onUpdateConfig({ longBreakMinutes: parseInt(e.target.value) || 15 })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Singing Bowl Completion Chimes
                </span>
                <input
                  type="checkbox"
                  checked={config.soundChime}
                  onChange={(e) => onUpdateConfig({ soundChime: e.target.checked })}
                  className="h-4 w-4 rounded-sm text-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Auto-Start Break Intervals
                </span>
                <input
                  type="checkbox"
                  checked={config.autoStartBreaks}
                  onChange={(e) => onUpdateConfig({ autoStartBreaks: e.target.checked })}
                  className="h-4 w-4 rounded-sm text-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Celebratory Badge Unlocked Modal */}
      {newlyUnlockedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative flex w-full max-w-sm flex-col items-center text-center rounded-3xl bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 border border-amber-300 dark:border-amber-700 shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
              <Award className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Mastery Badge Unlocked!
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {newlyUnlockedModal.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {newlyUnlockedModal.description}
            </p>
            <div className="mt-4 flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>+{newlyUnlockedModal.xpReward} Scholar XP</span>
            </div>
            <button
              type="button"
              onClick={onDismissUnlockedModal}
              className="mt-6 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 text-xs shadow-md transition-colors cursor-pointer"
            >
              Awesome! Keep Going
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
