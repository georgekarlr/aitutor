import {
  Radio,
  GraduationCap,
  FileUp,
  Timer,
  Layers,
  Flame,
  Workflow,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  Brain,
} from 'lucide-react';

interface HomeToolGridProps {
  onOpenGeminiLive: () => void;
  onOpenTutor: () => void;
  onOpenDocumentIngestion: () => void;
  onOpenMockExam: () => void;
  onOpenWhiteboard: () => void;
  onOpenPodcast: () => void;
  onOpenFocusHub: () => void;
  onOpenCurriculum: () => void;
  onOpenScratchpad: () => void;
  onOpenStudyBank: () => void;
}

export function HomeToolGrid({
  onOpenGeminiLive,
  onOpenTutor,
  onOpenDocumentIngestion,
  onOpenMockExam,
  onOpenWhiteboard,
  onOpenPodcast,
  onOpenFocusHub,
  onOpenCurriculum,
  onOpenScratchpad,
  onOpenStudyBank,
}: HomeToolGridProps) {
  const tools = [
    {
      id: 'gemini-live',
      title: 'Gemini 3.7 Live',
      badge: 'Voice & Vision',
      badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      description: 'Engage in bidirectional spoken dialogue with real-time camera snapshot analysis and auto-generated quizzes.',
      icon: Radio,
      iconBg: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/20',
      action: onOpenGeminiLive,
      featured: true,
      tag: 'Real-Time Spoken',
    },
    {
      id: 'ai-tutor',
      title: 'Socratic AI Tutor',
      badge: '1–50 Questions',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
      description: 'Interactive multiple-choice quizzes, active recall flashcards, and oral recitation scoring with instant feedback.',
      icon: GraduationCap,
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/20',
      action: onOpenTutor,
      featured: true,
      tag: 'Adaptive Pedagogy',
    },
    {
      id: 'doc-ingest',
      title: 'Document & PDF Ingestion',
      badge: 'Multimodal OCR',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      description: 'Ingest multi-page PDFs, lecture notes, and textbook scans directly into concept maps, flashcards, and quizzes.',
      icon: FileUp,
      iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/20',
      action: onOpenDocumentIngestion,
      tag: '1M Context',
    },
    {
      id: 'whiteboard',
      title: 'Vector Chalkboard Walkthroughs',
      badge: 'Audio-Visual',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      description: 'Animated chalkboard drawings, force vectors, math derivations, and synchronized spoken professor narration.',
      icon: Layers,
      iconBg: 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-cyan-500/20',
      action: onOpenWhiteboard,
      tag: 'Visual Geometry',
    },
    {
      id: 'mock-exam',
      title: 'Timed Mock Exam Simulator',
      badge: 'Proctored',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      description: 'Simulated exam environment with countdown timers, focus integrity logs, and comprehensive post-exam score reports.',
      icon: Timer,
      iconBg: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20',
      action: onOpenMockExam,
      tag: 'Diagnostic Rubric',
    },
    {
      id: 'podcast',
      title: 'Dual-Host Audio Podcast',
      badge: 'NotebookLM Style',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      description: 'Generate lively two-host conversational audio briefings (Alex & Sam) with speech rate controls and show notes.',
      icon: Sparkles,
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-purple-500/20',
      action: onOpenPodcast,
      tag: 'Spoken Dialogue',
    },
    {
      id: 'focus-hub',
      title: 'Pomodoro Focus Hub & Streaks',
      badge: 'Gamified XP',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      description: 'Procedural soundscapes (binaural beats, rainfall, brown noise), interval timers, and mastery badges.',
      icon: Flame,
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20',
      action: onOpenFocusHub,
      tag: 'Soundscapes',
    },
    {
      id: 'curriculum',
      title: 'Taskmaster Curriculum Studio',
      badge: 'Syllabus Planner',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      description: 'Autonomous multi-module curriculum generator targeting knowledge gaps with direct IndexedDB vault delivery.',
      icon: Workflow,
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
      action: onOpenCurriculum,
      tag: 'Adaptive Syllabi',
    },
    {
      id: 'study-bank',
      title: 'Study Bank & Vault',
      badge: 'IndexedDB Offline',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      description: 'Offline local repository for all generated quizzes, cards, and exams with rich Microsoft Word (.docx) export.',
      icon: BookOpen,
      iconBg: 'bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-blue-500/20',
      action: onOpenStudyBank,
      tag: 'Local Persistence',
    },
    {
      id: 'scratchpad',
      title: 'Live Scratchpad & Notes',
      badge: 'Auto-Synthesis',
      badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
      description: 'Real-time background extraction of key formulas, rules, flashcards, and summary notes during conversations.',
      icon: Brain,
      iconBg: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-slate-500/20',
      action: onOpenScratchpad,
      tag: 'Note Extractor',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Studio Tools & Learning Modules</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a specialized AI studio module to elevate your understanding
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={tool.action}
              className={`group relative flex flex-col justify-between text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                tool.featured
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105 ${tool.iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tool.badgeColor}`}
                    >
                      {tool.badge}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>{tool.tag}</span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">
                  Launch →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
