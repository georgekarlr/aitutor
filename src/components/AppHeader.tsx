import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Settings,
  KeyRound,
  GraduationCap,
  MessageSquare,
  Radio,
  FolderDown,
  ShieldCheck,
  CreditCard,
  Check,
  Brain,
  Sparkles,
  FileUp,
  Timer,
  Layers,
  Flame,
  LayoutGrid,
  Workflow,
  Home,
} from 'lucide-react';
import type { Conversation, User, Subscription } from '@/types';
import { ChatExportMenu } from '@/components/ChatExportMenu';

interface AppHeaderProps {
  isDesktop: boolean;
  onOpenSidebar: () => void;
  activeView: 'home' | 'chat' | 'tutor';
  onSelectView: (view: 'home' | 'chat' | 'tutor') => void;
  hasActiveTutor: boolean;
  activeConversation: Conversation | null;
  onOpenExportImport: () => void;
  onOpenGeminiLive: () => void;
  onOpenAgentInspector?: () => void;
  onOpenScratchpad?: () => void;
  onOpenCurriculum?: () => void;
  onOpenDocumentIngestion?: () => void;
  onOpenMockExam?: () => void;
  onOpenWhiteboard?: () => void;
  onOpenFocusHub?: () => void;
  onOpenPodcast?: () => void;
  onOpenArchitecture?: () => void;
  focusStreakCount?: number;
  focusTimerText?: string;
  isFocusTimerRunning?: boolean;
  telemetryCount?: number;
  user: User | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  onOpenSubscription: () => void;
  onOpenAuth: () => void;
  hasKey: boolean;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  onOpenSettings: () => void;
}

