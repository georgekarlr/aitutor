import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Sparkles,
} from 'lucide-react';
import type { SavedStudyItem, TutorQuestionItem, StudyItemMode } from '@/types';

interface EditStudyItemModalProps {
  isOpen: boolean;
  item: SavedStudyItem | null;
  onClose: () => void;
  onSave: (updatedItem: SavedStudyItem) => void;
}

export function EditStudyItemModal({
  isOpen,
  item,
  onClose,
  onSave,
}: EditStudyItemModalProps) {
  if (!isOpen || !item) return null;

  return <EditStudyItemForm item={item} onClose={onClose} onSave={onSave} />;
}

function EditStudyItemForm({
  item,
  onClose,
  onSave,
}: {
  item: SavedStudyItem;
  onClose: () => void;
  onSave: (updatedItem: SavedStudyItem) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [topic, setTopic] = useState(item.topic);
  const [mode, setMode] = useState<StudyItemMode>(item.mode);
  const [description, setDescription] = useState(item.description || '');
  const [questions, setQuestions] = useState<TutorQuestionItem[]>(() =>
    item.questions.map((q) => ({
      ...q,
      options: q.options ? [...q.options] : [],
    })),
  );

  const handleAddQuestion = () => {
    const newQ: TutorQuestionItem = {
      id: `q-${crypto.randomUUID().slice(0, 6)}`,
      question: '',
      options: mode === 'quiz' || mode === 'exam' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
      correctAnswer: '',
      hint: '',
      points: mode === 'exam' ? 10 : 1,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleUpdateQuestion = (index: number, patch: Partial<TutorQuestionItem>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, ...patch } : q)),
    );
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('A quiz must have at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const nextOpts = [...(q.options || [])];
        nextOpts[optIndex] = val;
        return { ...q, options: nextOpts };
      }),
    );
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const currentOpts = q.options || [];
        const nextLetter = String.fromCharCode(65 + currentOpts.length);
        return { ...q, options: [...currentOpts, `Option ${nextLetter}`] };
      }),
    );
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const nextOpts = (q.options || []).filter((_, oIdx) => oIdx !== optIndex);
        return { ...q, options: nextOpts };
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title for this study item.');
      return;
    }
    if (!topic.trim()) {
      alert('Please enter a topic.');
      return;
    }

    // Filter out completely empty questions
    const validQuestions = questions.filter((q) => q.question.trim().length > 0);
    if (validQuestions.length === 0) {
      alert('Please provide at least one valid question with text.');
      return;
    }

    const updated: SavedStudyItem = {
      ...item,
      title: title.trim(),
      topic: topic.trim(),
      mode,
      description: description.trim(),
      questions: validQuestions,
      updatedAt: Date.now(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                Modify & Edit Stored Quiz
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update questions, choices, answers, and explanations in IndexedDB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Quiz / Module Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cellular Biology Master Quiz"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Subject / Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Biology"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Study Format
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as StudyItemMode)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
              >
                <option value="quiz">Multiple Choice Quiz</option>
                <option value="exam">Formal Exam with Points</option>
                <option value="flashcard">Flashcard Set</option>
                <option value="qna">Question & Answer Bank</option>
                <option value="recitation">Oral Recitation</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Description / Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional summary or notes..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Question List Header */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Questions ({questions.length})
              </span>
              <span className="text-xs text-slate-500">
                All changes are automatically saved to local storage
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex items-center gap-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 px-3 py-1.5 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Question
            </button>
          </div>

          {/* Questions Items */}
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3.5"
              >
                {/* Question Header & Delete */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500 text-white text-xs font-bold">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Question Prompt
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {mode === 'exam' && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500">Pts:</span>
                        <input
                          type="number"
                          value={q.points ?? 10}
                          onChange={(e) =>
                            handleUpdateQuestion(qIdx, {
                              points: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <textarea
                  value={q.question}
                  onChange={(e) => handleUpdateQuestion(qIdx, { question: e.target.value })}
                  rows={2}
                  placeholder="Enter the question text here..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500"
                  required
                />

                {/* Multiple Choice Options (if present or if quiz/exam) */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>Multiple Choice Options:</span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIdx)}
                        className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Plus className="h-3 w-3" /> Add Choice
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Choice ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(qIdx, optIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                            title="Remove choice"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct Answer & Hint */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                      ✔ Correct Answer (Answer Key)
                    </label>
                    <input
                      type="text"
                      value={q.correctAnswer || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, { correctAnswer: e.target.value })}
                      placeholder="e.g., B) Mitochondria or 1789"
                      className="w-full rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-100 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                      💡 Hint / Explanation Note
                    </label>
                    <input
                      type="text"
                      value={q.hint || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, { hint: e.target.value })}
                      placeholder="e.g., Commonly referred to as the cellular powerhouse"
                      className="w-full rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-900 dark:text-amber-100 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-4 pb-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-lg hover:shadow-sky-500/25 transition-all"
            >
              <Save className="h-4 w-4" />
              Save Changes to Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
