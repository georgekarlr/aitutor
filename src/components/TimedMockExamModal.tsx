import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Timer,
  ShieldAlert,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Maximize2,
  Minimize2,
  Download,
  Brain,
  Award,
  Radio,
  ArrowRight,
} from 'lucide-react';
import type {
  GeminiSettings,
  ExamQuestion,
  ExamAnswerSubmission,
  ExamDiagnosticReport,
  ExamIntegrityViolation,
  Conversation,
} from '@/types';
import { generateExamQuestions, evaluateExamSubmissions } from '@/lib/mockExamGenerator';
import { ConversationSourceSelector } from '@/components/ConversationSourceSelector';
import { extractConversationStudyContext } from '@/lib/conversationContext';
import { MathText } from '@/components/MathText';

interface TimedMockExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeminiSettings;
  conversations?: Conversation[];
  activeConversation?: Conversation | null;
  initialSubject?: string;
  defaultSubject?: string;
  onOpenKnowledgeGraph?: () => void;
  onPracticeWeakTopic?: (topic: string) => void;
  onLaunchGeminiLive?: (topic: string) => void;
  onInsertIntoChat?: (report: ExamDiagnosticReport, score: number, maxScore: number, subject: string) => void;
  onRequireApiKey?: () => void;
}

export function TimedMockExamModal({
  isOpen,
  onClose,
  settings,
  conversations = [],
  activeConversation,
  initialSubject,
  defaultSubject = 'Calculus & Linear Algebra',
  onOpenKnowledgeGraph,
  onPracticeWeakTopic,
  onLaunchGeminiLive,
  onInsertIntoChat,
  onRequireApiKey,
}: TimedMockExamModalProps) {
  const effectiveSubject = initialSubject || defaultSubject;
  // Setup State
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConversation?.id || null);
  const [absorbContext, setAbsorbContext] = useState<boolean>(true);
  const [subject, setSubject] = useState(effectiveSubject);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [questionCount, setQuestionCount] = useState(5);
  const [focusWeakConcepts, setFocusWeakConcepts] = useState(false);
  const [enableProctoring, setEnableProctoring] = useState(true);
  const [insertedToChat, setInsertedToChat] = useState(false);

  // Sync selected conversation if activeConversation changes and none selected yet
  useEffect(() => {
    if (activeConversation?.id && !selectedConvId) {
      setSelectedConvId(activeConversation.id);
    }
  }, [activeConversation, selectedConvId]);

  // Exam Run State
  const [examState, setExamState] = useState<'setup' | 'loading' | 'in_progress' | 'grading' | 'results'>('setup');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ExamAnswerSubmission>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [violations, setViolations] = useState<ExamIntegrityViolation[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<ExamDiagnosticReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Update subject if initialSubject or defaultSubject changes
  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
    } else if (defaultSubject) {
      setSubject(defaultSubject);
    }
  }, [initialSubject, defaultSubject]);

  // Tab switch & visibility change proctoring detector
  useEffect(() => {
    if (examState !== 'in_progress' || !enableProctoring) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const v: ExamIntegrityViolation = {
          timestamp: Date.now(),
          type: 'tab_switch',
          message: 'Student switched tabs or minimized exam window.',
        };
        setViolations((prev) => [...prev, v]);
      }
    };

    const handleWindowBlur = () => {
      const v: ExamIntegrityViolation = {
        timestamp: Date.now(),
        type: 'window_blur',
        message: 'Exam window lost focus.',
      };
      setViolations((prev) => [...prev, v]);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [examState, enableProctoring]);

  const handleSubmitExam = useCallback(async () => {
    if (examState === 'grading' || examState === 'results') return;
    setExamState('grading');

    if (timerRef.current) clearInterval(timerRef.current);

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // ignore
      }
    }

    const timeElapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    try {
      const report = await evaluateExamSubmissions(
        subject,
        questions,
        answers,
        timeElapsedSeconds,
        violations
      );
      setDiagnosticReport(report);
      setExamState('results');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error evaluating exam';
      setError(msg);
      setExamState('results');
    }
  }, [examState, subject, questions, answers, violations]);

  const handleAutoSubmitRef = useRef(handleSubmitExam);
  useEffect(() => {
    handleAutoSubmitRef.current = handleSubmitExam;
  }, [handleSubmitExam]);

  // Timer Tick
  useEffect(() => {
    if (examState === 'in_progress') {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmitRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examState]);

  const handleStartExam = async () => {
    if (!settings.apiKey?.trim()) {
      onRequireApiKey?.();
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a test subject.');
      return;
    }

    setExamState('loading');
    setError(null);

    // Determine conversation context to absorb
    const selectedConv = conversations.find((c) => c.id === selectedConvId) || (activeConversation?.id === selectedConvId ? activeConversation : null);
    let contextText: string | undefined;
    let sourceTitle: string | undefined;

    if (selectedConv && absorbContext) {
      const extracted = extractConversationStudyContext(selectedConv);
      contextText = extracted.contextText;
      sourceTitle = selectedConv.title;
    }

    try {
      const generated = await generateExamQuestions(settings, {
        subject,
        questionCount,
        weakConceptsOnly: focusWeakConcepts,
        contextText,
        sourceTitle,
      });

      if (generated.length === 0) {
        throw new Error('No questions generated. Please check your topic.');
      }

      setQuestions(generated);
      setCurrentIndex(0);
      setAnswers({});
      setFlaggedQuestions(new Set());
      setViolations([]);
      setRemainingSeconds(durationMinutes * 60);
      startTimeRef.current = Date.now();
      setExamState('in_progress');

      // Request fullscreen if container is available
      if (enableProctoring && containerRef.current && document.fullscreenEnabled) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch {
          // fullscreen permission denied is non-fatal
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch exam';
      setError(msg);
      setExamState('setup');
    }
  };

  const handleSelectOption = (option: string) => {
    const q = questions[currentIndex];
    if (!q) return;

    setAnswers((prev) => ({
      ...prev,
      [q.id]: {
        questionId: q.id,
        userAnswer: option,
        timeSpentSeconds: (prev[q.id]?.timeSpentSeconds || 0) + 1,
      },
    }));
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownloadScorecard = useCallback(() => {
    if (!diagnosticReport) return;
    let md = `# Timed Mock Exam Scorecard — ${subject}\n\n`;
    md += `**Date**: ${new Date().toLocaleString()}\n`;
    md += `**Score**: ${diagnosticReport.totalScore}/${diagnosticReport.maxScore} (${diagnosticReport.percentage}%)\n`;
    md += `**Time Elapsed**: ${Math.floor(diagnosticReport.timeElapsedSeconds / 60)}m ${diagnosticReport.timeElapsedSeconds % 60}s\n`;
    md += `**Integrity Violations**: ${diagnosticReport.integrityViolationsCount}\n\n`;

    md += `## Conceptual Performance\n`;
    if (diagnosticReport.masteredConcepts.length > 0) {
      md += `### Mastered Concepts\n`;
      diagnosticReport.masteredConcepts.forEach((c) => (md += `- ✅ ${c}\n`));
      md += `\n`;
    }
    if (diagnosticReport.strugglingConcepts.length > 0) {
      md += `### Concepts Needing Remediation\n`;
      diagnosticReport.strugglingConcepts.forEach((c) => (md += `- ⚠️ ${c}\n`));
      md += `\n`;
    }

    md += `## Detailed Question Breakdown\n`;
    diagnosticReport.gradedAnswers.forEach((sub, idx) => {
      const q = questions.find((item) => item.id === sub.questionId);
      if (!q) return;
      md += `### Question ${idx + 1}: ${q.question}\n`;
      md += `- **Your Answer**: ${sub.userAnswer || '(None)'}\n`;
      md += `- **Correct Answer**: ${q.correctAnswer}\n`;
      md += `- **Status**: ${sub.isCorrect ? 'Correct (+10 pts)' : 'Incorrect (0 pts)'}\n`;
      md += `- **Rationale**: ${q.explanation}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Exam_Scorecard_${subject.replace(/[^a-z0-9]+/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [diagnosticReport, subject, questions]);

  const resetExam = () => {
    setExamState('setup');
    setQuestions([]);
    setAnswers({});
    setFlaggedQuestions(new Set());
    setViolations([]);
    setDiagnosticReport(null);
    setError(null);
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.userAnswer?.trim()).length;
  const minutesLeft = Math.floor(remainingSeconds / 60);
  const secondsLeft = remainingSeconds % 60;
  const isTimeCritical = remainingSeconds < 120; // under 2 mins

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="relative flex flex-col w-full max-w-4xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-xs shrink-0">
              <Timer className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                <span>Timed Mock Exam & Proctoring Mode</span>
                {enableProctoring && examState === 'in_progress' && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <ShieldAlert className="h-3 w-3" />
                    Proctored
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {examState === 'in_progress'
                  ? `${subject} • Question ${currentIndex + 1} of ${questions.length}`
                  : 'Distraction-free exam simulator with automated diagnostic grading'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {examState === 'in_progress' && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}

            {examState !== 'in_progress' && examState !== 'grading' && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/80 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 mb-4">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SCREEN 1: SETUP */}
          {examState === 'setup' && (
            <div className="max-w-2xl mx-auto space-y-5 py-2">
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Configure Exam Parameters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calibrate the exam environment to match standardized testing or course final specifications.
                </p>
              </div>

              {/* Conversation Scoped Grounding */}
              {conversations.length > 0 && (
                <ConversationSourceSelector
                  conversations={conversations}
                  selectedConversationId={selectedConvId}
                  onSelectConversation={(conv) => setSelectedConvId(conv?.id || null)}
                  absorbContext={absorbContext}
                  onToggleAbsorbContext={setAbsorbContext}
                  onApplyTopicSuggestion={(sug) => setSubject(sug)}
                  label="Absorb Conversation Context"
                  helperText="Select a specific conversation to use existing chat messages & uploaded files to tailor your exam questions and diagnostic rubrics."
                />
              )}

              {/* Subject Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Exam Topic / Course Subject:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. AP Biology, Multivariable Calculus, Organic Chemistry, Macroeconomics"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Time & Question Count Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Exam Duration:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          durationMinutes === mins
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Question Count:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 20].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          questionCount === count
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {count} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Proctoring & Knowledge Graph Toggle */}
              <div className="space-y-2.5 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <ShieldAlert className="h-4 w-4 text-emerald-500" />
                      <span>Socratic Integrity Proctoring</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Enforces fullscreen mode and flags tab switches or window blurs.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableProctoring}
                    onChange={(e) => setEnableProctoring(e.target.checked)}
                    className="h-4 w-4 rounded-sm text-amber-600 focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span>Target Knowledge Graph Gaps</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Calibrates questions specifically on concepts with &lt;65% student mastery.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={focusWeakConcepts}
                    onChange={(e) => setFocusWeakConcepts(e.target.checked)}
                    className="h-4 w-4 rounded-sm text-amber-600 focus:ring-amber-500"
                  />
                </label>
              </div>

              {/* Start Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleStartExam}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-sm py-3 shadow-md transition-all cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Generate & Launch Proctored Exam</span>
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: LOADING */}
          {examState === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 animate-pulse">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Calibrating {questionCount} Exam Questions...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synthesizing rigorous test problems and rubrics for {subject}
                </p>
              </div>
            </div>
          )}

          {/* SCREEN 3: IN PROGRESS */}
          {examState === 'in_progress' && currentQ && (
            <div className="flex flex-col h-full space-y-4">
              {/* Exam Info & Timer Bar */}
              <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800/80 p-3 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {answeredCount} of {questions.length} answered
                  </span>
                </div>

                {/* Countdown Timer */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                    isTimeCritical
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Timer className="h-3.5 w-3.5" />
                  <span>
                    {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Proctoring Violation Warning (if any) */}
              {violations.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Warning: {violations.length} focus loss event(s) recorded by proctoring engine.
                  </span>
                </div>
              )}

              {/* Question Navigator Palette */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]?.userAnswer?.trim());
                  const isFlagged = flaggedQuestions.has(q.id);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative flex h-7 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-white ring-2 ring-amber-400/50'
                          : isAnswered
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Card */}
              <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    {currentQ.conceptTag} • {currentQ.points} Points
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQ.id)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      flaggedQuestions.has(currentQ.id)
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>{flaggedQuestions.has(currentQ.id) ? 'Flagged' : 'Flag for Review'}</span>
                  </button>
                </div>

                <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  <MathText text={currentQ.question} />
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2 pt-2">
                  {currentQ.options?.map((opt, oIdx) => {
                    const isSelected = answers[currentQ.id]?.userAnswer === opt;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 shadow-2xs font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-700'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="flex-1 min-w-0">
                          <MathText text={opt} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Final Exam</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: GRADING */}
          {examState === 'grading' && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 animate-pulse">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Grading Exam Submissions...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Computing diagnostic mastery scores and updating Student Knowledge Graph
                </p>
              </div>
            </div>
          )}

          {/* SCREEN 5: RESULTS & SCORECARD */}
          {examState === 'results' && diagnosticReport && (
            <div className="space-y-5">
              {/* Scorecard Hero Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-amber-500/10 to-teal-500/10 border border-indigo-200 dark:border-indigo-800/80 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-md shrink-0">
                    <Award className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      Exam Complete: {subject}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Time Elapsed: {Math.floor(diagnosticReport.timeElapsedSeconds / 60)}m {diagnosticReport.timeElapsedSeconds % 60}s •{' '}
                      {diagnosticReport.integrityViolationsCount === 0 ? 'Full Integrity Maintained' : `${diagnosticReport.integrityViolationsCount} focus warnings`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                      {diagnosticReport.percentage}%
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {diagnosticReport.totalScore} / {diagnosticReport.maxScore} points
                    </p>
                  </div>

                  {onInsertIntoChat && (
                    <button
                      type="button"
                      onClick={() => {
                        if (diagnosticReport) {
                          onInsertIntoChat(diagnosticReport, diagnosticReport.totalScore, diagnosticReport.maxScore, subject);
                          setInsertedToChat(true);
                          setTimeout(() => setInsertedToChat(false), 2500);
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                        insertedToChat
                          ? 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                      }`}
                      title="Post score diagnostic summary directly into the active conversation"
                    >
                      <span>{insertedToChat ? 'Posted to Chat ✓' : 'Post to Chat'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadScorecard}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Scorecard</span>
                  </button>
                </div>
              </div>

              {/* Conceptual Diagnostics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mastered */}
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mastered Concepts ({diagnosticReport.masteredConcepts.length})</span>
                  </div>
                  {diagnosticReport.masteredConcepts.length > 0 ? (
                    <ul className="space-y-1">
                      {diagnosticReport.masteredConcepts.map((c, idx) => (
                        <li key={idx} className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No masteries achieved in this run.</p>
                  )}
                </div>

                {/* Remediation Gaps */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Knowledge Gaps ({diagnosticReport.strugglingConcepts.length})</span>
                  </div>
                  {diagnosticReport.strugglingConcepts.length > 0 ? (
                    <ul className="space-y-1">
                      {diagnosticReport.strugglingConcepts.map((c, idx) => (
                        <li key={idx} className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      Zero knowledge gaps flagged!
                    </p>
                  )}
                </div>
              </div>

              {/* Question Breakdown List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Itemized Question Review
                </h4>
                {questions.map((q, idx) => {
                  const sub = diagnosticReport.gradedAnswers.find((item) => item.questionId === q.id);
                  const isCorrect = sub?.isCorrect;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 space-y-2 ${
                        isCorrect
                          ? 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : 'border-rose-200 dark:border-rose-800/70 bg-rose-50/20 dark:bg-rose-950/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Question {idx + 1} • {q.conceptTag}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          }`}
                        >
                          {isCorrect ? `+${q.points} pts` : '0 pts'}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <MathText text={q.question} />
                      </div>

                      <div className="text-xs space-y-1 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium shrink-0">Your Answer:</span>
                          <div className={isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-rose-700 dark:text-rose-300 font-semibold'}>
                            {sub?.userAnswer ? <MathText text={sub.userAnswer} /> : '(Unanswered)'}
                          </div>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium shrink-0">Correct Answer:</span>
                            <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                              <MathText text={q.correctAnswer} />
                            </div>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                          <span>Rationale: </span>
                          <MathText text={q.explanation} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetExam}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Configure New Exam</span>
                </button>

                {onPracticeWeakTopic && diagnosticReport.strugglingConcepts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onPracticeWeakTopic(diagnosticReport.strugglingConcepts[0]);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Practice Weakest: {diagnosticReport.strugglingConcepts[0]}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {onLaunchGeminiLive && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchGeminiLive(subject);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-3.5 py-2 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                  >
                    <Radio className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                    <span>Live Oral Review</span>
                  </button>
                )}

                {onOpenKnowledgeGraph && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenKnowledgeGraph();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span>View Updated Knowledge Graph</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