export function AppHeader({
  isDesktop,
  onOpenSidebar,
  activeView,
  onSelectView,
  hasActiveTutor,
  activeConversation,
  onOpenExportImport,
  onOpenGeminiLive,
  onOpenAgentInspector,
  onOpenScratchpad,
  onOpenCurriculum,
  onOpenDocumentIngestion,
  onOpenMockExam,
  onOpenWhiteboard,
  onOpenFocusHub,
  onOpenPodcast,
  onOpenArchitecture,
  focusStreakCount = 0,
  focusTimerText,
  isFocusTimerRunning = false,
  telemetryCount = 0,
  user,
  subscription,
  hasActiveSubscription,
  onOpenSubscription,
  onOpenAuth,
  hasKey,
  onOpenSettings,
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile overflow menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const hasMessages = Boolean(activeConversation && activeConversation.messages.length > 0);

  return (
    <header className="flex h-14 w-full items-center justify-between gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs shrink-0 select-none z-30 flex-nowrap">
      {/* Left Section: Sidebar Toggle & View Switcher */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-nowrap">
        {!isDesktop && (
          <button
            onClick={onOpenSidebar}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Open sidebar drawer"
          >
            <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* View Switcher Segmented Control */}
        <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-0.5 shrink-0 flex-nowrap">
          <button
            type="button"
            onClick={() => onSelectView('home')}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeView === 'home'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Go to Home Dashboard"
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">Home</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('chat')}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeView === 'chat'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">Chat</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('tutor')}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeView === 'tutor'
                ? 'bg-sky-500 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">AI Tutor</span>
            <span className="xs:hidden whitespace-nowrap">Tutor</span>
            {hasActiveTutor && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Right Section: Actions & Utilities (Single Row, Adaptive Density) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
        {/* Gemini 3.7 Live Real-Time Mode Button */}
        <button
          type="button"
          onClick={onOpenGeminiLive}
          className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white px-2 sm:px-3 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
          title="Launch Gemini 3.7 Live Real-Time Voice & Vision Mode"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <Radio className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden md:inline font-semibold whitespace-nowrap">Gemini 3.7 Live</span>
          <span className="md:hidden font-semibold whitespace-nowrap">Live</span>
        </button>

        {/* Quick Export Dropdown for Active Chat (Desktop Only) */}
        {hasMessages && activeConversation && (
          <div className="hidden 2xl:block shrink-0">
            <ChatExportMenu
              conversation={activeConversation}
              onOpenFullModal={onOpenExportImport}
              variant="compact"
            />
          </div>
        )}

        {/* Import & Export Center Button (Desktop Only) */}
        <button
          type="button"
          onClick={onOpenExportImport}
          className="hidden 2xl:flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          title="Import or Export Chats (JSON, Markdown, Word, Text)"
        >
          <FolderDown className="h-3.5 w-3.5" />
          <span>Import/Export</span>
        </button>

        {/* Document & Textbook Ingestion Engine Pill (xl+ screens) */}
        {onOpenDocumentIngestion && (
          <button
            id="doc_ingestion_header_trigger"
            type="button"
            onClick={onOpenDocumentIngestion}
            className="hidden xl:flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Ingest Multi-page PDFs, Textbooks, Scans & Syllabi"
          >
            <FileUp className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Ingest Doc</span>
          </button>
        )}

        {/* Gamified Focus Hub & Pomodoro Pill (md+ screens) */}
        {onOpenFocusHub && (
          <button
            id="focus_hub_header_trigger"
            type="button"
            onClick={onOpenFocusHub}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Open Focus Hub, Procedural Soundscapes, Pomodoro & Streaks"
          >
            <Flame className={`h-3.5 w-3.5 ${focusStreakCount > 0 ? 'text-amber-500 fill-amber-500' : 'text-amber-500'}`} />
            <span>Focus</span>
            {focusTimerText ? (
              <span className={`font-mono text-[11px] font-bold ${isFocusTimerRunning ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-amber-700 dark:text-amber-300'}`}>
                {focusTimerText}
              </span>
            ) : focusStreakCount > 0 ? (
              <span className="font-bold text-[11px] text-amber-700 dark:text-amber-300">
                {focusStreakCount}d
              </span>
            ) : null}
          </button>
        )}

        {/* Interactive Visual Whiteboard Pill (md+ screens) */}
        {onOpenWhiteboard && (
          <button
            id="whiteboard_header_trigger"
            type="button"
            onClick={onOpenWhiteboard}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Open Interactive Audio-Visual Whiteboard & Walkthroughs"
          >
            <Layers className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Whiteboard</span>
          </button>
        )}

        {/* Dual-Host Spoken Audio Podcast Pill (lg+ screens) */}
        {onOpenPodcast && (
          <button
            id="podcast_header_trigger"
            type="button"
            onClick={onOpenPodcast}
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Generate & Listen to Dual-Host Audio Briefings ('NotebookLM-Style')"
          >
            <Radio className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span>Podcast</span>
          </button>
        )}

        {/* Timed Mock Exam & Proctoring Mode Pill (xl+ screens) */}
        {onOpenMockExam && (
          <button
            id="mock_exam_header_trigger"
            type="button"
            onClick={onOpenMockExam}
            className="hidden xl:flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Launch Timed Mock Exam & Socratic Proctoring Simulator"
          >
            <Timer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Mock Exam</span>
          </button>
        )}

        {/* Taskmaster Curriculum Studio Pill (xl+ screens) */}
        {onOpenCurriculum && (
          <button
            id="curriculum_header_trigger"
            type="button"
            onClick={onOpenCurriculum}
            className="hidden xl:flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Open Taskmaster Curriculum & Syllabus Studio"
          >
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Curriculum</span>
          </button>
        )}

        {/* Live Scratchpad & Notes Pill (2xl+ screens) */}
        {onOpenScratchpad && (
          <button
            id="scratchpad_header_trigger"
            type="button"
            onClick={onOpenScratchpad}
            className="hidden 2xl:flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Open Live Scratchpad, AI Notes & Active Recall Flashcards"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Notes</span>
          </button>
        )}

        {/* Agent Telemetry & Knowledge Graph Inspector Pill (2xl+ screens) */}
        {onOpenAgentInspector && (
          <button
            id="agent_telemetry_header_trigger"
            type="button"
            onClick={onOpenAgentInspector}
            className="hidden 2xl:flex items-center gap-1.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Open Agent Observability, Telemetry & Student Knowledge Graph"
          >
            <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Telemetry</span>
            {telemetryCount > 0 && (
              <span className="rounded-full bg-purple-200 dark:bg-purple-900 px-1.5 py-0.2 text-[10px] font-bold text-purple-800 dark:text-purple-200">
                {telemetryCount}
              </span>
            )}
          </button>
        )}

        {/* System Architecture Diagram & PDF Exporter Pill (xl+ screens) */}
        {onOpenArchitecture && (
          <button
            id="architecture_header_trigger"
            type="button"
            onClick={onOpenArchitecture}
            className="hidden xl:flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Open System Architecture Diagram & Downloadable PDF"
          >
            <Workflow className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Architecture</span>
          </button>
        )}

        {/* Subscription Days Status Pill (2xl+ Screens) */}
        <button
          type="button"
          onClick={onOpenSubscription}
          className="hidden 2xl:flex items-center gap-1.5 rounded-xl border border-sky-200/80 dark:border-sky-800/80 bg-sky-50/60 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-2 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          title={`Plan: ${subscription?.product_name || 'Active'} (${subscription?.days_remaining ?? 0} days remaining)`}
        >
          <span className={`h-2 w-2 rounded-full ${hasActiveSubscription ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="font-mono text-[11px]">{subscription?.days_remaining ?? 0}d</span>
        </button>

        {/* User Account Pill (2xl+ Screens) */}
        {user && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="hidden 2xl:flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title={`Signed in as ${user.email}`}
          >
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="max-w-[80px] truncate">{user.email}</span>
          </button>
        )}

        {/* Missing API Key Warning Pill (Desktop) */}
        {!hasKey && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors shrink-0 cursor-pointer"
            title="API Key required to chat"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Set API key</span>
          </button>
        )}

        {/* Tools Menu & Overflow Trigger (Responsive dropdown for all tools) */}
        <div className="relative shrink-0" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer ${
              mobileMenuOpen ? 'border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400/20' : ''
            }`}
            aria-label="Tools menu"
            title="Open Tools & Quick Actions Menu"
          >
            <LayoutGrid className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline text-xs font-semibold">Tools</span>
          </button>

          {/* Tools & Features Dropdown Menu */}
          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs sm:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.25rem)] max-h-[80vh] overflow-y-auto origin-top-right rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border border-slate-200 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Interactive Studio Tools
                </p>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                  Agent Suite
                </span>
              </div>

              {/* Focus Hub & Mastery Streaks */}
              {onOpenFocusHub && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenFocusHub();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left cursor-pointer"
                >
                  <Flame className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">Focus Hub & Streaks</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">
                      {focusStreakCount > 0 ? `${focusStreakCount}-Day Streak • ` : ''}Pomodoro & Synth Audio
                    </p>
                  </div>
                </button>
              )}

              {/* Interactive Visual Whiteboard */}
              {onOpenWhiteboard && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenWhiteboard();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-left cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-sky-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">Visual Whiteboard</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">Step-by-Step Audio Visualizer</p>
                  </div>
                </button>
              )}

              {/* Dual-Host Spoken Audio Podcast */}
              {onOpenPodcast && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPodcast();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left cursor-pointer"
                >
                  <Radio className="h-4 w-4 text-rose-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">Audio Briefing (Podcast)</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">NotebookLM Dual-Host Spoken Audio</p>
                  </div>
                </button>
              )}

              {/* Document & Textbook Ingestion Engine */}
              {onOpenDocumentIngestion && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDocumentIngestion();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                >
                  <FileUp className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">Document & Book Ingestion</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">PDFs, Scans, Notes & Syllabi</p>
                  </div>
                </button>
              )}

              {/* Timed Mock Exam & Proctoring Mode */}
              {onOpenMockExam && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMockExam();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left cursor-pointer"
                >
                  <Timer className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">Timed Mock Exam</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">Proctored Exam Simulator</p>
                  </div>
                </button>
              )}

              {/* Taskmaster Curriculum Studio */}
              {onOpenCurriculum && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCurriculum();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  <GraduationCap className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">Taskmaster Curriculum</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">Syllabus & Course Milestones</p>
                  </div>
                </button>
              )}

              {/* Live Scratchpad & Notes */}
              {onOpenScratchpad && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenScratchpad();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">Live Scratchpad & Notes</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">Notes, Flashcards & Scaffolding</p>
                  </div>
                </button>
              )}

              {/* Agent Observability & Telemetry */}
              {onOpenAgentInspector && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAgentInspector();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left cursor-pointer"
                >
                  <Brain className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold">Agent Telemetry & KG</p>
                      {telemetryCount > 0 && (
                        <span className="rounded-full bg-purple-100 dark:bg-purple-950 px-1.5 py-0.2 text-[9px] font-bold text-purple-700 dark:text-purple-300">
                          {telemetryCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-normal text-slate-400 truncate">Traces & Knowledge Graph</p>
                  </div>
                </button>
              )}

              {/* System Architecture Diagram & PDF Exporter */}
              {onOpenArchitecture && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenArchitecture();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                >
                  <Workflow className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">System Architecture</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">Diagram & Downloadable PDF</p>
                  </div>
                </button>
              )}

              <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspace & Account
              </div>

              {/* Import & Export Center */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenExportImport();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-left cursor-pointer"
              >
                <FolderDown className="h-4 w-4 text-sky-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">Import & Export Center</p>
                  <p className="text-[10px] font-normal text-slate-400 truncate">JSON, Markdown, DOCX</p>
                </div>
              </button>

              {/* Subscription Status & Details */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSubscription();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <CreditCard className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">Subscription Status</p>
                  <p className="text-[10px] font-normal text-slate-400 truncate">
                    {subscription?.days_remaining ?? 0} days remaining
                  </p>
                </div>
              </button>

              {/* User Account */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">Student Account</p>
                  <p className="text-[10px] font-normal text-slate-400 truncate">
                    {user?.email || 'Sign in details'}
                  </p>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              {/* API Key status / Settings */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <KeyRound className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="truncate">Gemini API Key</span>
                </div>
                {hasKey ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                    <Check className="h-3 w-3" />
                    Set
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md">
                    Required
                  </span>
                )}
              </button>
            </div>
            </>
          )}
        </div>

        {/* Settings Gear Button (Always Visible) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="Open Settings"
          title={!hasKey ? 'Settings (API Key Required)' : 'Settings'}
        >
          <Settings className="h-4 w-4" />
          {!hasKey && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
