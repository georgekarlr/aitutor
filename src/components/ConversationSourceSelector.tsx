import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Sparkles,
  ChevronDown,
  FileText,
  Search,
  Check,
  Globe,
  Sliders,
} from 'lucide-react';
import type { Conversation } from '@/types';
import { extractConversationStudyContext } from '@/lib/conversationContext';

interface ConversationSourceSelectorProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conv: Conversation | null) => void;
  absorbContext: boolean;
  onToggleAbsorbContext: (enabled: boolean) => void;
  onApplyTopicSuggestion?: (suggestedTopic: string) => void;
  label?: string;
  helperText?: string;
  className?: string;
  compact?: boolean;
}

export function ConversationSourceSelector({
  conversations,
  selectedConversationId,
  onSelectConversation,
  absorbContext,
  onToggleAbsorbContext,
  onApplyTopicSuggestion,
  label = 'Absorb Conversation Context',
  helperText = 'Select a specific conversation to use existing chat messages & uploaded files to tailor your needs.',
  className = '',
  compact = false,
}: ConversationSourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedConv = useMemo(() => {
    if (!selectedConversationId) return null;
    return conversations.find((c) => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const extractedContext = useMemo(() => {
    return extractConversationStudyContext(selectedConv);
  }, [selectedConv]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  return (
    <div className={`${compact ? 'space-y-1.5' : 'space-y-2.5'} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className={`block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {label}
          </label>
          {helperText && !compact && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              {helperText}
            </p>
          )}
        </div>
      </div>

      {/* Main Selector Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2.5 rounded-2xl border text-left text-xs font-medium transition-all cursor-pointer shadow-xs ${
            compact ? 'px-3 py-1.5' : 'px-3.5 py-2.5'
          } ${
            selectedConv
              ? 'border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 hover:border-indigo-400'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedConv ? (
              <div className={`flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs ${compact ? 'h-6 w-6' : 'h-7 w-7'}`}>
                <MessageSquare className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              </div>
            ) : (
              <div className={`flex shrink-0 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ${compact ? 'h-6 w-6' : 'h-7 w-7'}`}>
                <Globe className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              </div>
            )}
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold truncate">
                  {selectedConv ? selectedConv.title : 'General Topic (No conversation selected)'}
                </span>
                {selectedConv && (
                  <span className="rounded-md bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                    {extractedContext.messageCount} msgs
                  </span>
                )}
              </div>
              {!compact && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {selectedConv
                    ? extractedContext.previewSummary
                    : 'Click to select from your saved conversations'}
                </p>
              )}
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-40 mt-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Search Bar */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations by title or topic..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                {/* General / None option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectConversation(null);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    !selectedConversationId
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>General Topic (No specific conversation)</span>
                  </div>
                  {!selectedConversationId && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                </button>

                {filteredConversations.map((conv) => {
                  const isCurrent = conv.id === selectedConversationId;
                  const msgCount = conv.messages.filter((m) => m.content.trim().length > 0).length;
                  const docCount = conv.messages.flatMap((m) => m.attachments || []).length;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        onSelectConversation(conv);
                        if (onApplyTopicSuggestion && conv.title && conv.title !== 'New chat') {
                          onApplyTopicSuggestion(conv.title);
                        }
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <div className="truncate">
                          <span className="truncate block font-medium">
                            {conv.title || 'Untitled Conversation'}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {msgCount} messages{docCount > 0 ? ` • ${docCount} attachments` : ''}
                          </span>
                        </div>
                      </div>
                      {isCurrent && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}

                {filteredConversations.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching conversations found.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected Conversation Detail Box & Options */}
      {selectedConv && (
        <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-sky-50/50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-sky-950/20 p-3 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Grounded on: "{selectedConv.title}"</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {extractedContext.previewSummary}
              </p>
            </div>

            {onApplyTopicSuggestion && (
              <button
                type="button"
                onClick={() => onApplyTopicSuggestion(selectedConv.title)}
                className="shrink-0 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                title="Copy conversation title into the topic field"
              >
                <span>Use as Topic</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px]">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <FileText className="h-3 w-3" />
              <span>{extractedContext.messageCount} chat turns</span>
            </div>
            {extractedContext.attachmentCount > 0 && (
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Sliders className="h-3 w-3" />
                <span>{extractedContext.attachmentCount} uploaded docs</span>
              </div>
            )}

            <label className="ml-auto flex items-center gap-1.5 cursor-pointer font-medium text-indigo-900 dark:text-indigo-200">
              <input
                type="checkbox"
                checked={absorbContext}
                onChange={(e) => onToggleAbsorbContext(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Absorb Conversation Context (Chat & Files)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
