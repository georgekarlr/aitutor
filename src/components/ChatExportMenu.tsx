import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileCode,
  FileText,
  FileSpreadsheet,
  Check,
  ChevronDown,
  FolderDown,
  Loader2,
} from 'lucide-react';
import type { Conversation } from '@/types';
import {
  exportConversationToJSON,
  exportConversationToMarkdown,
  exportConversationToDocx,
  exportConversationToPlainText,
} from '@/lib/chatExportImport';

interface ChatExportMenuProps {
  conversation: Conversation | null;
  onOpenFullModal?: () => void;
  variant?: 'button' | 'icon' | 'compact';
  className?: string;
}

export function ChatExportMenu({
  conversation,
  onOpenFullModal,
  variant = 'button',
  className = '',
}: ChatExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const showNotification = (msg: string) => {
    setCopiedSuccess(msg);
    setTimeout(() => {
      setCopiedSuccess(null);
      setIsOpen(false);
    }, 1500);
  };

  const handleExportJSON = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!conversation) return;
    exportConversationToJSON(conversation);
    showNotification('Exported JSON');
  };

  const handleExportMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!conversation) return;
    exportConversationToMarkdown(conversation);
    showNotification('Exported Markdown');
  };

  const handleExportPlainText = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!conversation) return;
    exportConversationToPlainText(conversation);
    showNotification('Exported Text');
  };

  const handleExportDocx = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!conversation) return;
    try {
      setIsExportingDocx(true);
      await exportConversationToDocx(conversation);
      showNotification('Exported DOCX');
    } catch {
      // ignore
    } finally {
      setIsExportingDocx(false);
    }
  };

  if (!conversation) return null;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="rounded p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
          title="Export this conversation"
          aria-label="Export chat options"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          title="Export conversation"
        >
          <Download className="h-3 w-3 text-sky-500" />
          <span className="text-[11px]">Export</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs cursor-pointer"
          title="Export or backup active conversation"
        >
          <FolderDown className="h-3.5 w-3.5 text-sky-500" />
          <span className="hidden sm:inline">Export Chat</span>
          <span className="sm:hidden">Export</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-900 p-1.5 shadow-xl ring-1 ring-black/5 dark:ring-white/10 border border-slate-200 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-100">
          {copiedSuccess ? (
            <div className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              <span>{copiedSuccess}</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Export &ldquo;{conversation.title.slice(0, 20)}...&rdquo;
              </div>

              {/* JSON */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-left cursor-pointer"
              >
                <FileCode className="h-4 w-4 text-sky-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">JSON Backup (.json)</p>
                  <p className="text-[10px] text-slate-400 truncate">Includes complete chat structure</p>
                </div>
              </button>

              {/* Markdown */}
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
              >
                <FileText className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Markdown Notes (.md)</p>
                  <p className="text-[10px] text-slate-400 truncate">Formatted for Obsidian, Notion</p>
                </div>
              </button>

              {/* Word DOCX */}
              <button
                type="button"
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer disabled:opacity-50"
              >
                {isExportingDocx ? (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Word Document (.docx)</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isExportingDocx ? 'Generating DOCX...' : 'Styled Microsoft Word doc'}
                  </p>
                </div>
              </button>

              {/* Plain text */}
              <button
                type="button"
                onClick={handleExportPlainText}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Plain Text (.txt)</p>
                  <p className="text-[10px] text-slate-400 truncate">Clean raw transcript</p>
                </div>
              </button>

              {onOpenFullModal && (
                <>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onOpenFullModal();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors text-left cursor-pointer"
                  >
                    <FolderDown className="h-3.5 w-3.5" />
                    <span>Import & Export Center...</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
