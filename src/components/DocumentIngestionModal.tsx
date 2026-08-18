import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileUp,
  FileText,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Brain,
  GraduationCap,
  Layers,
  HelpCircle,
  ArrowRight,
  Download,
  BookOpen,
  Timer,
  Radio,
} from 'lucide-react';
import type {
  GeminiSettings,
  DocumentIngestionFile,
  DocumentIngestionResult,
  Conversation,
} from '@/types';
import { ingestDocumentAndSynthesize, IngestionProgressCallback } from '@/lib/documentIngestion';
import { ConversationSourceSelector } from '@/components/ConversationSourceSelector';
import { extractConversationStudyContext } from '@/lib/conversationContext';

interface DocumentIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeminiSettings;
  conversations?: Conversation[];
  activeConversation?: Conversation | null;
  onOpenCurriculum?: () => void;
  onOpenKnowledgeGraph?: () => void;
  onLaunchPractice?: (topic: string, mode: 'quiz' | 'flashcard') => void;
  onLaunchMockExam?: (subject: string) => void;
  onLaunchGeminiLive?: (topic: string) => void;
  onRequireApiKey?: () => void;
}

export function DocumentIngestionModal({
  isOpen,
  onClose,
  settings,
  conversations = [],
  activeConversation,
  onOpenCurriculum,
  onOpenKnowledgeGraph,
  onLaunchPractice,
  onLaunchMockExam,
  onLaunchGeminiLive,
  onRequireApiKey,
}: DocumentIngestionModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'conversation'>('upload');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConversation?.id || null);
  const [absorbContext, setAbsorbContext] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<DocumentIngestionFile | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentIngestionResult | null>(null);
  const [resultTab, setResultTab] = useState<'summary' | 'concepts' | 'curriculum' | 'flashcards' | 'quiz'>('summary');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected conversation if activeConversation changes and none selected yet
  useEffect(() => {
    if (activeConversation?.id && !selectedConvId) {
      setSelectedConvId(activeConversation.id);
    }
  }, [activeConversation, selectedConvId]);

  const resetState = () => {
    setSelectedFile(null);
    setPastedText('');
    setIsProcessing(false);
    setProgressStage('');
    setProgressPercent(0);
    setProgressMessage('');
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  const handleFileChange = async (file: File) => {
    setError(null);
    const validMimes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!validMimes.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setError('Please select a valid PDF, image (PNG/JPEG), or text/markdown document.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = reader.result as string;
        const base64Data = raw.split(',')[1] || raw;
        setSelectedFile({
          name: file.name,
          mimeType: file.type || 'application/pdf',
          size: file.size,
          data: base64Data,
        });
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Failed to read file. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleStartIngestion = async () => {
    if (!settings.apiKey?.trim()) {
      onRequireApiKey?.();
      return;
    }

    const selectedConv = conversations.find((c) => c.id === selectedConvId) || (activeConversation?.id === selectedConvId ? activeConversation : null);

    if (activeTab === 'upload' && !selectedFile) {
      setError('Please select or drop a document to ingest.');
      return;
    }

    if (activeTab === 'paste' && !pastedText.trim()) {
      setError('Please paste textbook excerpt, lecture notes, or syllabus content.');
      return;
    }

    if (activeTab === 'conversation' && (!selectedConv || !selectedConv.messages || selectedConv.messages.length === 0)) {
      setError('Please select a conversation with messages or attached study materials to ingest.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const onProgress: IngestionProgressCallback = (stage, percent, message) => {
      setProgressStage(stage);
      setProgressPercent(percent);
      setProgressMessage(message);
    };

    try {
      let payload: DocumentIngestionFile | string;
      if (activeTab === 'upload') {
        payload = selectedFile!;
      } else if (activeTab === 'paste') {
        payload = pastedText;
      } else {
        const extracted = extractConversationStudyContext(selectedConv);
        payload = `ACADEMIC CONVERSATION INGESTION: "${selectedConv?.title}"\n\n${extracted.contextText}`;
      }
      const res = await ingestDocumentAndSynthesize(settings, payload, onProgress);
      setResult(res);
      setResultTab('summary');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to ingest document';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportMarkdown = useCallback(() => {
    if (!result) return;
    let md = `# ${result.subject} — Academic Ingestion Summary\n\n`;
    md += `**Source Document**: ${result.fileName}\n`;
    md += `**Date**: ${new Date(result.createdAt).toLocaleString()}\n\n`;
    md += `## Executive Summary\n${result.documentSummary}\n\n`;

    md += `## Extracted Knowledge Concepts (${result.concepts.length})\n`;
    result.concepts.forEach((c, idx) => {
      md += `### ${idx + 1}. ${c.name}\n`;
      md += `- **Subject**: ${c.subject}\n`;
      md += `- **Summary**: ${c.summary}\n`;
      if (c.prerequisites && c.prerequisites.length > 0) {
        md += `- **Prerequisites**: ${c.prerequisites.join(', ')}\n`;
      }
      if (c.keyFormulasOrTerms && c.keyFormulasOrTerms.length > 0) {
        md += `- **Key Formulas / Terms**: ${c.keyFormulasOrTerms.join(', ')}\n`;
      }
      md += `\n`;
    });

    md += `## Course Modules (${result.curriculumModules.length})\n`;
    result.curriculumModules.forEach((m, idx) => {
      md += `### Module ${idx + 1}: ${m.title} (~${m.estimatedMinutes} mins)\n`;
      md += `${m.description}\n`;
      if (m.keyTakeaways && m.keyTakeaways.length > 0) {
        md += `**Key Takeaways**:\n`;
        m.keyTakeaways.forEach((k) => (md += `- ${k}\n`));
      }
      md += `\n`;
    });

    md += `## Active Recall Flashcards (${result.flashcards.length})\n`;
    result.flashcards.forEach((f, idx) => {
      md += `**Q${idx + 1}**: ${f.question}\n`;
      md += `**A**: ${f.answer}\n`;
      if (f.hint) md += `*Hint: ${f.hint}*\n`;
      md += `\n`;
    });

    md += `## Diagnostic Practice Questions (${result.quizQuestions.length})\n`;
    result.quizQuestions.forEach((q, idx) => {
      md += `**Question ${idx + 1}**: ${q.question}\n`;
      q.options.forEach((opt) => (md += `- ${opt}\n`));
      md += `**Correct Answer**: ${q.correctAnswer}\n`;
      md += `**Explanation**: ${q.explanation}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.subject.replace(/[^a-z0-9]+/gi, '_')}_Ingestion_Study_Guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-xs shrink-0">
              <FileUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                <span>Document & Textbook Ingestion Engine</span>
                <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                  Gemini 3.7 1M Token Context
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Deep cognitive parsing of PDFs, textbook chapters, lecture notes & syllabi
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close document ingestion modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/80 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            /* Upload / Input Mode */
            <div className="space-y-5">
              {/* Input Mode Selector */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/70 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <FileUp className="h-4 w-4" />
                  <span>Upload Document</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'paste'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Paste Text</span>
                </button>

                {conversations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('conversation')}
                    disabled={isProcessing}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'conversation'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <span>Absorb Conversation</span>
                  </button>
                )}
              </div>

              {activeTab === 'conversation' ? (
                /* Conversation Ingestion Mode */
                <div className="space-y-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 p-4">
                  <ConversationSourceSelector
                    conversations={conversations}
                    selectedConversationId={selectedConvId}
                    onSelectConversation={(conv) => setSelectedConvId(conv?.id || null)}
                    absorbContext={absorbContext}
                    onToggleAbsorbContext={setAbsorbContext}
                    label="Absorb Conversation Context"
                    helperText="Select a specific conversation to ingest all its chat messages and uploaded files directly into the Knowledge Graph, Flashcards, and Course Modules."
                  />
                </div>
              ) : activeTab === 'upload' ? (
                /* Drag & Drop Zone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : selectedFile
                      ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for multimodal analysis
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-xs text-red-500 hover:underline font-semibold mt-1"
                      >
                        Change document
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <FileUp className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Drag & drop your study PDF, textbook excerpt, or notes here
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Supports multi-page PDFs, scans, PNG/JPEG, and Markdown documents up to 20MB
                        </p>
                      </div>
                      <span className="rounded-lg bg-indigo-100 dark:bg-indigo-900/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        Browse Files
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Text / Syllabus Paste */
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Paste Lecture Text, Chapter Excerpt, or Course Syllabus:
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Paste textbook notes, syllabus schedule, lecture transcript, or study outline here..."
                    className="w-full h-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 resize-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    {pastedText.length} characters • Gemini 3.7 Flash handles large documents with 1M tokens
                  </p>
                </div>
              )}

              {/* Ingestion Value Proposition Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Brain className="h-3.5 w-3.5 text-purple-500" />
                    <span>Knowledge Graph</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Auto-maps prerequisites & concept nodes
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Course Modules</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Generates Taskmaster curriculum pathways
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Flashcard Deck</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    High-yield active recall flashcard sets
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <HelpCircle className="h-3.5 w-3.5 text-sky-500" />
                    <span>Practice Quizzes</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Calibrated diagnostic drill questions
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/60 dark:bg-indigo-950/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                      {progressMessage || 'Processing document with Gemini 3.7 Flash...'}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-indigo-100 dark:bg-indigo-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-indigo-700/80 dark:text-indigo-300/80 uppercase font-bold tracking-wider">
                    <span className={progressStage === 'reading' || progressPercent >= 15 ? 'text-indigo-600 dark:text-indigo-300 font-extrabold' : 'opacity-40'}>
                      1. Read
                    </span>
                    <span className={progressStage === 'analyzing' || progressPercent >= 40 ? 'text-indigo-600 dark:text-indigo-300 font-extrabold' : 'opacity-40'}>
                      2. Analyze
                    </span>
                    <span className={progressStage === 'synthesizing' || progressPercent >= 70 ? 'text-indigo-600 dark:text-indigo-300 font-extrabold' : 'opacity-40'}>
                      3. Extract
                    </span>
                    <span className={progressStage === 'storing' || progressPercent >= 85 ? 'text-indigo-600 dark:text-indigo-300 font-extrabold' : 'opacity-40'}>
                      4. Store
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results View */
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 border border-emerald-200 dark:border-emerald-800/80 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-2xs shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Ingestion Complete: {result.subject}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Added {result.insertedGraphNodeCount} concepts to Knowledge Graph, generated{' '}
                      {result.curriculumModules.length} curriculum modules, and stored{' '}
                      {result.flashcards.length + result.quizQuestions.length} study items.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export Study Guide</span>
                </button>
              </div>

              {/* Result Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'summary', label: 'Executive Summary', icon: BookOpen },
                  { id: 'concepts', label: `Concepts (${result.concepts.length})`, icon: Brain },
                  { id: 'curriculum', label: `Curriculum (${result.curriculumModules.length})`, icon: GraduationCap },
                  { id: 'flashcards', label: `Flashcards (${result.flashcards.length})`, icon: Layers },
                  { id: 'quiz', label: `Quiz (${result.quizQuestions.length})`, icon: HelpCircle },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setResultTab(tab.id as typeof resultTab)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        resultTab === tab.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80 min-h-[220px]">
                {resultTab === 'summary' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Academic Overview
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {result.documentSummary}
                    </p>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-500">Subject</span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{result.subject}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Document Name</span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{result.fileName}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Knowledge Nodes</span>
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400">+{result.concepts.length} Concept Nodes</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Curriculum Plan</span>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{result.curriculumModules.length} Modules</p>
                      </div>
                    </div>
                  </div>
                )}

                {resultTab === 'concepts' && (
                  <div className="space-y-2.5">
                    {result.concepts.map((c, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-purple-500" />
                            <span>{c.name}</span>
                          </h5>
                          <span className="rounded-full bg-purple-50 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                            {c.subject}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{c.summary}</p>
                        {c.prerequisites && c.prerequisites.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span className="font-semibold">Prerequisites:</span>
                            <span>{c.prerequisites.join(', ')}</span>
                          </div>
                        )}
                        {c.keyFormulasOrTerms && c.keyFormulasOrTerms.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {c.keyFormulasOrTerms.map((f, fIdx) => (
                              <span
                                key={fIdx}
                                className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:text-slate-300"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {resultTab === 'curriculum' && (
                  <div className="space-y-2.5">
                    {result.curriculumModules.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{m.title}</span>
                          </h5>
                          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                            ~{m.estimatedMinutes} mins
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{m.description}</p>
                        {m.keyTakeaways && m.keyTakeaways.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-slate-500">Key Outcomes:</span>
                            <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-0.5 space-y-0.5">
                              {m.keyTakeaways.map((t, tIdx) => (
                                <li key={tIdx}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {resultTab === 'flashcards' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.flashcards.map((f, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            Card #{idx + 1} • {f.conceptTag}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                            {f.question}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                            {f.answer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {resultTab === 'quiz' && (
                  <div className="space-y-3">
                    {result.quizQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                            Question #{idx + 1} • {q.conceptTag}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`rounded-md px-2.5 py-1 text-xs border ${
                                opt === q.correctAnswer
                                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-500 italic mt-1">
                          Rationale: {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons to Jump Into Systems */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetState}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Ingest Another Document
                </button>

                {onOpenKnowledgeGraph && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenKnowledgeGraph();
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-3.5 py-2 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span>View in Knowledge Graph</span>
                  </button>
                )}

                {onOpenCurriculum && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCurriculum();
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3.5 py-2 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Open in Curriculum Studio</span>
                  </button>
                )}

                {onLaunchMockExam && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchMockExam(result.subject);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3.5 py-2 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                  >
                    <Timer className="h-3.5 w-3.5 text-amber-600" />
                    <span>Launch Mock Exam</span>
                  </button>
                )}

                {onLaunchGeminiLive && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchGeminiLive(result.subject);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-3.5 py-2 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                  >
                    <Radio className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                    <span>Live Oral Discussion</span>
                  </button>
                )}

                {onLaunchPractice && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchPractice(result.subject, 'quiz');
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Practice Subject Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Autonomous cognitive extraction via Gemini 3.7 Flash
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartIngestion}
                disabled={
                  isProcessing ||
                  (activeTab === 'upload' && !selectedFile) ||
                  (activeTab === 'paste' && !pastedText.trim()) ||
                  (activeTab === 'conversation' && !selectedConvId)
                }
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{activeTab === 'conversation' ? 'Ingesting Conversation...' : 'Ingesting Document...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{activeTab === 'conversation' ? 'Ingest Conversation Context' : 'Run Deep Ingestion'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
