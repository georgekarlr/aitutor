import { useState } from 'react';
import {
  Headphones,
  Layers,
  Award,
  BookOpen,
  FileText,
  Radio,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
} from 'lucide-react';
import type { StudioMessageArtifact, CurriculumModule } from '@/types';

interface StudioArtifactCardProps {
  artifact: StudioMessageArtifact;
  onOpenAudioStudio?: (topic?: string) => void;
  onOpenWhiteboard?: (topic?: string) => void;
  onOpenMockExam?: (subject?: string) => void;
  onOpenCurriculum?: (subject?: string) => void;
  onOpenScratchpad?: () => void;
}

export function StudioArtifactCard({
  artifact,
  onOpenAudioStudio,
  onOpenWhiteboard,
  onOpenMockExam,
  onOpenCurriculum,
  onOpenScratchpad,
}: StudioArtifactCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  switch (artifact.type) {
    case 'podcast': {
      const ep = artifact.data;
      return (
        <div className="w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/40 dark:from-rose-950/30 dark:via-slate-900 dark:to-amber-950/20 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-xs shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                    Audio Briefing Studio
                  </span>
                  {ep?.estimatedDuration && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {ep.estimatedDuration}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {artifact.title || ep?.title || 'Podcast Deep-Dive'}
                </h4>
              </div>
            </div>

            {onOpenAudioStudio && (
              <button
                type="button"
                onClick={() => onOpenAudioStudio(ep?.topic || artifact.title)}
                className="flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span>Listen</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {artifact.summary && (
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {artifact.summary}
            </p>
          )}

          {ep?.keyTakeaways && ep.keyTakeaways.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-rose-100 dark:border-rose-900/40">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 cursor-pointer"
              >
                <span>Key Takeaways ({ep.keyTakeaways.length})</span>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {isExpanded && (
                <ul className="space-y-1 pt-1 text-xs text-slate-700 dark:text-slate-300">
                  {ep.keyTakeaways.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      );
    }

    case 'whiteboard': {
      const wb = artifact.data;
      return (
        <div className="w-full rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-sky-950/20 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-xs shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                    Whiteboard Walkthrough
                  </span>
                  {wb?.steps && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {wb.steps.length} Animated Steps
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {artifact.title || wb?.topic || 'Interactive Vector Walkthrough'}
                </h4>
              </div>
            </div>

            {onOpenWhiteboard && (
              <button
                type="button"
                onClick={() => onOpenWhiteboard(wb?.topic || artifact.title)}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span>View Board</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {artifact.summary && (
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {artifact.summary}
            </p>
          )}

          {wb?.coreConcepts && wb.coreConcepts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
              {wb.coreConcepts.map((c: string, idx: number) => (
                <span
                  key={idx}
                  className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300"
                >
                  💡 {c}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'mock_exam': {
      const rep = artifact.data;
      return (
        <div className="w-full rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-emerald-950/20 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-xs shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                    Timed Mock Exam Scorecard
                  </span>
                  {rep?.percentage !== undefined && (
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                      {rep.percentage}%
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {artifact.title || 'Diagnostic Assessment Results'}
                </h4>
              </div>
            </div>

            {onOpenMockExam && (
              <button
                type="button"
                onClick={() => onOpenMockExam(rep?.subject || artifact.title)}
                className="flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span>Retake / Review</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {rep && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/60 dark:bg-slate-800/60 p-2.5 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Score</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {rep.totalScore} / {rep.maxScore} pts
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Proctor Integrity</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {rep.integrityViolationsCount === 0 ? 'Full Integrity' : `${rep.integrityViolationsCount} warnings`}
                </p>
              </div>
            </div>
          )}

          {rep?.masteredConcepts && rep.masteredConcepts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mr-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Mastered:
              </span>
              {rep.masteredConcepts.map((c: string, idx: number) => (
                <span
                  key={idx}
                  className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'curriculum': {
      const plan = artifact.data;
      return (
        <div className="w-full rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/40 dark:from-purple-950/30 dark:via-slate-900 dark:to-indigo-950/20 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300">
                    Syllabus & Curriculum
                  </span>
                  {plan?.level && (
                    <span className="text-[11px] text-slate-500 capitalize">
                      {plan.level}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {artifact.title || plan?.subject || 'Structured Learning Roadmap'}
                </h4>
              </div>
            </div>

            {onOpenCurriculum && (
              <button
                type="button"
                onClick={() => onOpenCurriculum(plan?.subject || artifact.title)}
                className="flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span>Study Plan</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {artifact.summary && (
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {artifact.summary}
            </p>
          )}

          {plan?.modules && plan.modules.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-purple-100 dark:border-purple-900/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Modules ({plan.modules.length})
              </div>
              <div className="space-y-1">
                {plan.modules.slice(0, 3).map((mod: CurriculumModule, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                    <span className="truncate max-w-[240px]">
                      {idx + 1}. {mod.title}
                    </span>
                    <span className="text-[10px] text-slate-400">⏱ {mod.estimatedMinutes}m</span>
                  </div>
                ))}
                {plan.modules.length > 3 && (
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    +{plan.modules.length - 3} more modules in roadmap
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    case 'scratchpad_note': {
      const note = artifact.data;
      return (
        <div className="w-full rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-gradient-to-br from-sky-50/80 via-white to-blue-50/40 dark:from-sky-950/30 dark:via-slate-900 dark:to-blue-950/20 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300">
                    Live Scratchpad Note
                  </span>
                  {note?.subject && (
                    <span className="text-[11px] text-slate-500">
                      {note.subject}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {artifact.title || note?.title || 'Synthesized Study Note'}
                </h4>
              </div>
            </div>

            {onOpenScratchpad && (
              <button
                type="button"
                onClick={onOpenScratchpad}
                className="flex items-center gap-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span>Open Note</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {artifact.summary && (
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {artifact.summary}
            </p>
          )}

          {note?.keyConcepts && note.keyConcepts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-sky-100 dark:border-sky-900/40">
              {note.keyConcepts.map((c: string, idx: number) => (
                <span
                  key={idx}
                  className="rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'live_transcript': {
      return (
        <div className="w-full rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shrink-0">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                  Gemini Live Session Transcript
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {artifact.title || 'Voice Socratic Tutoring Summary'}
              </h4>
            </div>
          </div>

          {artifact.summary && (
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {artifact.summary}
            </p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
