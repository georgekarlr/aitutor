import { useState } from 'react';
import {
  Check,
  Copy,
  Pencil,
  Trash2,
  GraduationCap,
  ShieldCheck,
  LogOut,
  Radio,
  BookOpen,
  FolderDown,
  Sparkles,
  FileUp,
  Timer,
  Layers,
  Flame,
  ChevronDown,
  ChevronUp,
  Workflow,
  Home,
} from 'lucide-react';
import type { Conversation } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ChatExportMenu } from '@/components/ChatExportMenu';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onNew: () => void;
  onSelectHome?: () => void;
  onClose?: () => void;
  onOpenAuth?: () => void;
  onOpenSubscription?: () => void;
  onOpenGeminiLive?: () => void;
  onOpenStudyBank?: () => void;
  onOpenExportImport?: () => void;
  onOpenCurriculum?: () => void;
  onOpenScratchpad?: () => void;
  onOpenDocumentIngestion?: () => void;
  onOpenMockExam?: () => void;
  onOpenWhiteboard?: () => void;
  onOpenFocusHub?: () => void;
  onOpenPodcast?: () => void;
  onOpenArchitecture?: () => void;
  focusStreakCount?: number;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onRename,
  onNew,
  onSelectHome,
  onClose,
  onOpenAuth,
  onOpenSubscription,
  onOpenGeminiLive,
  onOpenStudyBank,
  onOpenExportImport,
  onOpenCurriculum,
  onOpenScratchpad,
  onOpenDocumentIngestion,
  onOpenMockExam,
  onOpenWhiteboard,
  onOpenFocusHub,
  onOpenPodcast,
  onOpenArchitecture,
  focusStreakCount = 0,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const { user, signOut, subscription, hasActiveSubscription } = useAuth();

  const startEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditValue(conv.title);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            aitutor
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Primary Actions: Home & New Chat */}
      <div className="px-3 pb-2 shrink-0 space-y-1.5">
        {onSelectHome && (
          <button
            onClick={() => {
              onSelectHome();
              if (onClose) onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-all cursor-pointer shadow-2xs"
          >
            <Home className="h-4 w-4 text-sky-500" />
            <span>Home Dashboard</span>
          </button>
        )}

        <button
          onClick={() => {
            onNew();
            if (onClose) onClose();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all cursor-pointer shadow-2xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New chat</span>
        </button>
      </div>

      {/* Unified Scrollable Container: Studio Tools + Chats */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 space-y-3">
        {/* Studio Tools Section */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Studio Tools
            </span>
            <button
              type="button"
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{toolsExpanded ? 'Collapse' : 'Expand'}</span>
              {toolsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {/* Gemini Live Mode (Always Featured) */}
          {onOpenGeminiLive && (
            <button
              type="button"
              onClick={() => {
                onOpenGeminiLive();
                if (onClose) onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Gemini 3.7 Live Real-Time</span>
            </button>
          )}

          {/* Expandable Tools List */}
          {toolsExpanded && (
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {onOpenFocusHub && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFocusHub();
                    if (onClose) onClose();
                  }}
                  className="flex items-center justify-between gap-1 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 p-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Focus Hub</span>
                  </div>
                  {focusStreakCount > 0 && (
                    <span className="rounded-full bg-amber-200 dark:bg-amber-900 px-1 py-0.2 text-[9px] font-bold text-amber-800 dark:text-amber-200 shrink-0">
                      {focusStreakCount}d
                    </span>
                  )}
                </button>
              )}

              {onOpenWhiteboard && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenWhiteboard();
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 p-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                >
                  <Layers className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">Whiteboard</span>
                </button>
              )}

              {onOpenPodcast && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPodcast();
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 p-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                >
                  <Radio className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">Podcast</span>
                </button>
              )}

              {onOpenDocumentIngestion && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDocumentIngestion();
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 p-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                >
                  <FileUp className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">Ingest PDF</span>
                </button>
              )}

              {onOpenMockExam && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMockExam();
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 p-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                >
                  <Timer className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Mock Exam</span>
                </button>
              )}

              {onOpenCurriculum && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCurriculum();
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 p-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Curriculum</span>
                </button>
              )}

              {onOpenScratchpad && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenScratchpad();
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 p-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Scratchpad</span>
                </button>
              )}

              {onOpenStudyBank && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenStudyBank();
                    if (onClose) onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 p-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                >
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">Study Vault</span>
                </button>
              )}

              {onOpenArchitecture && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenArchitecture();
                    if (onClose) onClose();
                  }}
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/80 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 py-1.5 px-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <Workflow className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Architecture & PDF</span>
                </button>
              )}

              {onOpenExportImport && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenExportImport();
                    if (onClose) onClose();
                  }}
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-900/80 bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 py-1.5 px-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <FolderDown className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span>Import & Export Chats</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Conversations Section */}
        <div className="space-y-1 pt-2">
          <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Chats
          </div>

          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-600">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    activeId === conv.id
                      ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                  onClick={() => {
                    onSelect(conv.id);
                    if (onClose) onClose();
                  }}
                >
                  {editingId === conv.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 rounded-md border border-sky-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
                    />
                  ) : (
                    <>
                      <span className="flex-1 truncate">{conv.title}</span>
                      {conv.tutorSession && (
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 rounded-full shrink-0">
                          <GraduationCap className="h-2.5 w-2.5" />
                          {conv.tutorSession.isFinished
                            ? 'Done'
                            : `${conv.tutorSession.currentStep}/${conv.tutorSession.totalSteps}`}
                        </span>
                      )}
                      <ChatExportMenu
                        conversation={conv}
                        variant="icon"
                        onOpenFullModal={onOpenExportImport}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(conv);
                        }}
                        className="rounded p-1 text-slate-400 opacity-0 hover:bg-slate-300/50 dark:hover:bg-slate-700 group-hover:opacity-100 transition-all cursor-pointer"
                        aria-label="Rename conversation"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        className="rounded p-1 text-slate-400 hover:text-red-500 opacity-0 hover:bg-red-50 dark:hover:bg-red-950/30 group-hover:opacity-100 transition-all cursor-pointer"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Account & Plan */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2 shrink-0 bg-slate-50 dark:bg-slate-900 mt-auto">
        {/* Subscription Status Card */}
        {user && (
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              if (onOpenSubscription) onOpenSubscription();
            }}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 transition-all text-left group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`flex h-2 w-2 rounded-full ${hasActiveSubscription ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  {subscription?.product_name || 'Active Plan'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {hasActiveSubscription ? `${subscription?.days_remaining ?? 0} days remaining` : 'Subscription Expired'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Details
            </span>
          </button>
        )}

        <div className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 p-2.5 transition-all text-left group">
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              if (onOpenAuth) onOpenAuth();
            }}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
              user
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {user ? (user.email ? user.email.charAt(0).toUpperCase() : 'U') : <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user ? user.email : 'Student Account'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {user ? 'Authenticated' : 'Sign in to access'}
              </p>
            </div>
          </button>

          {user && (
            <button
              type="button"
              onClick={signOut}
              className="rounded-md p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="px-1 text-[11px] text-slate-400 dark:text-slate-600 flex items-center justify-between">
          <span>BYOK &middot; Secure Local Key</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
        </div>
      </div>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={copy}
      className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
      aria-label="Copy message"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
