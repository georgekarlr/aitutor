import { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  Radio,
  Search,
  ShieldCheck,
  Zap,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import type { User, Subscription } from '@/types';

interface HomeHeroProps {
  user: User | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  hasKey: boolean;
  focusStreakCount: number;
  onStartChat: (prompt?: string) => void;
  onStartTutor: (topic?: string) => void;
  onOpenGeminiLive: (topic?: string) => void;
  onOpenSettings: () => void;
}

export function HomeHero({
  user,
  subscription,
  hasActiveSubscription,
  hasKey,
  focusStreakCount,
  onStartChat,
  onStartTutor,
  onOpenGeminiLive,
  onOpenSettings,
}: HomeHeroProps) {
  const [searchTopic, setSearchTopic] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = useMemo(() => {
    if (!user?.email) return 'Scholar';
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTopic.trim()) {
      onStartChat(searchTopic.trim());
    } else {
      onStartChat();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-sky-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-6 sm:p-8 md:p-10 shadow-sm">
      {/* Background Decorative Gradients */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/80 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/80 px-3 py-1 text-xs font-semibold text-sky-800 dark:text-sky-300">
              <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Gemini 3.7 Flash Exclusive · 1M Token Context</span>
            </span>

            {hasActiveSubscription && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{subscription?.product_name || 'Active Student Plan'}</span>
              </span>
            )}
          </div>

          {focusStreakCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>{focusStreakCount} Day Study Streak</span>
            </span>
          )}
        </div>

        {/* Hero Title & Description */}
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">{userName}</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Welcome to your intelligent learning companion. Explore complex concepts, practice interactive quizzes, generate visual whiteboards, and engage in real-time spoken Socratic dialogues.
          </p>
        </div>

        {/* Interactive Search & Fast Launch Input */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="What topic or problem would you like to master today? (e.g., Photosynthesis, Neural Networks, MCAT Prep...)"
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 py-3.5 pl-12 pr-28 sm:pr-32 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
            <button
              type="submit"
              className="absolute right-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3 sm:px-4 py-2 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onStartChat(searchTopic || undefined)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-sky-400 dark:text-sky-600" />
            <span>Start AI Research Chat</span>
          </button>

          <button
            type="button"
            onClick={() => onStartTutor(searchTopic || undefined)}
            className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Launch Socratic Quiz & Flashcards</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenGeminiLive(searchTopic || undefined)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Radio className="h-4 w-4" />
            <span>Spoken Voice & Vision Live</span>
          </button>

          {!hasKey && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3.5 py-2.5 text-xs font-semibold hover:bg-amber-100 transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Configure Gemini API Key</span>
            </button>
          )}
        </div>

        {/* Feature Highlights Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Zero Data Leakage (Local Storage)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
            <span>Full 64k Output Token Ceiling</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>6 Multi-Agent Autonomous Fleet</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
            <span>DOCX, PDF & Markdown Export</span>
          </div>
        </div>
      </div>
    </div>
  );
}
