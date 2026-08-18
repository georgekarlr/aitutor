import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Layers,
  Mic,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Trophy,
  Loader2,
  Send,
  BarChart3,
  Award,
  Radio,
  Search,
  BookOpen,
  FileDown,
  BookmarkCheck,
  Bookmark,
  X,
} from 'lucide-react';
import type { Conversation, TutorMode, GeminiSettings } from '@/types';
import { VoiceOneOnOneSession } from './VoiceOneOnOneSession';
import { FactAndQuestionExplorer } from './FactAndQuestionExplorer';
import { ReadAloudButton, VoiceInputButton, AutoReadToggle } from './VoiceReadInputControls';
import { ConversationSourceSelector } from './ConversationSourceSelector';
import { useStudyBank } from '@/hooks/useStudyBank';
import { exportStudyItemToDocx } from '@/lib/docxExport';
import { createStudyItemFromTutorSession } from '@/lib/studyBankStorage';

interface TutorWorkspaceProps {
  settings: GeminiSettings;
  conversation: Conversation | null;
  conversations?: Conversation[];
  onStartSession: (
    mode: Exclude<TutorMode, 'chat'>,
    topic: string,
    numItems: number,
    absorbContext: boolean,
    previousQuestions?: string[],
    sourceConversation?: Conversation | null,
  ) => void;
  onSubmitAnswer: (answer: string) => void;
  onNextQuestion: () => void;
  onRestartSession: () => void;
  onResetSetup: () => void;
  onStopSession: () => void;
  onOpenGeminiLive?: (topic?: string) => void;
  onOpenStudyBank?: () => void;
  onClearError?: () => void;
  onCancelGeneration?: () => void;
}

