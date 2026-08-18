import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  Check,
  AlertCircle,
  FolderDown,
  Layers,
  Sparkles,
  Clipboard,
  CheckSquare,
  Square,
  Loader2,
  Workflow,
} from 'lucide-react';
import type { Conversation } from '@/types';
import {
  exportConversationToJSON,
  exportConversationToMarkdown,
  exportConversationToDocx,
  exportConversationToPlainText,
  exportAllConversationsToJSON,
  exportSelectedConversationsToJSON,
  parseImportChatFile,
  parseRawTextToConversations,
} from '@/lib/chatExportImport';

interface ChatExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversation: Conversation | null;
  allConversations: Conversation[];
  onImportConversations: (conversations: Conversation[], replaceAll?: boolean) => void;
  onOpenArchitecture?: () => void;
}

export function ChatExportImportModal({
  isOpen,
  onClose,
  activeConversation,
  allConversations,
  onImportConversations,
  onOpenArchitecture,
}: ChatExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [replaceAllOnImport, setReplaceAllOnImport] = useState(false);
  const [importMethod, setImportMethod] = useState<'file' | 'clipboard'>('file');
  const [clipboardText, setClipboardText] = useState('');
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(
    () => new Set(allConversations.map((c) => c.id))
  );

  // Staged import items for preview before applying
  const [stagedImportList, setStagedImportList] = useState<Conversation[] | null>(null);
  const [stagedSelection, setStagedSelection] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const triggerExportFeedback = (msg: string) => {
    setExportSuccess(msg);
    setTimeout(() => setExportSuccess(null), 3500);
  };

  const handleExportSingleJSON = () => {
    if (!activeConversation) return;
    exportConversationToJSON(activeConversation);
    triggerExportFeedback(`Exported "${activeConversation.title}" as JSON`);
  };

  const handleExportSingleMarkdown = () => {
    if (!activeConversation) return;
    exportConversationToMarkdown(activeConversation);
    triggerExportFeedback(`Exported "${activeConversation.title}" as Markdown (.md)`);
  };

  const handleExportSinglePlainText = () => {
    if (!activeConversation) return;
    exportConversationToPlainText(activeConversation);
    triggerExportFeedback(`Exported "${activeConversation.title}" as Plain Text (.txt)`);
  };

  const handleExportSingleDocx = async () => {
    if (!activeConversation) return;
    try {
      setIsExportingDocx(true);
      await exportConversationToDocx(activeConversation);
      triggerExportFeedback(`Exported "${activeConversation.title}" as formatted Word DOCX`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'DOCX export failed';
      setImportError(msg);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportSelectedJSON = () => {
    const selected = allConversations.filter((c) => selectedChatIds.has(c.id));
    if (selected.length === 0) return;
    if (selected.length === allConversations.length) {
      exportAllConversationsToJSON(allConversations);
      triggerExportFeedback(`Exported all ${allConversations.length} chats as JSON archive`);
    } else {
      exportSelectedConversationsToJSON(selected, `selected_${selected.length}_chats_export`);
      triggerExportFeedback(`Exported ${selected.length} selected chats as JSON`);
    }
  };

  const toggleSelectChat = (id: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedChatIds.size === allConversations.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(allConversations.map((c) => c.id)));
    }
  };

  const processFileForStaging = async (file: File) => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const parsed = await parseImportChatFile(file);
      setStagedImportList(parsed);
      setStagedSelection(new Set(parsed.map((c) => c.id)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse chat file.';
      setImportError(msg);
      setStagedImportList(null);
    }
  };

  const processClipboardForStaging = () => {
    setImportError(null);
    setImportSuccess(null);
    if (!clipboardText.trim()) {
      setImportError('Please paste your chat JSON, Markdown, or text into the input field.');
      return;
    }
    try {
      const parsed = parseRawTextToConversations(clipboardText, 'Pasted Chat');
      setStagedImportList(parsed);
      setStagedSelection(new Set(parsed.map((c) => c.id)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse pasted text.';
      setImportError(msg);
      setStagedImportList(null);
    }
  };

  const handleCommitImport = () => {
    if (!stagedImportList || stagedImportList.length === 0) return;
    const finalToImport = stagedImportList.filter((c) => stagedSelection.has(c.id));
    if (finalToImport.length === 0) {
      setImportError('Please select at least one chat to import.');
      return;
    }

    onImportConversations(finalToImport, replaceAllOnImport);
    setImportSuccess(
      `Successfully imported ${finalToImport.length} conversation${finalToImport.length > 1 ? 's' : ''}!`
    );
    setStagedImportList(null);
    setClipboardText('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileForStaging(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFileForStaging(file);
    }
  };

  return (
    <div
      id="chat-export-import-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="chat-export-import-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5 py-4 bg-slate-50/70 dark:bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
              <FolderDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Chat Import & Export Center
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Backup, restore, transfer, or download formatted transcripts
              </p>
            </div>
          </div>
          <button
            id="close-chat-export-modal-btn"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
            <button
              id="tab-export-chats"
              onClick={() => {
                setActiveTab('export');
                setImportError(null);
                setStagedImportList(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Export Chats</span>
            </button>
            <button
              id="tab-import-chats"
              onClick={() => {
                setActiveTab('import');
                setExportSuccess(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'import'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Import Chats</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Notifications */}
          {exportSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{exportSuccess}</span>
            </div>
          )}

          {importSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{importSuccess}</span>
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span className="font-medium">{importError}</span>
            </div>
          )}

          {/* ================= EXPORT TAB ================= */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Active Conversation Quick Export */}
              {activeConversation ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        Active Chat Export
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[320px] sm:max-w-[420px]">
                        {activeConversation.title}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {activeConversation.messages.length} messages &middot; Updated{' '}
                        {new Date(activeConversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* JSON */}
                    <button
                      id="export-single-json-btn"
                      onClick={handleExportSingleJSON}
                      className="flex flex-col items-start p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-all text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold text-xs mb-1">
                        <FileCode className="h-4 w-4" />
                        <span>JSON</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Full data backup
                      </span>
                    </button>

                    {/* Markdown */}
                    <button
                      id="export-single-markdown-btn"
                      onClick={handleExportSingleMarkdown}
                      className="flex flex-col items-start p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-1">
                        <FileText className="h-4 w-4" />
                        <span>Markdown</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Clean .md notes
                      </span>
                    </button>

                    {/* Word DOCX */}
                    <button
                      id="export-single-docx-btn"
                      onClick={handleExportSingleDocx}
                      disabled={isExportingDocx}
                      className="flex flex-col items-start p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs mb-1">
                        {isExportingDocx ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4" />
                        )}
                        <span>Word DOCX</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {isExportingDocx ? 'Exporting...' : 'Styled document'}
                      </span>
                    </button>

                    {/* Plain Text */}
                    <button
                      id="export-single-txt-btn"
                      onClick={handleExportSinglePlainText}
                      className="flex flex-col items-start p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                        <FileText className="h-4 w-4" />
                        <span>Plain Text</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Raw transcript
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-400">
                  No active conversation currently open. Select a conversation from the list below.
                </div>
              )}

              {/* System Architecture Specification PDF Card */}
              {onOpenArchitecture && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 p-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-xs shrink-0">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        System Architecture & Topology Specification (PDF)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Download comprehensive 4-page system architecture PDF report with visual diagrams & data flow
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenArchitecture();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>View & Download PDF</span>
                  </button>
                </div>
              )}

              {/* Batch / Multi-Conversation Export Section */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Batch Export Conversations ({selectedChatIds.size}/{allConversations.length} Selected)
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {selectedChatIds.size === allConversations.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      id="export-selected-json-btn"
                      onClick={handleExportSelectedJSON}
                      disabled={selectedChatIds.size === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Selected ({selectedChatIds.size})</span>
                    </button>
                  </div>
                </div>

                {/* Conversation selection list */}
                {allConversations.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">No chats available to export.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/60 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {allConversations.map((c) => {
                      const isSelected = selectedChatIds.has(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleSelectChat(c.id)}
                          className={`flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-xs ${
                            isSelected ? 'bg-sky-50/30 dark:bg-sky-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px] sm:max-w-[380px]">
                                {c.title}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {c.messages.length} messages &middot; {new Date(c.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {c.tutorSession && (
                              <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 rounded-full">
                                Tutor
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= IMPORT TAB ================= */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Import source method toggle */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setImportMethod('file');
                    setStagedImportList(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    importMethod === 'file'
                      ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload File (.json, .md, .txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportMethod('clipboard');
                    setStagedImportList(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    importMethod === 'clipboard'
                      ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  <span>Paste Text / Raw Transcript</span>
                </button>
              </div>

              {/* Staged Items Preview before import */}
              {stagedImportList && stagedImportList.length > 0 ? (
                <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/40 dark:bg-sky-950/20 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Preview Detected Chats ({stagedImportList.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Review the conversations found in your file before importing
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStagedImportList(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                    >
                      Choose different file
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {stagedImportList.map((item) => {
                      const isSelected = stagedSelection.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setStagedSelection((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            });
                          }}
                          className="flex items-start gap-2.5 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-xs"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {item.title}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.messages.length} msgs
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                              {item.messages[0]?.content || 'Empty conversation'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Import Mode Options */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Import Destination Mode
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {replaceAllOnImport
                          ? 'Replace existing chat history with imported conversations'
                          : 'Merge and append imported chats safely alongside existing ones'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={replaceAllOnImport}
                        onChange={(e) => setReplaceAllOnImport(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStagedImportList(null)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitImport}
                      disabled={stagedSelection.size === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Check className="h-4 w-4" />
                      <span>Confirm & Import ({stagedSelection.size})</span>
                    </button>
                  </div>
                </div>
              ) : importMethod === 'file' ? (
                /* File Dropzone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    isDragging
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40'
                      : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 bg-slate-50/40 dark:bg-slate-900/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.md,.txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center mb-1">
                    Click to browse or drag &amp; drop chat file here
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                    Supports <strong className="font-semibold text-slate-600 dark:text-slate-300">.json</strong> (aitutor or ChatGPT),{' '}
                    <strong className="font-semibold text-slate-600 dark:text-slate-300">.md</strong>, or{' '}
                    <strong className="font-semibold text-slate-600 dark:text-slate-300">.txt</strong> transcripts
                  </p>
                </div>
              ) : (
                /* Paste from Clipboard Textarea */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Paste JSON, Markdown, or Conversation Text:
                    </label>
                    <textarea
                      value={clipboardText}
                      onChange={(e) => setClipboardText(e.target.value)}
                      placeholder="Paste your chat export JSON or markdown transcripts (e.g. 'User: How does photosynthesis work? \n\nGemini: Photosynthesis is...')"
                      rows={7}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={processClipboardForStaging}
                    disabled={!clipboardText.trim()}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze & Preview Pasted Text</span>
                  </button>
                </div>
              )}

              {/* Compatibility notes */}
              <div className="rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/60 p-3.5 text-xs text-sky-800 dark:text-sky-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  <span>Universal AI Chat Compatibility</span>
                </div>
                <p className="text-[11px] text-sky-700 dark:text-sky-300/90 leading-relaxed">
                  Imports are intelligently mapped from aitutor JSON archives, OpenAI/ChatGPT JSON files, or human-readable Markdown/Text notes. All questions, responses, attachments, and tutor states are reconstructed into interactive chat threads.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-5 py-3 bg-slate-50/70 dark:bg-slate-900/60 flex-shrink-0">
          <span className="text-[11px] text-slate-400">
            {allConversations.length} total conversation{allConversations.length === 1 ? '' : 's'} stored locally
          </span>
          <button
            id="close-modal-bottom-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
