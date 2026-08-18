/**
 * Gamified Focus Hub, Streaks & Mastery Badges Storage.
 * Tracks daily study activity, Pomodoro logs, XP progression, and badge unlocks.
 */

import type { FocusHubStats, MasteryBadge, PomodoroConfig } from '@/types';

const FOCUS_STORAGE_KEY = 'aitutor_focus_hub_stats_v1';
const POMODORO_CONFIG_KEY = 'aitutor_pomodoro_config_v1';

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: true,
  soundChime: true,
  soundscapeVolume: 0.5,
};

export const MASTER_BADGES_CATALOG: MasteryBadge[] = [
  {
    id: 'first_session',
    title: 'First Step to Mastery',
    description: 'Complete your very first focused study or Pomodoro session.',
    icon: 'Sparkles',
    category: 'focus',
    tier: 'bronze',
    unlockedAt: null,
    progress: 0,
    target: 1,
    xpReward: 50,
  },
  {
    id: 'focus_deep_4',
    title: 'Deep Focus Titan',
    description: 'Complete 4 full Pomodoro focus intervals in a single day.',
    icon: 'Flame',
    category: 'focus',
    tier: 'silver',
    unlockedAt: null,
    progress: 0,
    target: 4,
    xpReward: 150,
  },
  {
    id: 'streak_3',
    title: 'Habit Builder',
    description: 'Maintain a 3-day continuous active study streak.',
    icon: 'Calendar',
    category: 'streak',
    tier: 'bronze',
    unlockedAt: null,
    progress: 0,
    target: 3,
    xpReward: 100,
  },
  {
    id: 'streak_7',
    title: 'Unstoppable Momentum',
    description: 'Maintain a 7-day continuous active study streak.',
    icon: 'Zap',
    category: 'streak',
    tier: 'gold',
    unlockedAt: null,
    progress: 0,
    target: 7,
    xpReward: 300,
  },
  {
    id: 'quiz_master_10',
    title: 'Active Recall Champion',
    description: 'Complete 10 or more AI Tutor quizzes with active scoring.',
    icon: 'GraduationCap',
    category: 'mastery',
    tier: 'silver',
    unlockedAt: null,
    progress: 0,
    target: 10,
    xpReward: 200,
  },
  {
    id: 'flashcard_virtuoso_30',
    title: 'Spaced Repetition Virtuoso',
    description: 'Review 30 or more active recall flashcards.',
    icon: 'Layers',
    category: 'mastery',
    tier: 'silver',
    unlockedAt: null,
    progress: 0,
    target: 30,
    xpReward: 200,
  },
  {
    id: 'whiteboard_pioneer_3',
    title: 'Visual Diagram Master',
    description: 'Explore and annotate 3 interactive vector whiteboard walkthroughs.',
    icon: 'PenTool',
    category: 'mastery',
    tier: 'gold',
    unlockedAt: null,
    progress: 0,
    target: 3,
    xpReward: 250,
  },
  {
    id: 'mock_exam_gladiator',
    title: 'Exam Room Gladiator',
    description: 'Complete a Timed Mock Exam with high score accuracy.',
    icon: 'ShieldCheck',
    category: 'exam',
    tier: 'diamond',
    unlockedAt: null,
    progress: 0,
    target: 1,
    xpReward: 500,
  },
  {
    id: 'midnight_alchemist',
    title: 'Midnight Alchemist',
    description: 'Complete an active recall study session during late hours (11 PM - 4 AM).',
    icon: 'Moon',
    category: 'focus',
    tier: 'silver',
    unlockedAt: null,
    progress: 0,
    target: 1,
    xpReward: 150,
  },
];

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadPomodoroConfig(): PomodoroConfig {
  try {
    const raw = localStorage.getItem(POMODORO_CONFIG_KEY);
    if (!raw) return DEFAULT_POMODORO_CONFIG;
    return { ...DEFAULT_POMODORO_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_POMODORO_CONFIG;
  }
}

export function savePomodoroConfig(config: PomodoroConfig) {
  try {
    localStorage.setItem(POMODORO_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Pomodoro config:', err);
  }
}

export function loadFocusHubStats(): FocusHubStats {
  const today = getTodayString();
  const defaultStats: FocusHubStats = {
    currentStreak: 0,
    longestStreak: 0,
    totalFocusMinutes: 0,
    totalPomodoroSessions: 0,
    lastStudyDate: '',
    dailyLogs: {},
    unlockedBadgeIds: [],
    totalXp: 0,
  };

  try {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (!raw) return defaultStats;
    const parsed: FocusHubStats = JSON.parse(raw);

    // Validate streak continuity
    const yesterday = getYesterdayString();
    if (parsed.lastStudyDate && parsed.lastStudyDate !== today && parsed.lastStudyDate !== yesterday) {
      // Streak broken if last study date is older than yesterday
      parsed.currentStreak = 0;
    }

    return parsed;
  } catch {
    return defaultStats;
  }
}

export function saveFocusHubStats(stats: FocusHubStats) {
  try {
    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save focus hub stats:', err);
  }
}

/**
 * Records study activity and recalculates streak and badges.
 */
export function recordStudyActivity(
  action: {
    focusMinutes?: number;
    pomodoroCompleted?: boolean;
    quizCompleted?: boolean;
    flashcardsReviewed?: number;
    whiteboardViewed?: boolean;
    examCompleted?: boolean;
    chatMessageSent?: boolean;
  }
): { stats: FocusHubStats; newlyUnlockedBadges: MasteryBadge[] } {
  const stats = loadFocusHubStats();
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (!stats.dailyLogs[today]) {
    stats.dailyLogs[today] = {
      date: today,
      focusMinutes: 0,
      quizzesCompleted: 0,
      flashcardsReviewed: 0,
      whiteboardsViewed: 0,
      examsCompleted: 0,
      chatMessages: 0,
    };
  }

  const log = stats.dailyLogs[today];

  // Update metrics
  if (action.focusMinutes) {
    log.focusMinutes += action.focusMinutes;
    stats.totalFocusMinutes += action.focusMinutes;
    stats.totalXp += action.focusMinutes * 2; // 2 XP per focus minute
  }

  if (action.pomodoroCompleted) {
    stats.totalPomodoroSessions += 1;
    stats.totalXp += 25; // 25 XP per Pomodoro session
  }

  if (action.quizCompleted) {
    log.quizzesCompleted += 1;
    stats.totalXp += 30;
  }

  if (action.flashcardsReviewed) {
    log.flashcardsReviewed += action.flashcardsReviewed;
    stats.totalXp += action.flashcardsReviewed * 5;
  }

  if (action.whiteboardViewed) {
    log.whiteboardsViewed += 1;
    stats.totalXp += 40;
  }

  if (action.examCompleted) {
    log.examsCompleted += 1;
    stats.totalXp += 100;
  }

  if (action.chatMessageSent) {
    log.chatMessages += 1;
    stats.totalXp += 2;
  }

  // Update streak
  if (stats.lastStudyDate !== today) {
    if (stats.lastStudyDate === yesterday) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }
    stats.lastStudyDate = today;
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
  }

  // Evaluate badges
  const newlyUnlocked: MasteryBadge[] = [];
  const currentHour = new Date().getHours();
  const isNightHour = currentHour >= 23 || currentHour < 4;

  const totalQuizzes = Object.values(stats.dailyLogs).reduce((acc, l) => acc + (l.quizzesCompleted || 0), 0);
  const totalCards = Object.values(stats.dailyLogs).reduce((acc, l) => acc + (l.flashcardsReviewed || 0), 0);
  const totalWhiteboards = Object.values(stats.dailyLogs).reduce((acc, l) => acc + (l.whiteboardsViewed || 0), 0);
  const totalExams = Object.values(stats.dailyLogs).reduce((acc, l) => acc + (l.examsCompleted || 0), 0);
  const todayPomodoros = log.focusMinutes >= 25 ? Math.floor(log.focusMinutes / 25) : 0;

  for (const b of MASTER_BADGES_CATALOG) {
    if (stats.unlockedBadgeIds.includes(b.id)) continue;

    let isUnlocked = false;

    if (b.id === 'first_session' && (stats.totalPomodoroSessions >= 1 || stats.totalFocusMinutes >= 15)) {
      isUnlocked = true;
    } else if (b.id === 'focus_deep_4' && (todayPomodoros >= 4 || stats.totalPomodoroSessions >= 4)) {
      isUnlocked = true;
    } else if (b.id === 'streak_3' && stats.currentStreak >= 3) {
      isUnlocked = true;
    } else if (b.id === 'streak_7' && stats.currentStreak >= 7) {
      isUnlocked = true;
    } else if (b.id === 'quiz_master_10' && totalQuizzes >= 10) {
      isUnlocked = true;
    } else if (b.id === 'flashcard_virtuoso_30' && totalCards >= 30) {
      isUnlocked = true;
    } else if (b.id === 'whiteboard_pioneer_3' && totalWhiteboards >= 3) {
      isUnlocked = true;
    } else if (b.id === 'mock_exam_gladiator' && totalExams >= 1) {
      isUnlocked = true;
    } else if (b.id === 'midnight_alchemist' && isNightHour && (action.quizCompleted || action.focusMinutes)) {
      isUnlocked = true;
    }

    if (isUnlocked) {
      stats.unlockedBadgeIds.push(b.id);
      stats.totalXp += b.xpReward;
      newlyUnlocked.push({ ...b, unlockedAt: Date.now() });
    }
  }

  saveFocusHubStats(stats);
  return { stats, newlyUnlockedBadges: newlyUnlocked };
}

/**
 * Returns complete badges list enriched with unlock dates and live progress.
 */
export function getEnrichedBadges(stats: FocusHubStats): MasteryBadge[] {
  const totalQuizzes = Object.values(stats.dailyLogs).reduce((acc, l) => acc + (l.quizzesCompleted || 0), 0);
  const totalCards = Object.values(stats.dailyLogs).reduce((acc, l) => acc + (l.flashcardsReviewed || 0), 0);
  const totalWhiteboards = Object.values(stats.dailyLogs).reduce((acc, l) => acc + (l.whiteboardsViewed || 0), 0);
  const totalExams = Object.values(stats.dailyLogs).reduce((acc, l) => acc + (l.examsCompleted || 0), 0);

  return MASTER_BADGES_CATALOG.map((b) => {
    const isUnlocked = stats.unlockedBadgeIds.includes(b.id);
    let currentProgress = 0;

    if (b.id === 'first_session') currentProgress = Math.min(1, stats.totalPomodoroSessions);
    else if (b.id === 'focus_deep_4') currentProgress = Math.min(4, stats.totalPomodoroSessions);
    else if (b.id === 'streak_3') currentProgress = Math.min(3, stats.currentStreak);
    else if (b.id === 'streak_7') currentProgress = Math.min(7, stats.currentStreak);
    else if (b.id === 'quiz_master_10') currentProgress = Math.min(10, totalQuizzes);
    else if (b.id === 'flashcard_virtuoso_30') currentProgress = Math.min(30, totalCards);
    else if (b.id === 'whiteboard_pioneer_3') currentProgress = Math.min(3, totalWhiteboards);
    else if (b.id === 'mock_exam_gladiator') currentProgress = Math.min(1, totalExams);
    else if (b.id === 'midnight_alchemist') currentProgress = isUnlocked ? 1 : 0;

    return {
      ...b,
      unlockedAt: isUnlocked ? Date.now() : null,
      progress: isUnlocked ? b.target : currentProgress,
    };
  });
}
