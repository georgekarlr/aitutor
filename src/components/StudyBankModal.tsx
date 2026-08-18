import { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  FileDown,
  Play,
  Edit3,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  HelpCircle,
  Layers,
  ClipboardCheck,
  FileText,
  Sparkles,
  Trophy,
  Calendar,
  CheckCircle2,
  MessageSquare,
  FolderDown,
  Upload,
} from 'lucide-react';
import type { SavedStudyItem, StudyItemMode } from '@/types';
import { useStudyBank } from '@/hooks/useStudyBank';
import { EditStudyItemModal } from './EditStudyItemModal';
import { StudyVaultExportImportModal } from './StudyVaultExportImportModal';

interface StudyBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchQuiz: (item: SavedStudyItem) => void;
  currentConversationId?: string;
  currentConversationTitle?: string;
}

export function StudyBankModal({
  isOpen,
  onClose,
  onLaunchQuiz,
  currentConversationId,
  currentConversationTitle,
}: StudyBankModalProps) {
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    importItems,
    exportToDocx,
    exportBatchToDocx,
    isExporting,
  } = useStudyBank();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | StudyItemMode>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'current'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<SavedStudyItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [exportImportModalOpen, setExportImportModalOpen] = useState(false);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by conversation scope if requested
      if (scopeFilter === 'current' && currentConversationId) {
        if (item.conversationId !== currentConversationId) {
          return false;
        }
      }

      const matchesFilter =
        selectedFilter === 'all' || item.mode === selectedFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        (item.conversationTitle && item.conversationTitle.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.questions.some(
          (qu) =>
            qu.question.toLowerCase().includes(q) ||
            (qu.correctAnswer && qu.correctAnswer.toLowerCase().includes(q)),
        );
      return matchesFilter && matchesSearch;
    });
  }, [items, selectedFilter, searchQuery, scopeFilter, currentConversationId]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAllFiltered = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleExportSingle = async (item: SavedStudyItem) => {
    try {
      await exportToDocx(item);
      setExportSuccessMsg(`Successfully exported "${item.title}" to DOCX!`);
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch {
      alert('Failed to generate DOCX file. Please check your browser settings.');
    }
  };

  const handleExportSelected = async () => {
    const targetItems =
      selectedIds.length > 0
        ? items.filter((i) => selectedIds.includes(i.id))
        : filteredItems;

    if (targetItems.length === 0) {
      alert('No quizzes selected to export.');
      return;
    }

    try {
      await exportBatchToDocx(targetItems, `Study_Vault_Quizzes_${Date.now()}`);
      setExportSuccessMsg(`Exported ${targetItems.length} quiz module(s) into DOCX!`);
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch {
      alert('Failed to generate batch DOCX file.');
    }
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}" from your IndexedDB study vault?`)) {
      deleteItem(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleCreateNew = () => {
    const defaultTemplate: SavedStudyItem = {
      id: `custom-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Custom Quiz Module',
      topic: 'General Subject',
      mode: 'quiz',
      description: 'Custom created study set stored in IndexedDB.',
      questions: [
        {
          id: 'q1',
          question: 'What is the primary question here?',
          options: ['A) Choice 1', 'B) Choice 2', 'C) Choice 3', 'D) Choice 4'],
          correctAnswer: 'A) Choice 1',
          hint: 'Helpful hint for students.',
          points: 1,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attemptsCount: 0,
    };
    setEditingItem(defaultTemplate);
    setIsCreating(true);
  };

  const handleSaveEdited = (updated: SavedStudyItem) => {
    if (isCreating) {
      addItem(updated);
      setIsCreating(false);
    } else {
      updateItem(updated.id, updated);
    }
    setEditingItem(null);
  };

  const totalQuestionsStored = items.reduce(
    (acc, curr) => acc + curr.questions.length,
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                  Study Vault & IndexedDB Bank
                </h2>
                <span className="rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-extrabold px-2 py-0.5 border border-sky-200 dark:border-sky-800">
                  INDEXEDDB VAULT
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stored quizzes, flashcards, Q&As, and exams in IndexedDB offline storage. Review, re-answer, edit, or export to formatted DOCX.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setExportImportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-2 shadow-xs transition-all cursor-pointer"
              title="Import, export, or backup study vault modules (.json, .docx, .md)"
            >
              <FolderDown className="h-4 w-4" />
              <span>Import / Export Vault</span>
            </button>
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3.5 py-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Quiz</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Export Notification Toast */}
        {exportSuccessMsg && (
          <div className="bg-emerald-500 text-white px-6 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{exportSuccessMsg}</span>
            </div>
            <span className="text-[11px] opacity-80">Format: Questions first + Answer Key at end</span>
          </div>
        )}

        {/* Stats & Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Modules:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{items.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Total Questions:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{totalQuestionsStored}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Selected:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">
              {selectedIds.length} of {filteredItems.length}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setExportImportModalOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Import or Export JSON / Markdown / DOCX"
            >
              <Upload className="h-3.5 w-3.5 text-sky-500" />
              <span>Import</span>
            </button>
            <button
              type="button"
              onClick={handleExportSelected}
              disabled={isExporting || (selectedIds.length === 0 && filteredItems.length === 0)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              title="Export all selected quizzes with question list first and answer keys at the end"
            >
              <FileDown className="h-3.5 w-3.5" />
              {isExporting ? 'Exporting...' : selectedIds.length > 0 ? `Export (${selectedIds.length}) DOCX` : 'Export All DOCX'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quizzes, topics, questions..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500"
              />
            </div>

            {/* Scope Filter (All vs Current Conversation) */}
            {currentConversationId && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    scopeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  All Vault Quizzes
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('current')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    scopeFilter === 'current'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>This Chat ({currentConversationTitle ? currentConversationTitle.slice(0, 18) : 'Current'})</span>
                </button>
              </div>
            )}
          </div>

          {/* Filter Pills & Select All */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare className="h-3.5 w-3.5 text-sky-500" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              Select All
            </button>

            {[
              { id: 'all' as const, label: 'All Types' },
              { id: 'quiz' as const, label: 'Quizzes' },
              { id: 'exam' as const, label: 'Exams' },
              { id: 'flashcard' as const, label: 'Flashcards' },
              { id: 'qna' as const, label: 'Q&A Banks' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === f.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No study items found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? 'Try adjusting your search query or filter.'
                  : 'Start by saving a quiz from an AI Tutor session or click "New Quiz".'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`group rounded-2xl border p-4 sm:p-5 transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 ring-1 ring-sky-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Checkbox + Title & Mode */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelect(item.id)}
                          className="mt-1 text-slate-400 hover:text-sky-500 flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-sky-500" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                item.mode === 'quiz'
                                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                  : item.mode === 'exam'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : item.mode === 'flashcard'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              }`}
                            >
                              {item.mode === 'quiz' && <HelpCircle className="h-3 w-3" />}
                              {item.mode === 'exam' && <ClipboardCheck className="h-3 w-3" />}
                              {item.mode === 'flashcard' && <Layers className="h-3 w-3" />}
                              {item.mode === 'qna' && <FileText className="h-3 w-3" />}
                              {item.mode}
                            </span>

                            {item.conversationTitle && (
                              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 max-w-[200px] truncate">
                                <MessageSquare className="h-2.5 w-2.5 flex-shrink-0" />
                                <span className="truncate">{item.conversationTitle}</span>
                              </span>
                            )}

                            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                              {item.title}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Topic: {item.topic}
                            </span>
                            <span>•</span>
                            <span>{item.questions.length} Questions</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </span>
                            {item.lastScore && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                  <Trophy className="h-3 w-3" />
                                  Last Score: {item.lastScore.percentage}% ({item.lastScore.score}/{item.lastScore.maxScore})
                                </span>
                              </>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                        {/* Launch Quiz in Tutor to Answer Again */}
                        <button
                          type="button"
                          onClick={() => {
                            onLaunchQuiz(item);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
                          title="Practice and answer this specific quiz again in the AI Tutor"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Practice</span>
                        </button>

                        {/* Export to DOCX */}
                        <button
                          type="button"
                          onClick={() => handleExportSingle(item)}
                          disabled={isExporting}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Export to formatted DOCX (Questions first, Answers at the end)"
                        >
                          <FileDown className="h-3.5 w-3.5 text-indigo-500" />
                          <span>DOCX</span>
                        </button>

                        {/* Edit / Modify Quiz */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsCreating(false);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Modify quiz questions, choices, or answers"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Quiz */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Delete from IndexedDB"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            <span>
              All study sets are persistently preserved in browser IndexedDB.
            </span>
          </div>
          <span className="text-[11px]">
            DOCX format includes clean question sheets with an Answer Key section at the end.
          </span>
        </div>
      </div>

      {/* Edit / Modify Modal */}
      {editingItem && (
        <EditStudyItemModal
          isOpen={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdited}
        />
      )}

      {/* Study Vault Export & Import Modal */}
      {exportImportModalOpen && (
        <StudyVaultExportImportModal
          isOpen={exportImportModalOpen}
          onClose={() => setExportImportModalOpen(false)}
          items={items}
          selectedItemIds={selectedIds}
          onImportItems={(newItems, replaceAll) => {
            importItems(newItems, replaceAll);
            setExportSuccessMsg(`Imported ${newItems.length} study module(s) into vault!`);
            setTimeout(() => setExportSuccessMsg(null), 3500);
          }}
        />
      )}
    </div>
  );
}
