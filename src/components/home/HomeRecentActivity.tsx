import {
  MessageSquare,
  Clock,
  ArrowRight,
  Plus,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Workflow,
} from 'lucide-react';
import type { Conversation } from '@/types';

interface HomeRecentActivityProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenStudyBank: () => void;
  onOpenCurriculum: () => void;
  onOpenTutor: () => void;
}

export function HomeRecentActivity({
  conversations,
  onSelectConversation,
  onNewChat,
  onOpenStudyBank,
  onOpenCurriculum,
  onOpenTutor,
}: HomeRecentActivityProps) {
  const recentChats = conversations.slice(0, 4);

  const formatTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left 2 Cols: Recent Conversations */}
      <div className="lg:col-span-2 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Recent Learning Threads
            </h2>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {recentChats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                No active conversations yet
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Start a research thread, paste homework, or ask a question to begin your learning journey.
              </p>
            </div>
            <button
              type="button"
              onClick={onNewChat}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Start Your First Conversation</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentChats.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const isTutorActive = !!conv.tutorSession;

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => onSelectConversation(conv.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:border-sky-300 dark:hover:border-sky-700/80 hover:shadow-xs transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                        isTutorActive
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isTutorActive ? (
                        <GraduationCap className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {conv.title || 'Untitled Thread'}
                        </h3>
                        {isTutorActive && (
                          <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                            Tutor
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-md">
                        {lastMsg ? lastMsg.content.slice(0, 90) : 'Empty conversation'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatTime(conv.updatedAt || conv.createdAt)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right 1 Col: Quick Launch Action Card & Knowledge Vault */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Study Vault & Syllabi
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 p-4 space-y-3 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Local Offline Persistence</span>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
                IndexedDB
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              All generated quizzes, active recall decks, and curriculum units are securely stored in your browser and can be exported as Microsoft Word (.docx) documents.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenStudyBank}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-all cursor-pointer shadow-2xs"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
              <span>Study Bank</span>
            </button>

            <button
              type="button"
              onClick={onOpenCurriculum}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-all cursor-pointer shadow-2xs"
            >
              <Workflow className="h-3.5 w-3.5 text-emerald-500" />
              <span>Curricula</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenTutor}
            className="w-full flex items-center justify-between rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              <span>Launch New Tutor Session</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
