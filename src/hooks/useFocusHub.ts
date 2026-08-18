/**
 * React Hook for Pomodoro Timer, Procedural Soundscapes, and Gamified Mastery Streaks.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  PomodoroMode,
  PomodoroConfig,
  PomodoroSessionState,
  SoundscapeType,
  FocusHubStats,
  MasteryBadge,
} from '@/types';
import {
  loadPomodoroConfig,
  savePomodoroConfig,
  loadFocusHubStats,
  recordStudyActivity,
  getEnrichedBadges,
} from '@/lib/focusStorage';
import { proceduralAudio } from '@/lib/proceduralAudio';

export interface UseFocusHubOptions {
  isVoiceActive?: boolean;
}

export function useFocusHub(options: UseFocusHubOptions = {}) {
  const [config, setConfig] = useState<PomodoroConfig>(loadPomodoroConfig);
  const [stats, setStats] = useState<FocusHubStats>(loadFocusHubStats);
  const [enrichedBadges, setEnrichedBadges] = useState<MasteryBadge[]>(() =>
    getEnrichedBadges(loadFocusHubStats())
  );

  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsRemaining, setSecondsRemaining] = useState(config.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedWorkCycles, setCompletedWorkCycles] = useState(0);
  const [activeTaskGoal, setActiveTaskGoal] = useState('');

  // Soundscape
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType | null>(null);
  const [soundscapeVolume, setSoundscapeVolume] = useState(config.soundscapeVolume);
  const [newlyUnlockedModal, setNewlyUnlockedModal] = useState<MasteryBadge | null>(null);

  const lastTickTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update badges whenever stats change
  useEffect(() => {
    setEnrichedBadges(getEnrichedBadges(stats));
  }, [stats]);

  // Pause soundscape and timer when voice mode is active (to avoid feedback loop)
  useEffect(() => {
    if (options.isVoiceActive && isRunning) {
      setIsRunning(false);
      if (activeSoundscape) {
        proceduralAudio.stop();
      }
    }
  }, [options.isVoiceActive, isRunning, activeSoundscape]);

  // Handle mode duration switches
  const getModeDurationSeconds = useCallback(
    (targetMode: PomodoroMode): number => {
      if (targetMode === 'work') return config.workMinutes * 60;
      if (targetMode === 'short_break') return config.shortBreakMinutes * 60;
      return config.longBreakMinutes * 60;
    },
    [config]
  );

  // Switch interval mode
  const switchMode = useCallback(
    (newMode: PomodoroMode) => {
      setMode(newMode);
      setSecondsRemaining(getModeDurationSeconds(newMode));
      setIsRunning(false);
    },
    [getModeDurationSeconds]
  );

  const handleIntervalFinished = useCallback(() => {
    setIsRunning(false);

    if (config.soundChime) {
      proceduralAudio.playCompletionChime();
    }

    if (mode === 'work') {
      const newCompleted = completedWorkCycles + 1;
      setCompletedWorkCycles(newCompleted);

      // Record focus activity & check streak/badges
      const { stats: updatedStats, newlyUnlockedBadges } = recordStudyActivity({
        focusMinutes: config.workMinutes,
        pomodoroCompleted: true,
      });
      setStats(updatedStats);
      if (newlyUnlockedBadges.length > 0) {
        setNewlyUnlockedModal(newlyUnlockedBadges[0]);
      }

      // Transition to break
      const isLong = newCompleted % config.cyclesBeforeLongBreak === 0;
      const nextMode: PomodoroMode = isLong ? 'long_break' : 'short_break';
      setMode(nextMode);
      setSecondsRemaining(getModeDurationSeconds(nextMode));

      if (config.autoStartBreaks) {
        setIsRunning(true);
      }
    } else {
      // Break finished -> back to work
      setMode('work');
      setSecondsRemaining(getModeDurationSeconds('work'));
    }
  }, [mode, completedWorkCycles, config, getModeDurationSeconds]);

  // Timer Tick Mechanism
  useEffect(() => {
    if (!isRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    lastTickTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.max(1, Math.round((now - lastTickTimeRef.current) / 1000));
      lastTickTimeRef.current = now;

      setSecondsRemaining((prev) => {
        if (prev <= deltaSeconds) {
          // Interval Completed!
          handleIntervalFinished();
          return 0;
        }
        return prev - deltaSeconds;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRunning, handleIntervalFinished]);

  // Controls
  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => {
      const next = !prev;
      proceduralAudio.playTickTone();
      return next;
    });
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setSecondsRemaining(getModeDurationSeconds(mode));
  }, [mode, getModeDurationSeconds]);

  const skipInterval = useCallback(() => {
    handleIntervalFinished();
  }, [handleIntervalFinished]);

  const updateConfig = useCallback((newConfig: Partial<PomodoroConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      savePomodoroConfig(merged);
      return merged;
    });
  }, []);

  // Soundscape toggling
  const toggleSoundscape = useCallback(
    (type: SoundscapeType) => {
      if (activeSoundscape === type) {
        proceduralAudio.stop();
        setActiveSoundscape(null);
      } else {
        proceduralAudio.play(type, soundscapeVolume);
        setActiveSoundscape(type);
      }
    },
    [activeSoundscape, soundscapeVolume]
  );

  const setSoundVolume = useCallback((vol: number) => {
    setSoundscapeVolume(vol);
    proceduralAudio.setVolume(vol);
    updateConfig({ soundscapeVolume: vol });
  }, [updateConfig]);

  const recordManualStudyActivity = useCallback(
    (action: {
      quizCompleted?: boolean;
      flashcardsReviewed?: number;
      whiteboardViewed?: boolean;
      examCompleted?: boolean;
      chatMessageSent?: boolean;
    }) => {
      const { stats: updatedStats, newlyUnlockedBadges } = recordStudyActivity(action);
      setStats(updatedStats);
      if (newlyUnlockedBadges.length > 0) {
        setNewlyUnlockedModal(newlyUnlockedBadges[0]);
      }
    },
    []
  );

  const sessionState: PomodoroSessionState = {
    mode,
    secondsRemaining,
    isRunning,
    completedWorkCycles,
    totalFocusMinutes: stats.totalFocusMinutes,
    activeTaskGoal,
  };

  return {
    config,
    updateConfig,
    stats,
    badges: enrichedBadges,
    sessionState,
    activeSoundscape,
    soundscapeVolume,
    newlyUnlockedModal,
    setNewlyUnlockedModal,
    setActiveTaskGoal,
    toggleTimer,
    resetTimer,
    skipInterval,
    switchMode,
    toggleSoundscape,
    setSoundVolume,
    recordManualStudyActivity,
  };
}
