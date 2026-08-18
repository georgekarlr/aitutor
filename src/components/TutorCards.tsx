import { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Layers,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  Send,
  RotateCw,
  Trophy,
  ChevronRight,
  FileText,
  Sparkles,
  MessageSquare,
  BrainCircuit,
  Paperclip,
} from 'lucide-react';
import type { TutorMessageData, ChatMessage } from '@/types';
import { ReadAloudButton, VoiceInputButton } from './VoiceReadInputControls';

// ===== Quiz/Exam Question Card =====
interface QuestionCardProps {
  data: TutorMessageData;
  onSubmitAnswer: (answer: string) => void;
  isLast: boolean;
}

export function QuestionCard({ data, onSubmitAnswer }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState('');
  const [showHint, setShowHint] = useState(false);

  const isMultipleChoice = data.options && data.options.length > 0;
  const isExam = data.type === 'exam-question' || data.type === 'exam-feedback';
  const accentColor = isExam ? 'rose' : data.mode === 'recitation' ? 'amber' : 'sky';
  const accentClasses: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
    sky: { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-sky-600 dark:text-sky-400', gradient: 'from-sky-500 to-cyan-500' },
    rose: { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-500 to-pink-500' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-orange-500' },
  };
  const ac = accentClasses[accentColor];
  const isLoading = data.evaluating ?? false;
  const isSubmitted = data.awaitingAnswer === false;
  const hasFeedback = data.type === 'quiz-feedback' || data.type === 'exam-feedback';

  const handleSubmit = () => {
    if (!selectedOption.trim() || isLoading || isSubmitted) return;
    onSubmitAnswer(selectedOption);
  };

  // Dedicated rendering for Feedback Messages
  if (hasFeedback) {
    return (
      <div className="my-2.5 w-full">
        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-xs overflow-hidden ${
            data.isCorrect
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
              : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80'
          }`}
        >
          <div className="flex items-start gap-3">
            {data.isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold ${data.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {data.isCorrect ? 'Correct Answer!' : 'Incorrect'}
                </span>
                <ReadAloudButton
                  textToRead={`Evaluation: ${data.isCorrect ? 'Correct' : 'Incorrect'}. Correct Answer: ${data.correctAnswer || ''}. ${data.feedback || ''}. ${data.explanation || ''}`}
                  label="Read Feedback"
                  autoSpeak={true}
                />
              </div>

              {data.userAnswer && (
                <p className="text-xs text-slate-700 dark:text-slate-300 break-words">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Your answer:</span> {data.userAnswer}
                </p>
              )}

              {!data.isCorrect && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-100/60 dark:bg-emerald-900/40 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 break-words">
                  <span className="block text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold mb-0.5">
                    Correct Answer:
                  </span>
                  {data.correctAnswer || 'See explanation below'}
                </div>
              )}

              {data.feedback && (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                  {data.feedback}
                </p>
              )}

              {data.explanation && (
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                  <span className="font-semibold block mb-0.5 text-slate-800 dark:text-slate-200">Explanation:</span>
                  {data.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-2.5 w-full">
      {/* Progress bar */}
      {data.step !== undefined && data.totalSteps !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider truncate ${ac.text}`}>
              {isExam ? 'Exam' : data.mode === 'recitation' ? 'Oral Recitation' : 'Quiz'}
              {data.topic ? ` · ${data.topic}` : ''}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              Q{data.step} of {data.totalSteps}
              {data.points ? ` · ${data.points}pts` : ''}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${ac.gradient} transition-all duration-500`}
              style={{ width: `${(data.step / data.totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed flex-1 break-words">
              {data.question}
            </h3>
            <div className="shrink-0 pt-0.5">
              <ReadAloudButton textToRead={data.question || ''} label="Read Question" autoSpeak={true} />
            </div>
          </div>

          {data.hint && (
            <div>
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors cursor-pointer"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {showHint ? 'Hide hint' : 'Need a hint?'}
              </button>
              {showHint && (
                <p className="mt-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 leading-relaxed break-words">
                  {data.hint}
                </p>
              )}
            </div>
          )}

          {/* Answer area */}
          <div className="space-y-2.5 pt-1">
            {!isSubmitted && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 rounded-xl px-3 py-2 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Voice Answer:
                </span>
                <VoiceInputButton
                  onTranscript={(txt) => setSelectedOption(txt)}
                  options={data.options}
                  onSelectOption={(opt) => setSelectedOption(opt)}
                  label="Speak Answer"
                />
              </div>
            )}

            {isMultipleChoice ? (
              <div className="space-y-2">
                {data.options!.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !isLoading && !isSubmitted && setSelectedOption(opt)}
                      disabled={isLoading || isSubmitted}
                      className={`group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm transition-all cursor-pointer ${
                        isSelected
                          ? `${ac.border} bg-sky-50 dark:bg-sky-950/40 ${ac.text} font-medium ring-1 ring-sky-500/30`
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            isSelected
                              ? `${ac.bg} text-white`
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1 min-w-0 break-words leading-relaxed text-sm">
                          {opt}
                        </span>
                      </div>
                      <div
                        className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? `${ac.border} ${ac.bg} text-white`
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
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                disabled={isLoading || isSubmitted}
                rows={2}
                autoFocus
                data-tutor-input="true"
                placeholder={isSubmitted ? 'Submitted' : 'Type your answer...'}
                className="w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Submit footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 px-4 py-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedOption.trim() || isLoading || isSubmitted}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              isLoading || isSubmitted ? 'bg-slate-400' : `bg-gradient-to-r ${ac.gradient} hover:shadow-md`
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : isSubmitted ? (
              <>Submitted</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Answer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Flashcard Card =====
interface FlashcardCardProps {
  data: TutorMessageData;
  onEvaluate: (userAnswer: string) => void;
  onNext: () => void;
  isLast: boolean;
}

export function FlashcardCard({ data, onEvaluate, onNext, isLast }: FlashcardCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const hasFeedback = data.type === 'flashcard-feedback';

  const handleEvaluate = () => {
    if (!userAnswer.trim() || data.evaluating) return;
    setEvaluated(true);
    onEvaluate(userAnswer);
  };

  const handleNext = () => {
    setFlipped(false);
    setUserAnswer('');
    setShowHint(false);
    setEvaluated(false);
    onNext();
  };

  return (
    <div className="my-2.5 w-full">
      {/* Progress */}
      {data.cardIndex !== undefined && data.totalCards !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
              Flashcards{data.topic ? ` · ${data.topic}` : ''}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              Card {data.cardIndex + 1} of {data.totalCards}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${((data.cardIndex + 1) / data.totalCards) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Feedback */}
      {hasFeedback && data.isCorrect !== undefined && data.feedback && (
        <div
          className={`mb-3 rounded-xl border p-3.5 shadow-xs overflow-hidden ${
            data.isCorrect
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {data.isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <p className={`text-xs font-bold ${data.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {data.isCorrect ? 'Correct Recall!' : 'Review Recommended'}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">{data.feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Flashcard Card (Non-overlapping layout) */}
      <div
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition-all"
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                flipped
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300'
              }`}>
                {flipped ? 'Answer / Back' : 'Question / Front'}
              </span>
            </div>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <ReadAloudButton textToRead={(flipped ? data.back : data.front) || ''} label="Read Aloud" />
              <button
                type="button"
                onClick={() => setFlipped(!flipped)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Flip flashcard"
              >
                <RotateCw className="h-3.5 w-3.5 text-slate-500" />
                Flip
              </button>
            </div>
          </div>

          {/* Flashcard Content */}
          <div
            onClick={() => !data.evaluating && setFlipped(!flipped)}
            className="cursor-pointer min-h-[100px] flex flex-col justify-center py-2"
          >
            {!flipped ? (
              <div className="space-y-3">
                <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed break-words">
                  {data.front}
                </p>
                {data.hint && (
                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium"
                    >
                      <Lightbulb className="h-3 w-3" />
                      {showHint ? 'Hide hint' : 'Show hint'}
                    </button>
                    {showHint && (
                      <p className="mt-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 break-words leading-relaxed">
                        {data.hint}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2 select-none">
                  💡 Click anywhere on card to flip & see answer
                </p>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 border border-emerald-200/60 dark:border-emerald-800/40">
                <p className="text-sm sm:text-base font-medium text-emerald-900 dark:text-emerald-100 leading-relaxed break-words">
                  {data.back}
                </p>
                <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 pt-1 select-none">
                  💡 Click to flip back to question
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer recall input */}
      {!evaluated && (
        <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Test Recall (optional)
            </label>
            <VoiceInputButton
              onTranscript={(txt) => setUserAnswer(txt)}
              label="Speak Answer"
            />
          </div>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={data.evaluating}
            rows={2}
            data-tutor-input="true"
            placeholder="Type what you think the answer is..."
            className="w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={data.evaluating || !userAnswer.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-40 transition-all cursor-pointer"
          >
            {data.evaluating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking Recall...
              </>
            ) : (
              'Check My Answer'
            )}
          </button>
        </div>
      )}

      {/* Next card button */}
      {evaluated && (
        <button
          type="button"
          onClick={handleNext}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          {isLast ? 'Finish Deck' : 'Next Flashcard'}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ===== Session Complete Card =====
interface SessionCompleteCardProps {
  data: TutorMessageData;
  onNewSession: () => void;
}

export function SessionCompleteCard({ data, onNewSession }: SessionCompleteCardProps) {
  const percentage = data.percentage ?? 0;
  return (
    <div className="my-2 w-full">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
            <Trophy className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            Session Complete!
          </h3>
          {data.topic && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Topic: {data.topic}</p>
          )}

          {data.maxScore !== undefined && data.maxScore > 0 && (
            <>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                {data.finalScore} / {data.maxScore}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">{percentage}% correct</div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    percentage >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : percentage >= 50
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-rose-500 to-pink-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
                {percentage >= 80
                  ? 'Excellent work! You really know this topic.'
                  : percentage >= 50
                    ? 'Good effort! Review what you missed and try again.'
                    : 'Keep practicing! You\'ll get there with more study.'}
              </p>
            </>
          )}

          <button
            onClick={onNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
          >
            <RotateCw className="h-4 w-4" />
            New Session
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Mode Select Card =====
interface ModeSelectCardProps {
  onSelectMode: (mode: 'quiz' | 'flashcard', topic: string, numItems: number) => void;
  messages?: ChatMessage[];
}

export function ModeSelectCard({ onSelectMode, messages = [] }: ModeSelectCardProps) {
  const [selectedMode, setSelectedMode] = useState<'quiz' | 'flashcard'>('quiz');
  const [topic, setTopic] = useState('');
  const [numItems, setNumItems] = useState(5);

  // Gather uploaded files and non-tutor chat messages
  const attachments = useMemo(() => messages.flatMap((m) => m.attachments || []), [messages]);
  const chatMessages = useMemo(() => messages.filter((m) => !m.tutorData && m.content.trim().length > 0), [messages]);

  // Derive suggested topics
  const suggestedTopics = useMemo(() => {
    const list: string[] = [];

    // Add filenames without extensions
    attachments.forEach((att) => {
      const cleanName = att.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (cleanName && !list.includes(cleanName)) {
        list.push(cleanName);
      }
    });

    // Extract candidate topic phrases from last user query if available
    const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === 'user')?.content || '';
    if (lastUserMsg) {
      const trimmed = lastUserMsg.slice(0, 40).trim();
      if (trimmed && !list.includes(trimmed)) {
        list.push(trimmed);
      }
    }
    return list;
  }, [attachments, chatMessages]);

  // Pre-fill topic if empty
  useEffect(() => {
    if (!topic && suggestedTopics.length > 0) {
      setTopic(suggestedTopics[0]);
    }
  }, [suggestedTopics, topic]);

  const MODE_CONFIG = [
    { mode: 'quiz' as const, label: 'Quiz', icon: HelpCircle, gradient: 'from-sky-500 to-cyan-500', color: 'sky', description: 'Answer questions one by one' },
    { mode: 'flashcard' as const, label: 'Flashcards', icon: Layers, gradient: 'from-emerald-500 to-teal-500', color: 'emerald', description: 'Flip cards to test knowledge' },
  ];

  const hasAbsorbedData = attachments.length > 0 || chatMessages.length > 0;

  return (
    <div className="my-2 w-full">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-700/60 bg-gradient-to-r from-sky-50/50 via-slate-50 to-cyan-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sm">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                AI Knowledge Engine & Tutor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your format to generate questions from absorbed study materials & chat context.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Absorbed Data Panel */}
          <div className="rounded-xl border border-sky-100 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-950/20 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  Absorbed Knowledge Base
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {hasAbsorbedData ? 'Ready for Tutor Mode' : 'Direct Topic Mode'}
              </span>
            </div>

            {hasAbsorbedData ? (
              <div className="space-y-2">
                {attachments.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                      Uploaded Documents ({attachments.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {attachments.map((att) => (
                        <span
                          key={att.id}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs"
                        >
                          <FileText className="h-3 w-3 text-sky-500" />
                          <span className="truncate max-w-[160px]">{att.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    Chat Context: <span className="font-medium text-slate-700 dark:text-slate-200">{chatMessages.length} previous messages absorbed</span>
                  </div>
                )}

                {suggestedTopics.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Click a detected topic to fill:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedTopics.map((top, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTopic(top)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            topic === top
                              ? 'bg-sky-500 text-white border-sky-500 font-medium shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-300'
                          }`}
                        >
                          {top}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                💡 <span className="font-semibold">Recommended workflow:</span> Upload study files (PDFs, docs, TXT, code) or discuss your subject in chat first so the AI absorbs your exact material. Or, type a subject below to generate questions on demand!
              </p>
            )}
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Study Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODE_CONFIG.map((cfg) => {
                const Icon = cfg.icon;
                const isSelected = selectedMode === cfg.mode;
                return (
                  <button
                    key={cfg.mode}
                    type="button"
                    onClick={() => setSelectedMode(cfg.mode)}
                    className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? `border-transparent bg-gradient-to-br ${cfg.gradient} text-white shadow-md`
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : `text-${cfg.color}-500`}`} />
                    <span className="text-xs font-bold">{cfg.label}</span>
                    <span className={`text-[10px] leading-tight ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                      {cfg.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic & Settings */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Topic / Subject Matter
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && topic.trim()) {
                    onSelectMode(selectedMode, topic.trim(), numItems);
                  }
                }}
                placeholder="e.g., Photosynthesis, React Hooks, History Chapter 4..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Number of {selectedMode === 'flashcard' ? 'cards' : 'questions'} (1 - 50)
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
                  <span className="text-[10px] text-slate-400 font-medium">items</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                {[3, 5, 10, 15, 20, 30, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNumItems(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      numItems === preset
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {preset}
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

            <button
              type="button"
              onClick={() => topic.trim() && onSelectMode(selectedMode, topic.trim(), numItems)}
              disabled={!topic.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
              Start {selectedMode === 'flashcard' ? 'Flashcards' : 'Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
