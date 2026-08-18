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
  Sparkles,
  Clipboard,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import type { SavedStudyItem } from '@/types';
import {
  exportStudyItemToJSON,
  exportStudyVaultBundleToJSON,
  exportStudyItemToMarkdown,
  exportStudyVaultBundleToMarkdown,
  exportStudyItemToDocx,
  exportMultipleStudyItemsToDocx,
  parseImportStudyVaultFile,
  parseStudyVaultRawText,
} from '@/lib/studyVaultExportImport';

interface StudyVaultExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SavedStudyItem[];
  selectedItemIds?: string[];
  onImportItems: (items: SavedStudyItem[], replaceAll?: boolean) => void;
}

export function StudyVaultExportImportModal({
  isOpen,
  onClose,
  items,
  selectedItemIds = [],
  onImportItems,
}: StudyVaultExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [replaceAllOnImport, setReplaceAllOnImport] = useState(false);
  const [importMethod, setImportMethod] = useState<'file' | 'clipboard'>('file');
  const [clipboardText, setClipboardText] = useState('');
  
  // Selection for export
  const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(() => {
    if (selectedItemIds && selectedItemIds.length > 0) {
      return new Set(selectedItemIds);
    }
    return new Set(items.map((i) => i.id));
  });

  // Staged preview list for import
  const [stagedImportList, setStagedImportList] = useState<SavedStudyItem[] | null>(null);
  const [stagedSelection, setStagedSelection] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const triggerExportFeedback = (msg: string) => {
    setExportSuccess(msg);
    setTimeout(() => setExportSuccess(null), 3500);
  };

  // Target items for export
  const targetExportItems = items.filter((i) => selectedExportIds.has(i.id));

  // --- Single / Batch Export Handlers ---
  const handleExportJSON = () => {
    if (targetExportItems.length === 0) return;
    if (targetExportItems.length === 1) {
      exportStudyItemToJSON(targetExportItems[0]);
      triggerExportFeedback(`Exported "${targetExportItems[0].title}" as JSON`);
    } else {
      exportStudyVaultBundleToJSON(targetExportItems);
      triggerExportFeedback(`Exported ${targetExportItems.length} study module(s) as JSON bundle`);
    }
  };

  const handleExportMarkdown = () => {
    if (targetExportItems.length === 0) return;
    if (targetExportItems.length === 1) {
      exportStudyItemToMarkdown(targetExportItems[0]);
      triggerExportFeedback(`Exported "${targetExportItems[0].title}" as Markdown (.md)`);
    } else {
      exportStudyVaultBundleToMarkdown(targetExportItems);
      triggerExportFeedback(`Exported ${targetExportItems.length} study module(s) as Markdown packet`);
    }
  };

  const handleExportDocx = async () => {
    if (targetExportItems.length === 0) return;
    try {
      setIsExportingDocx(true);
      if (targetExportItems.length === 1) {
        await exportStudyItemToDocx(targetExportItems[0]);
        triggerExportFeedback(`Exported "${targetExportItems[0].title}" as formatted Word DOCX`);
      } else {
        await exportMultipleStudyItemsToDocx(targetExportItems, `Study_Vault_${targetExportItems.length}_Quizzes`);
        triggerExportFeedback(`Exported ${targetExportItems.length} study module(s) as formatted Word DOCX`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'DOCX export failed';
      setImportError(msg);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // --- Toggle Export Selection ---
  const toggleExportItem = (id: string) => {
    setSelectedExportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllExport = () => {
    if (selectedExportIds.size === items.length) {
      setSelectedExportIds(new Set());
    } else {
      setSelectedExportIds(new Set(items.map((i) => i.id)));
    }
  };

  // --- Import Handlers ---
  const processParsedStudyItems = (parsed: SavedStudyItem[]) => {
    if (parsed.length === 0) {
      setImportError('No valid study questions found in this file.');
      return;
    }
    setStagedImportList(parsed);
    setStagedSelection(new Set(parsed.map((item) => item.id)));
    setImportError(null);
  };

  const handleFileUpload = async (file: File) => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const parsed = await parseImportStudyVaultFile(file);
      processParsedStudyItems(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse study file';
      setImportError(msg);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteAnalyze = () => {
    if (!clipboardText.trim()) {
      setImportError('Please paste some text or JSON into the box first.');
      return;
    }
    try {
      const parsed = parseStudyVaultRawText(clipboardText);
      processParsedStudyItems(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not parse text format';
      setImportError(msg);
    }
  };

  const handleConfirmImport = () => {
    if (!stagedImportList || stagedImportList.length === 0) return;
    const finalItems = stagedImportList.filter((item) => stagedSelection.has(item.id));
    if (finalItems.length === 0) {
      setImportError('Please select at least one study module to import.');
      return;
    }

    onImportItems(finalItems, replaceAllOnImport);
    const count = finalItems.length;
    setImportSuccess(`Successfully imported ${count} study module(s) into your IndexedDB Study Vault!`);
    setStagedImportList(null);
    setClipboardText('');
    setTimeout(() => {
      setImportSuccess(null);
      onClose();
    }, 1500);
  };

  const toggleStagedSelection = (id: string) => {
    setStagedSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FolderDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Study Vault Import & Export
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Backup, restore, and transfer quizzes, flashcards, and study sets across devices
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

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Export Study Sets ({targetExportItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Import Study Sets</span>
          </button>
        </div>

        {/* Feedback Banners */}
        {exportSuccess && (
          <div className="bg-emerald-500 text-white px-6 py-2 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <Check className="h-4 w-4" />
            <span>{exportSuccess}</span>
          </div>
        )}
        {importSuccess && (
          <div className="bg-emerald-500 text-white px-6 py-2 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <Check className="h-4 w-4" />
            <span>{importSuccess}</span>
          </div>
        )}
        {importError && (
          <div className="bg-rose-500 text-white px-6 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{importError}</span>
            </div>
            <button
              type="button"
              onClick={() => setImportError(null)}
              className="text-white hover:underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              {/* Export Format Action Cards */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  1. Choose Export Format
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* JSON Backup */}
                  <div
                    onClick={handleExportJSON}
                    className="flex flex-col p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/60 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                        <FileCode className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        .JSON
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      JSON Study Vault
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-1">
                      Full study bank backup with questions, choices, hints, and scoring history for lossless restoration.
                    </p>
                    <div className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      <span>Download JSON</span>
                    </div>
                  </div>

                  {/* Word DOCX */}
                  <div
                    onClick={handleExportDocx}
                    className="flex flex-col p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/60 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        .DOCX
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Microsoft Word (.docx)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-1">
                      Formatted test papers with questions first and full answer keys on a separate answer sheet.
                    </p>
                    <div className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      {isExportingDocx ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          <span>Download DOCX</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Markdown */}
                  <div
                    onClick={handleExportMarkdown}
                    className="flex flex-col p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/60 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        .MD
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Markdown Notes (.md)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-1">
                      Clean markdown formatted text compatible with Obsidian, Notion, GitHub, and Bear notes.
                    </p>
                    <div className="mt-3 text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Markdown</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Selection Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Select Modules to Include ({targetExportItems.length} of {items.length})
                  </h3>
                  <button
                    type="button"
                    onClick={selectAllExport}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {selectedExportIds.size === items.length ? (
                      <>
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-3.5 w-3.5" />
                        <span>Select All ({items.length})</span>
                      </>
                    )}
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-500">Your study vault is currently empty.</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-2">
                    {items.map((item) => {
                      const isChecked = selectedExportIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleExportItem(item.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                              : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/30 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {item.mode}
                                </span>
                                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {item.title}
                                </h5>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                Topic: {item.topic} • {item.questions.length} questions
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                            {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* IMPORT TAB */
            <div className="space-y-6">
              {/* Import Method Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setImportMethod('file')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    importMethod === 'file'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5 inline mr-1.5" />
                  Upload File (.json, .md, .txt)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMethod('clipboard')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    importMethod === 'clipboard'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clipboard className="h-3.5 w-3.5 inline mr-1.5" />
                  Paste Raw Text / Transcript
                </button>
              </div>

              {/* Upload Dropzone */}
              {importMethod === 'file' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.md,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Click to browse or drag and drop study sets
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports aitutor Study Vault JSON, Quiz Markdown, and Plain text Q&As
                  </p>
                </div>
              ) : (
                /* Clipboard Text Area */
                <div className="space-y-3">
                  <textarea
                    value={clipboardText}
                    onChange={(e) => setClipboardText(e.target.value)}
                    placeholder="Paste quiz questions here...&#10;&#10;Example:&#10;1. What is Newton's Second Law?&#10;A) F = ma&#10;B) E = mc^2&#10;Answer: A) F = ma&#10;Hint: Force equals mass times acceleration."
                    rows={6}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-4 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handlePasteAnalyze}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Analyze & Preview Questions</span>
                  </button>
                </div>
              )}

              {/* Staged Items Preview */}
              {stagedImportList && stagedImportList.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Detected Study Modules ({stagedSelection.size} of {stagedImportList.length})
                    </h4>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Ready to import
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-2">
                    {stagedImportList.map((item) => {
                      const isSelected = stagedSelection.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleStagedSelection(item.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                              : 'border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-emerald-600 dark:text-emerald-400">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                                  {item.mode}
                                </span>
                                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {item.title}
                                </h5>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.questions.length} questions • Topic: {item.topic}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mode and Confirm */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={replaceAllOnImport}
                        onChange={(e) => setReplaceAllOnImport(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Replace entire vault (caution: clears existing items)</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold px-5 py-2.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
                    >
                      <Check className="h-4 w-4" />
                      <span>Confirm & Add to Vault ({stagedSelection.size})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <span>All imports and exports are processed securely on your client device.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-300 hover:underline font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
