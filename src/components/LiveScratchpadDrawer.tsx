/**
 * LiveScratchpadDrawer.tsx
 *
 * Interactive Live Scratchpad & Proactive Socratic Scaffolding Drawer.
 * Allows students to view real-time synthesized study notes, active recall flashcards,
 * actionable study checklists, and proactive AI recommendations for overcoming knowledge gaps.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  FileText,
  Layers,
  Download,
  Trash2,
  Plus,
  Save,
  CheckSquare,
  Square,
  Flame,
  Lightbulb,
  Radio,
  FileCode,
  Search,
  RefreshCw,
  ChevronRight,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import type {
  LiveScratchpadNote,
  ProactiveScaffoldingSuggestion,
  ChatMessage,
  GeminiSettings,
  KnowledgeGraphData,
  SavedStudyItem,
  Conversation,
} from '@/types';
import {
  saveScratchpadNote,
  deleteScratchpadNote,
  subscribeScratchpadNotes,
  createEmptyScratchpadNote,
} from '@/lib/scratchpadStorage';
import {
  extractLiveNotesFromChat,
  generateProactiveScaffoldingSuggestions,
  exportScratchpadToDocx,
  exportScratchpadToMarkdown,
} from '@/lib/noteExtractor';
import { getKnowledgeGraph } from '@/lib/knowledgeGraphStorage';
import { putStudyItemInDB } from '@/lib/studyBankStorage';
import { ConversationSourceSelector } from '@/components/ConversationSourceSelector';
import Markdown from '@/components/Markdown';

interface LiveScratchpadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeminiSettings;
  messages: ChatMessage[];
  conversations?: Conversation[];
  activeConversation?: Conversation | null;
  conversationTitle?: string;
  conversationId?: string;
  onLaunchPractice?: (topic: string, mode: 'quiz' | 'flashcards' | 'exam') => void;
  onLaunchGeminiLive?: (topic?: string) => void;
  onInsertIntoChat?: (note: LiveScratchpadNote) => void;
}

type TabType = 'notes' | 'flashcards' | 'scaffolding' | 'all_notes';

export function LiveScratchpadDrawer({
  isOpen,
  onClose,
  settings,
  messages,
  conversations = [],
  activeConversation,
  conversationTitle,
  conversationId,
  onLaunchPractice,
  onLaunchGeminiLive,
  onInsertIntoChat,
}: LiveScratchpadDrawerProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConversation?.id || conversationId || null);
  const [absorbContext, setAbsorbContext] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [notesList, setNotesList] = useState<LiveScratchpadNote[]>([]);
  const [activeNote, setActiveNote] = useState<LiveScratchpadNote | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [insertedToChat, setInsertedToChat] = useState(false);

  // Sync selected conversation if activeConversation changes and none selected yet
  useEffect(() => {
    if (activeConversation?.id && !selectedConvId) {
      setSelectedConvId(activeConversation.id);
    }
  }, [activeConversation, selectedConvId]);

  // Derived effective conversation context
  const selectedConv = conversations.find((c) => c.id === selectedConvId) || (activeConversation?.id === selectedConvId ? activeConversation : null);
  const effectiveMessages = selectedConv?.messages?.length ? selectedConv.messages : messages;
  const effectiveTitle = selectedConv?.title || conversationTitle || 'Study Session';
  const effectiveConvId = selectedConv?.id || conversationId;

  // Proactive Scaffolding state
  const [suggestions, setSuggestions] = useState<ProactiveScaffoldingSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphData | null>(null);

  // Flashcards state
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [savedToVaultSuccess, setSavedToVaultSuccess] = useState(false);

  // Search filter for all notes
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to scratchpad notes
  useEffect(() => {
    const unsub = subscribeScratchpadNotes((list) => {
      setNotesList(list);
      // If no active note, pick the first or create a template
      setActiveNote((prev) => {
        if (!prev && list.length > 0) {
          setEditedContent(list[0].content);
          setEditedTitle(list[0].title);
          setEditedSubject(list[0].subject);
          return list[0];
        }
        return prev;
      });
    });

    getKnowledgeGraph().then(setKnowledgeGraph);

    return () => unsub();
  }, []);

  // When activeNote changes, sync editor inputs
  useEffect(() => {
    if (activeNote) {
      setEditedContent(activeNote.content);
      setEditedTitle(activeNote.title);
      setEditedSubject(activeNote.subject);
    }
  }, [activeNote]);

  // Load suggestions when drawer opens or effective messages change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingSuggestions(true);

    const msgsToAnalyze = absorbContext ? effectiveMessages : messages;

    generateProactiveScaffoldingSuggestions(settings, msgsToAnalyze, knowledgeGraph)
      .then((res) => {
        if (isMounted) {
          setSuggestions(res);
          setIsLoadingSuggestions(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingSuggestions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, effectiveMessages, messages, absorbContext, settings, knowledgeGraph]);

  const handleExtractNotes = async () => {
    if (isExtracting) return;
    setIsExtracting(true);
    setExtractError(null);

    const msgsToExtract = absorbContext ? effectiveMessages : messages;
    const titleToUse = absorbContext ? effectiveTitle : (conversationTitle || 'Study Session');

    try {
      const extracted = await extractLiveNotesFromChat(
        settings,
        msgsToExtract,
        titleToUse,
        activeNote,
      );
      setActiveNote(extracted);
      setEditedContent(extracted.content);
      setEditedTitle(extracted.title);
      setEditedSubject(extracted.subject);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to extract study notes from chat.';
      setExtractError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    setIsSaving(true);

    try {
      const updated: LiveScratchpadNote = {
        ...activeNote,
        title: editedTitle.trim() || 'Untitled Note',
        subject: editedSubject.trim() || 'General Studies',
        content: editedContent,
        conversationId: effectiveConvId,
        conversationTitle: effectiveTitle,
        updatedAt: Date.now(),
      };
      await saveScratchpadNote(updated);
      setActiveNote(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Save note error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewNote = () => {
    const newNote = createEmptyScratchpadNote(effectiveConvId, effectiveTitle);
    setActiveNote(newNote);
    setEditedContent(newNote.content);
    setEditedTitle(newNote.title);
    setEditedSubject(newNote.subject);
    setIsEditing(true);
    setActiveTab('notes');
  };

  const handleDeleteNote = async (id: string) => {
    await deleteScratchpadNote(id);
    const remaining = notesList.filter((n) => n.id !== id);
    if (activeNote?.id === id) {
      setActiveNote(remaining[0] || null);
    }
  };

  const toggleActionItem = async (itemId: string) => {
    if (!activeNote) return;
    const updatedItems = activeNote.actionItems.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    const updatedNote = { ...activeNote, actionItems: updatedItems };
    setActiveNote(updatedNote);
    await saveScratchpadNote(updatedNote);
  };

  const toggleCardAnswer = (cardId: string) => {
    setRevealedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Convert note flashcards into Study Vault items
  const handleSaveFlashcardsToVault = async () => {
    if (!activeNote || !activeNote.flashcards || activeNote.flashcards.length === 0) return;

    try {
      const studyItem: SavedStudyItem = {
        id: `vault_fc_${Date.now()}`,
        title: `${activeNote.title} (Flashcards)`,
        topic: activeNote.subject,
        mode: 'flashcards',
        totalQuestions: activeNote.flashcards.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        conversationTitle: activeNote.title,
        questions: activeNote.flashcards.map((fc, idx) => ({
          id: `fc_q_${idx + 1}`,
          type: 'flashcard',
          question: fc.question,
          front: fc.question,
          back: fc.answer,
          correctAnswer: fc.answer,
          hint: fc.hint,
        })),
      };

      await putStudyItemInDB(studyItem);
      setSavedToVaultSuccess(true);
      setTimeout(() => setSavedToVaultSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save flashcards to Study Vault:', err);
    }
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notesList;
    const q = searchQuery.toLowerCase();
    return notesList.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.keyConcepts || []).some((c) => c.toLowerCase().includes(q)),
    );
  }, [notesList, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="live_scratchpad_drawer"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in-50 duration-200"
    >
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} aria-label="Close drawer backdrop" />

      {/* Drawer Container */}
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 bg-slate-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Live Scratchpad & Notes
                </h2>
                <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  Feature 3.B
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI background synthesis & Socratic scaffolding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Export DOCX */}
            {activeNote && (
              <button
                type="button"
                onClick={() => exportScratchpadToDocx(activeNote)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Export Note to Microsoft Word (.docx)"
              >
                <Download className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Word</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Close Scratchpad"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Ground on Specific Conversation Context */}
        {conversations.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
            <ConversationSourceSelector
              conversations={conversations}
              selectedConversationId={selectedConvId}
              onSelectConversation={(conv) => setSelectedConvId(conv?.id || null)}
              absorbContext={absorbContext}
              onToggleAbsorbContext={setAbsorbContext}
              compact={true}
              label="Absorb Conversation Context"
              helperText="Synthesize notes and scaffolding from the selected chat history & uploads."
            />
          </div>
        )}

        {/* Action Bar / Extract trigger */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-indigo-50/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-1.5">
            <button
              id="scratchpad_auto_extract_btn"
              type="button"
              onClick={handleExtractNotes}
              disabled={isExtracting || effectiveMessages.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              title="Synthesize notes, flashcards & takeaways from current conversation"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Auto-Synthesize from Chat</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCreateNewNote}
              className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Create new blank note"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-500" />
              <span>New Note</span>
            </button>
          </div>

          {/* Quick status indicator */}
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                ✓ Saved to IndexedDB
              </span>
            )}
            {activeNote?.isAutoExtracted && (
              <span className="rounded-md bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                Agent Synthesized
              </span>
            )}
          </div>
        </div>

        {extractError && (
          <div className="mx-4 mt-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <span>{extractError}</span>
            <button
              type="button"
              onClick={() => setExtractError(null)}
              className="text-rose-500 font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Study Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'flashcards'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Flashcards ({activeNote?.flashcards?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scaffolding')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'scaffolding'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>AI Scaffolding</span>
            {suggestions.length > 0 && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {suggestions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all_notes')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'all_notes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>All Notes ({notesList.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: STUDY NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {activeNote ? (
                <>
                  {/* Note Title & Subject Row */}
                  {isEditing ? (
                    <div className="space-y-2 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 p-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Note Title
                        </label>
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Subject / Topic
                        </label>
                        <input
                          type="text"
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {activeNote.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            {activeNote.subject}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Updated {new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onInsertIntoChat && (
                          <button
                            type="button"
                            onClick={() => {
                              if (activeNote) {
                                onInsertIntoChat(activeNote);
                                setInsertedToChat(true);
                                setTimeout(() => setInsertedToChat(false), 2500);
                              }
                            }}
                            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                              insertedToChat
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                            }`}
                            title="Embed study note into active conversation"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{insertedToChat ? 'Inserted ✓' : 'Insert in Chat'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsEditing(!isEditing)}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                          <span>{isEditing ? 'Preview' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => exportScratchpadToMarkdown(activeNote)}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Export to Markdown (.md)"
                        >
                          <FileCode className="h-3.5 w-3.5 text-slate-500" />
                          <span className="hidden sm:inline">MD</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Executive Summary */}
                  {activeNote.summary && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Executive Summary
                      </p>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {activeNote.summary}
                      </p>
                    </div>
                  )}

                  {/* Key Concepts Chips */}
                  {activeNote.keyConcepts && activeNote.keyConcepts.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Key Concepts Extracted
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeNote.keyConcepts.map((concept, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => onLaunchPractice?.(concept, 'quiz')}
                            className="flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                            title={`Practice ${concept} Quiz in AI Tutor`}
                          >
                            <span>{concept}</span>
                            <ChevronRight className="h-3 w-3 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formulas & Equations */}
                  {activeNote.formulas && activeNote.formulas.length > 0 && (
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5">
                        Formulas & Governing Laws
                      </p>
                      <div className="space-y-1.5">
                        {activeNote.formulas.map((formula, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-1 font-mono text-xs text-emerald-800 dark:text-emerald-300"
                          >
                            📐 {formula}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content / Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Detailed Study Content
                      </p>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleSaveNote}
                          disabled={isSaving}
                          className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>{isSaving ? 'Saving...' : 'Save Note'}</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={14}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        placeholder="Write or edit notes in Markdown..."
                      />
                    ) : (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 prose dark:prose-invert max-w-none text-xs">
                        <Markdown content={activeNote.content} />
                      </div>
                    )}
                  </div>

                  {/* Study Checklist / Action Items */}
                  {activeNote.actionItems && activeNote.actionItems.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Next Action Steps
                      </p>
                      <div className="space-y-2">
                        {activeNote.actionItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleActionItem(item.id)}
                            className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                          >
                            {item.done ? (
                              <CheckSquare className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className={item.done ? 'line-through text-slate-400' : ''}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Practice Launch CTA */}
                  <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-sky-950/30 p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        Practice This Note with AI Proctor
                      </p>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300">
                        Launch an interactive quiz or exam on these exact concepts.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onLaunchPractice?.(activeNote.subject || activeNote.title, 'quiz')}
                        className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Quiz
                      </button>
                      <button
                        type="button"
                        onClick={() => onLaunchPractice?.(activeNote.subject || activeNote.title, 'exam')}
                        className="rounded-xl border border-purple-300 dark:border-purple-700 bg-white/80 dark:bg-slate-900 text-purple-700 dark:text-purple-300 hover:bg-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Exam
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No active scratchpad note yet
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                    Click &quot;Auto-Synthesize from Chat&quot; to turn your recent conversation into high-yield study notes, or start a new note.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateNewNote}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Blank Note</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE RECALL FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active Recall Cards ({activeNote?.flashcards?.length || 0})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Click any card to flip and verify your answer.
                  </p>
                </div>

                {activeNote?.flashcards && activeNote.flashcards.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveFlashcardsToVault}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Store these flashcards permanently in Study Bank Vault"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{savedToVaultSuccess ? '✓ Saved to Vault!' : 'Save to Study Vault'}</span>
                  </button>
                )}
              </div>

              {activeNote?.flashcards && activeNote.flashcards.length > 0 ? (
                <div className="space-y-3">
                  {activeNote.flashcards.map((card, idx) => {
                    const isRevealed = !!revealedCards[card.id];
                    return (
                      <div
                        key={card.id}
                        onClick={() => toggleCardAnswer(card.id)}
                        className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                          isRevealed
                            ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            Card #{idx + 1}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {isRevealed ? 'Click to hide answer' : 'Click to reveal answer'}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          {card.question}
                        </p>

                        {card.hint && !isRevealed && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                            💡 Hint: {card.hint}
                          </p>
                        )}

                        {isRevealed && (
                          <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
                            <p className="font-bold mb-0.5">Answer:</p>
                            <p className="leading-relaxed">{card.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Layers className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold">No flashcards in this note yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Synthesize from chat to automatically generate active recall pairs.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROACTIVE Socratic SCAFFOLDING */}
          {activeTab === 'scaffolding' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Proactive Knowledge Gap Scaffolding
                  </h4>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    Adaptive AI
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI Proctor continuously inspects chat reasoning & knowledge graph mastery to recommend high-impact practice.
                </p>
              </div>

              {isLoadingSuggestions ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                  <p className="text-xs font-medium">Analyzing dialogue & knowledge graph gaps...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {sug.conceptName}
                          </span>
                        </div>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            sug.urgency === 'high'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : sug.urgency === 'medium'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {sug.urgency} priority
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-slate-100">Diagnosis: </strong>
                        {sug.weaknessDescription}
                      </p>

                      <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 p-2.5 border border-amber-200/60 dark:border-amber-800/40 text-[11px] text-slate-600 dark:text-slate-400">
                        <strong className="text-indigo-600 dark:text-indigo-400">Socratic Rationale: </strong>
                        {sug.rationale}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onLaunchPractice?.(sug.conceptName, sug.suggestedMode === 'flashcards' ? 'flashcards' : 'quiz')}
                          className="flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Practice {sug.suggestedMode.toUpperCase()}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onLaunchGeminiLive?.(sug.conceptName)}
                          className="flex items-center gap-1 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        >
                          <Radio className="h-3.5 w-3.5 text-red-500" />
                          <span>Discuss in Gemini Live</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-6 text-center">
                  <Lightbulb className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    No critical knowledge gaps detected right now!
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 max-w-sm mx-auto mt-1">
                    Keep chatting or taking quizzes. The AI Proctor will automatically flag concepts whenever confusion or low retention arises.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ALL SAVED NOTES */}
          {activeTab === 'all_notes' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved notes, subjects, or concepts..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {filteredNotes.length > 0 ? (
                <div className="space-y-2">
                  {filteredNotes.map((note) => {
                    const isCurrent = activeNote?.id === note.id;
                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          setActiveNote(note);
                          setActiveTab('notes');
                        }}
                        className={`rounded-2xl border p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'border-indigo-400 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {note.title}
                            </h5>
                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                              {note.subject}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {note.summary || note.content.slice(0, 100)}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{note.flashcards?.length || 0} Flashcards</span>
                            <span>•</span>
                            <span>{note.keyConcepts?.length || 0} Concepts</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportScratchpadToDocx(note);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Export to Word (.docx)"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this scratchpad note?')) {
                                handleDeleteNote(note.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete note"
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
                  <p className="text-xs">No notes found matching your search</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
