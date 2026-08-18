/**
 * CurriculumModal.tsx
 *
 * Taskmaster Curriculum & Syllabus Generator Studio (Feature 3.A).
 * Enables learners to generate personalized, multi-module learning pathways,
 * track completion milestones, launch contextual active recall practice drills,
 * and dynamically recalibrate schedules using Gemini AI.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Download,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  PlayCircle,
  HelpCircle,
  FileCode,
  Search,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';
import type {
  CurriculumPlan,
  CurriculumModule,
  CurriculumLevel,
  GeminiSettings,
  KnowledgeGraphData,
  Conversation,
} from '@/types';
import {
  updateModuleStatus,
  deleteCurriculum,
  subscribeCurricula,
} from '@/lib/curriculumStorage';
import {
  generateCurriculumPlan,
  recalibrateCurriculum,
  exportCurriculumToDocx,
  exportCurriculumToMarkdown,
  exportCurriculumToJson,
} from '@/lib/curriculumGenerator';
import { getKnowledgeGraph } from '@/lib/knowledgeGraphStorage';
import { ConversationSourceSelector } from '@/components/ConversationSourceSelector';
import { extractConversationStudyContext } from '@/lib/conversationContext';

interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeminiSettings;
  conversations?: Conversation[];
  activeConversation?: Conversation | null;
  initialTopic?: string;
  onLaunchPractice?: (topic: string, mode: 'quiz' | 'flashcards' | 'exam') => void;
  onLaunchGeminiLive?: (topic?: string) => void;
  onInsertIntoChat?: (plan: CurriculumPlan) => void;
}

type TabType = 'active_plan' | 'create_new' | 'all_plans';

const PRESET_TOPICS = [
  { label: 'Linear Algebra & Vector Calculus', level: 'intermediate' as const },
  { label: 'MCAT Organic Chemistry', level: 'exam_prep' as const },
  { label: 'Modern Machine Learning & Transformers', level: 'advanced' as const },
  { label: 'Full-Stack TypeScript & React Architecture', level: 'intermediate' as const },
  { label: 'AP Computer Science & Data Structures', level: 'beginner' as const },
  { label: 'Microeconomics & Game Theory', level: 'intermediate' as const },
];

export function CurriculumModal({
  isOpen,
  onClose,
  settings,
  conversations = [],
  activeConversation,
  initialTopic,
  onLaunchPractice,
  onLaunchGeminiLive,
  onInsertIntoChat,
}: CurriculumModalProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConversation?.id || null);
  const [absorbContext, setAbsorbContext] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('active_plan');
  const [curriculaList, setCurriculaList] = useState<CurriculumPlan[]>([]);
  const [activePlan, setActivePlan] = useState<CurriculumPlan | null>(null);

  // Form states for creating new curriculum
  const [subject, setSubject] = useState(initialTopic || '');
  const [level, setLevel] = useState<CurriculumLevel>('intermediate');
  const [goals, setGoals] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [moduleCount, setModuleCount] = useState(5);
  const [prioritizeKnowledgeGraph, setPrioritizeKnowledgeGraph] = useState(true);
  const [insertedToChat, setInsertedToChat] = useState(false);

  // Sync selected conversation if activeConversation changes and none selected yet
  useEffect(() => {
    if (activeConversation?.id && !selectedConvId) {
      setSelectedConvId(activeConversation.id);
    }
  }, [activeConversation, selectedConvId]);

  // Recalibration & generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [recalibrateNotes, setRecalibrateNotes] = useState('');
  const [showRecalibrateInput, setShowRecalibrateInput] = useState(false);

  // Knowledge Graph data for auto-scaffolding
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphData | null>(null);

  // Search filter for saved curricula
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to curricula in IndexedDB
  useEffect(() => {
    const unsub = subscribeCurricula((list) => {
      setCurriculaList(list);
      setActivePlan((prev) => {
        if (!prev && list.length > 0) return list[0];
        if (prev) {
          const fresh = list.find((item) => item.id === prev.id);
          return fresh || list[0] || null;
        }
        return null;
      });
    });

    getKnowledgeGraph().then(setKnowledgeGraph);

    return () => unsub();
  }, []);

  const weakConceptsCount = useMemo(() => {
    if (!knowledgeGraph || !knowledgeGraph.concepts) return 0;
    return knowledgeGraph.concepts.filter((c) => c.masteryScore < 60).length;
  }, [knowledgeGraph]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!subject.trim()) return;

    setIsGenerating(true);
    setGenerateError(null);

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
      const plan = await generateCurriculumPlan(settings, {
        subject: subject.trim(),
        level,
        goals: goals.trim(),
        targetExam: targetExam.trim(),
        hoursPerWeek,
        totalModulesCount: moduleCount,
        knowledgeGraph: prioritizeKnowledgeGraph ? knowledgeGraph : null,
        contextText,
        sourceTitle,
      });

      setActivePlan(plan);
      setActiveTab('active_plan');
      // Reset form
      setSubject('');
      setGoals('');
      setTargetExam('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate curriculum plan.';
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecalibrate = async () => {
    if (!activePlan || isRecalibrating) return;
    setIsRecalibrating(true);

    try {
      const updated = await recalibrateCurriculum(settings, activePlan, recalibrateNotes);
      setActivePlan(updated);
      setShowRecalibrateInput(false);
      setRecalibrateNotes('');
    } catch (err) {
      console.error('Recalibration error:', err);
    } finally {
      setIsRecalibrating(false);
    }
  };

  const handleToggleModule = async (moduleId: string, currentStatus: CurriculumModule['status']) => {
    if (!activePlan) return;
    const nextStatus: CurriculumModule['status'] =
      currentStatus === 'completed' ? 'not_started' : currentStatus === 'not_started' ? 'in_progress' : 'completed';

    const updated = await updateModuleStatus(activePlan.id, moduleId, nextStatus);
    if (updated) {
      setActivePlan(updated);
    }
  };

  const handleDeletePlan = async (id: string) => {
    await deleteCurriculum(id);
    const remaining = curriculaList.filter((c) => c.id !== id);
    if (activePlan?.id === id) {
      setActivePlan(remaining[0] || null);
    }
  };

  const handlePresetSelect = (preset: { label: string; level: CurriculumLevel }) => {
    setSubject(preset.label);
    setLevel(preset.level);
  };

  const filteredCurricula = useMemo(() => {
    if (!searchQuery.trim()) return curriculaList;
    const q = searchQuery.toLowerCase();
    return curriculaList.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.targetLevel.toLowerCase().includes(q),
    );
  }, [curriculaList, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="taskmaster_curriculum_modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200"
    >
      <div
        className="relative flex flex-col h-full max-h-[90vh] w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white shadow-xs">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  AI Taskmaster Curriculum Studio
                </h2>
                <span className="rounded-full bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                  Feature 3.A
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized syllabus generator, milestone mastery & active recall pacing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Word Export */}
            {activePlan && (
              <button
                type="button"
                onClick={() => exportCurriculumToDocx(activePlan)}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Export Syllabus to Word (.docx)"
              >
                <Download className="h-3.5 w-3.5 text-indigo-500" />
                <span>Export Word</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Close Curriculum Studio"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('active_plan')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'active_plan'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Active Syllabus</span>
            {activePlan && (
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2 py-0.2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                {activePlan.progressPercentage}%
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create_new')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'create_new'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="h-4 w-4 text-emerald-500" />
            <span>Generate New Course</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all_plans')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'all_plans'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>All Curricula ({curriculaList.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ACTIVE SYLLABUS */}
          {activeTab === 'active_plan' && (
            <div className="space-y-6">
              {activePlan ? (
                <>
                  {/* Plan Overview Card */}
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 p-6 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-indigo-600 text-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                            {activePlan.targetLevel}
                          </span>
                          <span className="rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {activePlan.subject}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{activePlan.totalEstimatedHours} Total Hours</span>
                          </span>
                        </div>

                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {activePlan.title}
                        </h3>

                        {activePlan.targetGoals && activePlan.targetGoals.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {activePlan.targetGoals.map((goal, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-purple-100/80 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-[11px] font-medium text-purple-800 dark:text-purple-200"
                              >
                                🎯 {goal}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Progress Gauge */}
                      <div className="flex flex-col items-start md:items-end justify-between shrink-0 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Award className="h-5 w-5 text-amber-500" />
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {activePlan.progressPercentage}%
                          </span>
                          <span className="text-xs text-slate-400">Complete</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${activePlan.progressPercentage}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1">
                          {activePlan.modules.filter((m) => m.status === 'completed').length} of {activePlan.modules.length} modules completed
                        </p>
                      </div>
                    </div>

                    {/* Recalibrate & Export Toolbar */}
                    <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRecalibrateInput(!showRecalibrateInput)}
                          className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          <span>AI Dynamic Recalibration</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onInsertIntoChat && (
                          <button
                            type="button"
                            onClick={() => {
                              if (activePlan) {
                                onInsertIntoChat(activePlan);
                                setInsertedToChat(true);
                                setTimeout(() => setInsertedToChat(false), 2500);
                              }
                            }}
                            className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                              insertedToChat
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                            }`}
                            title="Embed curriculum plan into the active conversation"
                          >
                            <Sparkles className="h-3.5 w-3.5 inline mr-1 text-indigo-500" />
                            <span>{insertedToChat ? 'Inserted ✓' : 'Insert in Chat'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => exportCurriculumToDocx(activePlan)}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Export to Microsoft Word"
                        >
                          <Download className="h-3.5 w-3.5 text-indigo-500 inline mr-1" />
                          <span>Word</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => exportCurriculumToMarkdown(activePlan)}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Export to Markdown"
                        >
                          <FileCode className="h-3.5 w-3.5 text-slate-500 inline mr-1" />
                          <span>Markdown</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => exportCurriculumToJson(activePlan)}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Export JSON"
                        >
                          <span>JSON</span>
                        </button>
                      </div>
                    </div>

                    {/* Recalibration Input Drawer */}
                    {showRecalibrateInput && (
                      <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3 animate-in fade-in-50 duration-200">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Adaptive Schedule Recalibration
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Tell the AI Taskmaster how your recent practice is going (e.g. &quot;I struggle with eigenvalue decomposition&quot; or &quot;Need to move faster for next week&apos;s midterm&quot;). It will restructure remaining modules accordingly.
                        </p>
                        <textarea
                          value={recalibrateNotes}
                          onChange={(e) => setRecalibrateNotes(e.target.value)}
                          placeholder="Enter your pacing notes, quiz feedback, or areas of confusion..."
                          rows={2}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRecalibrateInput(false)}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleRecalibrate}
                            disabled={isRecalibrating}
                            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                          >
                            {isRecalibrating ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Recalibrating...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-3.5 w-3.5" />
                                <span>Recalibrate Remaining Modules</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modules Timeline */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Course Modules ({activePlan.modules.length})
                      </h4>
                      <p className="text-xs text-slate-500">
                        Click the circle icon to toggle completion status
                      </p>
                    </div>

                    <div className="space-y-3">
                      {activePlan.modules.map((mod) => {
                        const isDone = mod.status === 'completed';
                        const inProgress = mod.status === 'in_progress';

                        return (
                          <div
                            key={mod.id}
                            className={`rounded-2xl border p-4 transition-all ${
                              isDone
                                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                                : inProgress
                                ? 'border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                {/* Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleModule(mod.id, mod.status)}
                                  className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                                  title="Toggle module completion"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                  ) : inProgress ? (
                                    <PlayCircle className="h-5 w-5 text-indigo-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                  )}
                                </button>

                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400">
                                      Module {mod.order}
                                    </span>
                                    <h5
                                      className={`text-sm font-bold ${
                                        isDone
                                          ? 'text-slate-500 line-through'
                                          : 'text-slate-900 dark:text-white'
                                      }`}
                                    >
                                      {mod.title}
                                    </h5>
                                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                      ⏱ {mod.estimatedMinutes} mins
                                    </span>
                                    <span className="rounded-md bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300">
                                      {mod.assessmentType}
                                    </span>
                                  </div>

                                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                    {mod.description}
                                  </p>

                                  {/* Target Concepts Chips */}
                                  {mod.targetConcepts && mod.targetConcepts.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      {mod.targetConcepts.map((concept, cIdx) => (
                                        <button
                                          key={cIdx}
                                          type="button"
                                          onClick={() =>
                                            onLaunchPractice?.(concept, mod.assessmentType === 'flashcards' ? 'flashcards' : 'quiz')
                                          }
                                          className="rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                          title={`Practice ${concept} in AI Tutor`}
                                        >
                                          💡 {concept}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Key Takeaways */}
                                  {mod.keyTakeaways && mod.keyTakeaways.length > 0 && (
                                    <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                                      <strong className="text-slate-800 dark:text-slate-200 block">
                                        Key Takeaways:
                                      </strong>
                                      {mod.keyTakeaways.map((takeaway, tIdx) => (
                                        <div key={tIdx} className="flex items-start gap-1.5">
                                          <span className="text-emerald-500 font-bold">•</span>
                                          <span>{takeaway}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Milestone Practice Launch CTA */}
                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onLaunchPractice?.(
                                      mod.targetConcepts[0] || mod.title,
                                      mod.assessmentType === 'flashcards' ? 'flashcards' : 'quiz',
                                    )
                                  }
                                  className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                  title="Launch practice drill for this module"
                                >
                                  <HelpCircle className="h-3.5 w-3.5" />
                                  <span>{mod.assessmentType === 'flashcards' ? 'Cards' : 'Quiz'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onLaunchGeminiLive?.(mod.targetConcepts[0] || mod.title)}
                                  className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                  title="Discuss with Gemini Live"
                                >
                                  <span>Live Audio</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  <GraduationCap className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No Active Curriculum Plan
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Use the Studio Generator to construct a personalized course syllabus tailored to your academic level and knowledge gaps.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create_new')}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-bold shadow-xs mx-auto cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Generate New Syllabus</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW CURRICULUM */}
          {activeTab === 'create_new' && (
            <form onSubmit={handleGenerate} className="space-y-5 max-w-2xl mx-auto">
              <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/40 dark:bg-indigo-950/20 p-4">
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                  Taskmaster Course Design Studio
                </h3>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  Gemini will architect a sequenced learning syllabus with milestone drills, concept graphs, and active recall checkpoints.
                </p>
              </div>

              {/* Ground on Specific Conversation Context */}
              {conversations.length > 0 && (
                <ConversationSourceSelector
                  conversations={conversations}
                  selectedConversationId={selectedConvId}
                  onSelectConversation={(conv) => setSelectedConvId(conv?.id || null)}
                  absorbContext={absorbContext}
                  onToggleAbsorbContext={setAbsorbContext}
                  onApplyTopicSuggestion={(sug) => setSubject(sug)}
                  label="Absorb Conversation Context"
                  helperText="Select a specific conversation to use existing chat messages & uploaded files to tailor your structured syllabus modules."
                />
              )}

              {/* Preset Shortcuts */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Popular Syllabi Shortcuts
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TOPICS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject / Topic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Subject / Topic Name *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Distributed Systems & Consensus, MCAT Biochemistry, Organic Chemistry II"
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Level & Module Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Academic Difficulty Tier
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as CurriculumLevel)}
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">Beginner / Foundations</option>
                    <option value="intermediate">Intermediate / Undergraduate</option>
                    <option value="advanced">Advanced / Graduate</option>
                    <option value="exam_prep">High-Yield Exam Prep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Total Module Milestones ({moduleCount})
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={moduleCount}
                    onChange={(e) => setModuleCount(Number(e.target.value))}
                    className="w-full accent-indigo-600 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>3 Quick Modules</span>
                    <span>10 Deep Modules</span>
                  </div>
                </div>
              </div>

              {/* Target Goals */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Specific Learning Objectives / Target Exam
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. Final Exam on Dec 15, GRE Quantitative, Job Interview"
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 mb-2"
                />
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={2}
                  placeholder="Additional focus areas (e.g. Focus deeply on proof techniques and practical exercises)..."
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Hours / Week */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Weekly Study Budget ({hoursPerWeek} hrs/week)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full accent-indigo-600 mt-2"
                  />
                </div>

                {/* Knowledge Graph Weakness Scaffolding Toggle */}
                {weakConceptsCount > 0 && (
                  <div className="flex items-center gap-2 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-3">
                    <input
                      type="checkbox"
                      id="prioritize_kg_chk"
                      checked={prioritizeKnowledgeGraph}
                      onChange={(e) => setPrioritizeKnowledgeGraph(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <label htmlFor="prioritize_kg_chk" className="text-xs text-purple-900 dark:text-purple-200 cursor-pointer">
                      <strong>Prioritize {weakConceptsCount} Weak Concepts</strong> from your Knowledge Graph in early modules
                    </label>
                  </div>
                )}
              </div>

              {generateError && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {generateError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating || !subject.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-3 text-sm shadow-md transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Architecting Syllabus with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate Taskmaster Curriculum</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: ALL SAVED CURRICULA */}
          {activeTab === 'all_plans' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search curricula by title, subject, or tier..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {filteredCurricula.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredCurricula.map((plan) => {
                    const isCurrent = activePlan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                          setActivePlan(plan);
                          setActiveTab('active_plan');
                        }}
                        className={`rounded-2xl border p-4 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isCurrent
                            ? 'border-indigo-500 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {plan.title}
                            </h5>
                            <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase shrink-0">
                              {plan.targetLevel}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-1">
                            {plan.subject} • {plan.modules.length} Modules • {plan.totalEstimatedHours} Hours
                          </p>

                          {/* Progress bar miniature */}
                          <div className="flex items-center gap-2 mt-2 max-w-xs">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full"
                                style={{ width: `${plan.progressPercentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">
                              {plan.progressPercentage}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportCurriculumToDocx(plan);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Export to Word"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete curriculum "${plan.title}"?`)) {
                                handleDeletePlan(plan.id);
                              }
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete curriculum"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs">No curricula found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