export default function TutorWorkspace({
  settings,
  conversation,
  conversations = [],
  onStartSession,
  onSubmitAnswer,
  onNextQuestion,
  onRestartSession,
  onResetSetup,
  onStopSession,
  onOpenGeminiLive,
  onOpenStudyBank,
  onClearError,
  onCancelGeneration,
}: TutorWorkspaceProps) {
  const session = conversation?.tutorSession;
  const questions = session?.questions ?? [];
  const answers = session?.answers ?? [];
  const mode = session?.mode ?? 'quiz';
  const topicText = session?.topic ?? 'General Knowledge';
  const currentStep = session?.currentStep ?? 1;
  const totalSteps = session?.totalSteps ?? (questions.length || 1);
  const score = session?.score ?? 0;
  const maxScore = session?.maxScore ?? 0;
  const sessionState = session?.state ?? 'setup';

  const { saveSession } = useStudyBank();
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // Sub view switcher: standard | voice_session | fact_explorer
  const [activeSubView, setActiveSubView] = useState<'standard' | 'voice_session' | 'fact_explorer'>('standard');
  const [voiceSeed, setVoiceSeed] = useState<string | undefined>(undefined);
  const [autoRead, setAutoRead] = useState(true);

  // Setup view state & Grounding Conversation Selection
  const [selectedSourceConvId, setSelectedSourceConvId] = useState<string | null>(conversation?.id || null);
  const [selectedMode, setSelectedMode] = useState<'quiz' | 'flashcard'>('quiz');
  const [topic, setTopic] = useState(() => {
    if (conversation && conversation.title && conversation.title !== 'New chat') {
      return conversation.title;
    }
    return '';
  });
  const [numItems, setNumItems] = useState(5);
  const [absorbContext, setAbsorbContext] = useState(true);

  // Keep selectedSourceConvId in sync if active conversation changes
  useEffect(() => {
    if (conversation?.id && !selectedSourceConvId) {
      setSelectedSourceConvId(conversation.id);
    }
  }, [conversation?.id, selectedSourceConvId]);

  const selectedSourceConv = useMemo(() => {
    if (!selectedSourceConvId) return null;
    return conversations.find((c) => c.id === selectedSourceConvId) || (conversation?.id === selectedSourceConvId ? conversation : null);
  }, [conversations, selectedSourceConvId, conversation]);

  // Question view state
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);

  // Reset question sub-states on step change
  useEffect(() => {
    setUserAnswer('');
    setShowHint(false);
    setIsFlashcardFlipped(false);
  }, [currentStep, sessionState]);

  // Helper to save current session to IndexedDB
  const handleSaveCurrentSession = async () => {
    if (!session || questions.length === 0) return;
    const item = await saveSession(
      session,
      undefined,
      conversation?.id,
      conversation?.title,
    );
    setSaveSuccessToast(`Saved "${item.title}" to IndexedDB Study Vault!`);
    setTimeout(() => setSaveSuccessToast(null), 3500);
  };

  // Helper to export current session to docx
  const handleExportCurrentSessionDocx = async () => {
    if (!session || questions.length === 0) return;
    try {
      setIsExportingDocx(true);
      const item = createStudyItemFromTutorSession(
        session,
        undefined,
        conversation?.id,
        conversation?.title,
      );
      await exportStudyItemToDocx(item);
      setSaveSuccessToast('Exported formatted DOCX (Questions + Answer Key at end)!');
      setTimeout(() => setSaveSuccessToast(null), 3500);
    } catch {
      alert('Failed to generate DOCX file.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // If activeSubView is voice_session or fact_explorer, render those dedicated components directly!
  if (activeSubView === 'voice_session') {
    return (
      <VoiceOneOnOneSession
        settings={settings}
        topic={topic.trim() || conversation?.title || 'General Knowledge'}
        initialSeed={voiceSeed}
        onClose={() => setActiveSubView('standard')}
      />
    );
  }

  if (activeSubView === 'fact_explorer') {
    return (
      <FactAndQuestionExplorer
        settings={settings}
        topic={topic.trim() || conversation?.title || 'General Knowledge'}
        contextText={conversation?.messages?.map((m) => m.content).join('\n')}
        conversationId={conversation?.id}
        conversationTitle={conversation?.title}
        onStartVoiceSession={(selectedTopic, seed) => {
          setTopic(selectedTopic);
          setVoiceSeed(seed);
          setActiveSubView('voice_session');
        }}
        onBackToSetup={() => setActiveSubView('standard')}
      />
    );
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userAnswer.trim() || session?.isEvaluating) return;
    onSubmitAnswer(userAnswer);
    setUserAnswer('');
    setShowHint(false);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTopic = topic.trim() || selectedSourceConv?.title || conversation?.title || 'General Knowledge';
    if (onClearError) onClearError();
    onStartSession(selectedMode, finalTopic, numItems, absorbContext, undefined, selectedSourceConv);
  };

  // Dedicated loading state while generating questions (takes precedence)
  if (session?.isGenerating) {
    return (
      <div className="mx-auto max-w-2xl p-6 sm:p-8 text-center w-full">
        <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Generating Your AI Tutor Session...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1.5 leading-relaxed">
              Crafting tailored questions for <span className="font-semibold text-slate-700 dark:text-slate-200">"{topicText || topic || 'Selected Topic'}"</span> using Gemini 3.7 Flash.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (onCancelGeneration) {
                  onCancelGeneration();
                } else {
                  onResetSetup();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <X className="h-3.5 w-3.5" />
              Cancel & Return to Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no session exists, in setup state, or active without questions
  if (!session || sessionState === 'setup' || (sessionState !== 'setup' && questions.length === 0)) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6 w-full">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Interactive AI Tutor</h2>
                <p className="text-xs text-sky-100 mt-0.5">
                  Generate personalized quizzes or flashcards stored directly in your conversation
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleStart} className="p-6 space-y-6">
            {/* Error Notification Banner */}
            {session?.error && (
              <div className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      AI Tutor Notice
                    </h4>
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-300/90 mt-0.5">
                      {session.error}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="submit"
                        className="text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
                {onClearError && (
                  <button
                    type="button"
                    onClick={onClearError}
                    className="rounded-lg p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                    title="Dismiss notice"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Topic Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Study Topic or Subject
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, World War II, Python Data Structures..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>

            {/* Feature Banners for Gemini 3.7 Live, Study Vault, Voice Tutor, and Fact Finder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-2">
              {onOpenGeminiLive && (
                <button
                  type="button"
                  onClick={() => onOpenGeminiLive(topic.trim() || conversation?.title || 'General Topic')}
                  className="group relative flex items-center gap-3.5 p-4 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-gradient-to-r from-rose-500/15 via-red-500/10 to-amber-500/15 dark:from-rose-950/40 dark:to-red-950/30 text-left hover:border-rose-500 transition-all shadow-sm cursor-pointer"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/30 group-hover:scale-105 transition-transform">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-400">Gemini 3.7 Live</span>
                      <span className="rounded-full bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.2">LIVE AI</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                      Continuous real-time voice, vision camera feed & instant reasoning.
                    </p>
                  </div>
                </button>
              )}

              {onOpenStudyBank && (
                <button
                  type="button"
                  onClick={onOpenStudyBank}
                  className="group relative flex items-center gap-3.5 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-indigo-500/10 dark:from-indigo-950/30 dark:to-purple-950/20 text-left hover:border-indigo-500 transition-all shadow-sm cursor-pointer"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">Study Vault</span>
                      <span className="rounded-full bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.2">STORED</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                      Stored quizzes, flashcards, Q&As, & exams in local storage. Retake & DOCX export.
                    </p>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setVoiceSeed(undefined);
                  setActiveSubView('voice_session');
                }}
                className="group relative flex items-center gap-3.5 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/30 dark:to-orange-950/20 text-left hover:border-amber-500 transition-all shadow-sm cursor-pointer"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform">
                  <Mic className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">1-on-1 Voice Tutor</span>
                    <span className="rounded-full bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2">VOCAL</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                    Interactive voice-to-voice tutor session with mind-blowing facts & questions.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubView('fact_explorer')}
                className="group relative flex items-center gap-3.5 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-emerald-950/30 dark:to-teal-950/20 text-left hover:border-emerald-500 transition-all shadow-sm cursor-pointer"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">Question & Fact Finder</span>
                    <span className="rounded-full bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.2">BANK</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                    Discover all possible questions, difficulty levels & mind-blowing facts for any topic.
                  </p>
                </div>
              </button>
            </div>

            {/* Mode Selection Grid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Standard Learning Modes
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'quiz' as const,
                    title: 'Quiz',
                    desc: 'Multiple choice questions',
                    icon: HelpCircle,
                    color: 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400',
                  },
                  {
                    id: 'flashcard' as const,
                    title: 'Flashcards',
                    desc: 'Front & back review',
                    icon: Layers,
                    color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
                  },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSelectedMode(mode.id)}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? `${mode.color} ring-2 ring-offset-1 dark:ring-offset-slate-900 font-semibold shadow-md`
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-2" />
                      <span className="text-sm font-medium">{mode.title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {mode.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number of Questions / Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Number of {selectedMode === 'flashcard' ? 'Cards' : 'Questions'} (1 - 50)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numItems}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        setNumItems(Math.max(1, Math.min(50, val)));
                      }
                    }}
                    className="w-14 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 outline-none focus:border-sky-500"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">items</span>
                </div>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-2.5">
                {[3, 5, 10, 15, 20, 30, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumItems(num)}
                    className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      numItems === num
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={numItems}
                onChange={(e) => setNumItems(parseInt(e.target.value))}
                className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Ground on Specific Conversation Context */}
            {conversations.length > 0 ? (
              <ConversationSourceSelector
                conversations={conversations}
                selectedConversationId={selectedSourceConvId}
                onSelectConversation={(conv) => {
                  setSelectedSourceConvId(conv?.id || null);
                  if (conv?.title && !topic.trim()) {
                    setTopic(conv.title);
                  }
                }}
                absorbContext={absorbContext}
                onToggleAbsorbContext={setAbsorbContext}
                onApplyTopicSuggestion={(sugg) => setTopic(sugg)}
                label="Absorb Conversation Context"
                helperText="Select a specific conversation to use existing chat messages & uploaded files to tailor questions."
              />
            ) : conversation && conversation.messages.length > 0 ? (
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <input
                  type="checkbox"
                  checked={absorbContext}
                  onChange={(e) => setAbsorbContext(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 block">
                    Absorb Conversation Context
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Use existing chat messages & uploaded files to tailor questions
                  </span>
                </div>
              </label>
            ) : null}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-sky-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Start AI Tutor Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RESULTS STATISTICS STATE
  if (sessionState === 'results') {
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6 w-full">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* Results Hero Header */}
          <div
            className={`p-6 text-white text-center ${
              percentage >= 80
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                : percentage >= 60
                ? 'bg-gradient-to-r from-sky-500 to-blue-600'
                : 'bg-gradient-to-r from-amber-500 to-rose-600'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md mb-3">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <p className="text-xs opacity-90 mt-1">Topic: {topicText}</p>

            {/* Main Percentage Score */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
                <span className="block text-3xl sm:text-4xl font-black">{percentage}%</span>
                <span className="text-[11px] font-medium uppercase tracking-wider opacity-80">
                  Overall Accuracy
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
                <span className="block text-3xl sm:text-4xl font-black">
                  {score} / {maxScore}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider opacity-80">
                  {mode === 'exam' ? 'Points Earned' : 'Correct Answers'}
                </span>
              </div>
            </div>
          </div>

          {/* Save / Export Toast Banner */}
          {saveSuccessToast && (
            <div className="bg-emerald-500 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{saveSuccessToast}</span>
              </div>
              <span className="text-[10px] opacity-80">Stored in Local Storage</span>
            </div>
          )}

          {/* Breakdown & Review */}
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <BarChart3 className="h-4 w-4 text-sky-500" />
                Question-by-Question Review
                <span className="text-xs font-normal text-slate-500">({answers.length} evaluated)</span>
              </div>

              {/* Action buttons: Save to Local Storage & Export DOCX */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCurrentSession}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
                  title="Save this completed quiz to browser local storage so you can review or retake it anytime"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  Save Quiz to Vault
                </button>

                <button
                  type="button"
                  onClick={handleExportCurrentSessionDocx}
                  disabled={isExportingDocx}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  title="Export to formatted Word DOCX (All questions & choices first, answer keys at the end)"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {isExportingDocx ? 'Exporting...' : 'Export DOCX'}
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {answers.map((ans, idx) => (
                <div
                  key={ans.questionId || idx}
                  className={`rounded-2xl border p-4 transition-all ${
                    ans.isCorrect
                      ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        Q{idx + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {ans.question}
                      </p>
                    </div>
                    {ans.isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-900/60 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 flex-shrink-0">
                        <XCircle className="h-3.5 w-3.5" />
                        Incorrect
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 p-2.5">
                      <span className="block font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
                        Your Answer
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {ans.userAnswer || '(No response)'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-100/50 dark:bg-emerald-900/40 p-2.5">
                      <span className="block font-semibold text-emerald-700 dark:text-emerald-400 text-[10px] uppercase">
                        Correct Answer
                      </span>
                      <span className="text-emerald-900 dark:text-emerald-200 font-bold">
                        {ans.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {ans.explanation && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Explanation: </span>
                      {ans.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Control Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={onRestartSession}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                Retake Same Questions
              </button>
              <button
                onClick={() => {
                  const prevQList = questions.map((q) => q.question);
                  onStartSession(mode, topicText, totalSteps, true, prevQList);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-sky-500/25 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                ⚡ Generate NEW Questions (Different)
              </button>
              <button
                onClick={onResetSetup}
                className="px-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="Change Topic or Study Format"
              >
                Change Topic
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUESTION & FEEDBACK STATE
  const currentQ: TutorQuestionItem | undefined = questions[currentStep - 1];
  const lastAns: TutorAnswerRecord | undefined = answers[answers.length - 1];
  const isFeedbackState = sessionState === 'feedback';
  const isFlashcardMode = mode === 'flashcard';

  return (
    <div className="mx-auto max-w-3xl p-3 sm:p-6 w-full">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        {/* Session Progress Top Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Left Zone: Mode Badge & Topic Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 px-2 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-300 shrink-0 whitespace-nowrap shadow-2xs">
              <Award className="h-3 w-3" />
              <span>{mode.toUpperCase()}</span>
            </span>
            <span
              className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate min-w-0 block flex-1"
              title={topicText}
            >
              {topicText}
            </span>
          </div>

          {/* Right Zone: Voice Toggle, Progress Indicator, and Action Buttons */}
          <div className="flex items-center flex-wrap gap-1.5 shrink-0 justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 shrink-0">
              <AutoReadToggle autoRead={autoRead} onToggle={setAutoRead} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0 shadow-2xs">
                {isFlashcardMode ? 'Card' : 'Q'} {currentStep}/{totalSteps}
              </span>
              {!isFlashcardMode && (
                <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-300 whitespace-nowrap shrink-0 shadow-2xs">
                  Score: {score}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleSaveCurrentSession}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                title="Save quiz to local storage"
              >
                <Bookmark className="h-3 w-3" />
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={handleExportCurrentSessionDocx}
                disabled={isExportingDocx}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                title="Export to formatted Word DOCX"
              >
                <FileDown className="h-3 w-3" />
                <span>DOCX</span>
              </button>

              <button
                type="button"
                onClick={onStopSession}
                className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                title="Stop tutor session and view current results"
              >
                <XCircle className="h-3 w-3 text-rose-500" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-600 h-1.5 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Question Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {session?.error && (
            <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-rose-700 dark:text-rose-300 break-words">
                  {session.error}
                </p>
              </div>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="rounded-lg p-0.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shrink-0 cursor-pointer"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Flashcard Mode Workspace View */}
          {isFlashcardMode && currentQ && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Flashcard {currentStep} of {totalSteps}
                </span>
                <div className="flex items-center gap-2">
                  <ReadAloudButton
                    textToRead={isFlashcardFlipped ? (currentQ.correctAnswer || currentQ.explanation || '') : currentQ.question}
                    label="Read Aloud"
                    autoSpeak={autoRead}
                  />
                  <button
                    type="button"
                    onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-slate-500" />
                    {isFlashcardFlipped ? 'Show Front' : 'Flip to Answer'}
                  </button>
                </div>
              </div>

              {/* Flashcard Card */}
              <div
                onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600 p-5 sm:p-7 min-h-[160px] flex flex-col justify-between transition-all shadow-xs"
              >
                <div>
                  <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3 ${
                    isFlashcardFlipped
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300'
                  }`}>
                    {isFlashcardFlipped ? 'Answer (Back)' : 'Question / Concept (Front)'}
                  </span>
                  <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed break-words">
                    {isFlashcardFlipped ? (currentQ.correctAnswer || currentQ.explanation) : currentQ.question}
                  </p>
                  {isFlashcardFlipped && currentQ.explanation && currentQ.correctAnswer && currentQ.explanation !== currentQ.correctAnswer && (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                      <span className="font-semibold block mb-0.5 text-slate-700 dark:text-slate-200">Explanation:</span>
                      {currentQ.explanation}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 select-none">
                  <span>💡 Click anywhere to flip</span>
                  {currentQ.hint && !isFlashcardFlipped && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                      className="text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                  )}
                </div>
              </div>

              {showHint && currentQ.hint && !isFlashcardFlipped && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-200 break-words">
                  <span className="font-bold">Hint: </span>
                  {currentQ.hint}
                </div>
              )}

              {/* Recall Check Input (optional for flashcards) */}
              {!isFeedbackState && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 pl-1">
                      Active Recall Practice:
                    </span>
                    <VoiceInputButton
                      onTranscript={(txt) => setUserAnswer(txt)}
                      label="Voice Answer"
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer to test active recall (optional)..."
                      className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && userAnswer.trim()) {
                          handleSubmit();
                        }
                      }}
                    />
                    {userAnswer.trim() && (
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={!!session?.isEvaluating}
                        className="rounded-2xl bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 text-sm font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        {session?.isEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation for Flashcards */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNextQuestion}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  {currentStep < totalSteps ? (
                    <>
                      Next Flashcard
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      Complete Deck & View Summary
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Standard Quiz Question (Non-flashcard) */}
          {!isFlashcardMode && currentQ && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                <span className="font-semibold uppercase tracking-wider">
                  Question {currentStep} of {totalSteps}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <ReadAloudButton textToRead={currentQ.question} label="Read Question" autoSpeak={autoRead} />
                  {currentQ.points && (
                    <span className="font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                      {currentQ.points} Points
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug sm:leading-relaxed break-words">
                {currentQ.question}
              </h3>
            </div>
          )}

          {/* Multiple Choice Options or Text Area */}
          {!isFlashcardMode && !isFeedbackState && currentQ && (
            <div className="space-y-3 pt-1">
              {/* Voice input bar for easy speech answering */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700/80">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 pl-1">
                  Answer Entry Method:
                </span>
                <VoiceInputButton
                  onTranscript={(txt) => setUserAnswer(txt)}
                  options={currentQ.options}
                  onSelectOption={(opt) => setUserAnswer(opt)}
                  label="Voice Input Answer"
                />
              </div>

              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = userAnswer === opt;
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setUserAnswer(opt)}
                        disabled={!!session?.isEvaluating}
                        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 sm:p-4 text-left text-sm font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 ring-2 ring-sky-500/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                              isSelected
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 min-w-0 break-words leading-relaxed text-sm">
                            {opt}
                          </span>
                        </div>
                        <div
                          className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-sky-500 bg-sky-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={!!session?.isEvaluating}
                  rows={3}
                  placeholder="Type or speak your answer using Voice Input..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              )}

              {/* Hint Toggle */}
              {currentQ.hint && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {showHint ? 'Hide Hint' : 'Need a Hint?'}
                  </button>
                  {showHint && (
                    <div className="mt-2 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-200 break-words leading-relaxed">
                      {currentQ.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Answer Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!userAnswer.trim() || !!session?.isEvaluating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-sky-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {session?.isEvaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating Answer...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Answer
                  </>
                )}
              </button>
            </div>
          )}

          {/* FEEDBACK STATE VIEW */}
          {!isFlashcardMode && isFeedbackState && lastAns && (
            <div className="space-y-4">
              <div
                className={`rounded-2xl border p-5 shadow-xs overflow-hidden ${
                  lastAns.isCorrect
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30'
                    : 'border-rose-200 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastAns.isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-base font-bold ${
                          lastAns.isCorrect
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {lastAns.isCorrect ? 'Correct Answer!' : 'Incorrect'}
                      </h4>
                      <ReadAloudButton
                        textToRead={`Evaluation: ${lastAns.isCorrect ? 'Correct' : 'Incorrect'}. Correct Answer: ${lastAns.correctAnswer}. ${lastAns.feedback || ''}. ${lastAns.explanation || ''}`}
                        label="Read Feedback"
                        autoSpeak={autoRead}
                      />
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 break-words">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Your answer: </span>
                      {lastAns.userAnswer}
                    </p>

                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-100/70 dark:bg-emerald-900/40 p-3 break-words">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
                        Correct Answer
                      </span>
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                        {lastAns.correctAnswer}
                      </span>
                    </div>

                    {lastAns.feedback && (
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed pt-1 break-words">
                        {lastAns.feedback}
                      </p>
                    )}

                    {lastAns.explanation && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                        <span className="font-semibold block mb-0.5 text-slate-800 dark:text-slate-200">
                          Explanation:
                        </span>
                        {lastAns.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Next Question or View Results Button */}
              <button
                type="button"
                onClick={onNextQuestion}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-sky-500/25 transition-all cursor-pointer"
              >
                {currentStep < totalSteps ? (
                  <>
                    Next Question
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    View Results & Statistics
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
