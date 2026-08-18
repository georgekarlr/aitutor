import { useRef, useEffect, useState } from 'react';
import type { ChatMessage, FileAttachment, TutorMessageData } from '@/types';
import Markdown from './Markdown';
import { CopyButton } from './Sidebar';
import { User, Sparkles, AlertCircle, FileText, GraduationCap, Layers } from 'lucide-react';
import { formatFileSize, isImageFile } from '@/lib/gemini';
import {
  QuestionCard,
  FlashcardCard,
  SessionCompleteCard,
  ModeSelectCard,
} from './TutorCards';
import { StudioArtifactCard } from './StudioArtifactCard';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  onTutorAnswer?: (answer: string) => void;
  onTutorFlashcardEvaluate?: (answer: string) => void;
  onTutorFlashcardNext?: () => void;
  onTutorStartSession?: (mode: 'quiz' | 'flashcard' | 'recitation' | 'exam', topic: string, numItems: number) => void;
  onTutorNewSession?: () => void;
  onOpenWhiteboard?: (topic?: string) => void;
  onOpenAudioStudio?: (topic?: string) => void;
  onOpenMockExam?: (subject?: string) => void;
  onOpenCurriculum?: (subject?: string) => void;
  onOpenScratchpad?: () => void;
}

export default function MessageList({
  messages,
  isStreaming,
  streamingContent,
  onTutorAnswer,
  onTutorFlashcardEvaluate,
  onTutorFlashcardNext,
  onTutorStartSession,
  onTutorNewSession,
  onOpenWhiteboard,
  onOpenAudioStudio,
  onOpenMockExam,
  onOpenCurriculum,
  onOpenScratchpad,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(atBottom);
  };

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20 mb-5">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          How can I help you today?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Ask anything, or start an AI Tutor session for interactive quizzes, flashcards, recitations, and exams.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
      onScroll={handleScroll}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            messages={messages}
            onTutorAnswer={onTutorAnswer}
            onTutorFlashcardEvaluate={onTutorFlashcardEvaluate}
            onTutorFlashcardNext={onTutorFlashcardNext}
            onTutorStartSession={onTutorStartSession}
            onTutorNewSession={onTutorNewSession}
            onOpenWhiteboard={onOpenWhiteboard}
            onOpenAudioStudio={onOpenAudioStudio}
            onOpenMockExam={onOpenMockExam}
            onOpenCurriculum={onOpenCurriculum}
            onOpenScratchpad={onOpenScratchpad}
          />
        ))}

        {isStreaming && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'model',
              content: streamingContent,
              createdAt: Date.now(),
            }}
            messages={messages}
            isStreaming
          />
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}

function AttachmentPreview({ att }: { att: FileAttachment }) {
  if (isImageFile(att.mimeType)) {
    return (
      <img
        src={`data:${att.mimeType};base64,${att.data}`}
        alt={att.name}
        className="max-h-48 rounded-xl object-contain"
      />
    );
  }
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 px-3 py-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
        <FileText className="h-4 w-4 text-slate-500 dark:text-slate-300" />
      </div>
      <div className="flex flex-col">
        <span className="max-w-[200px] truncate text-xs font-medium text-slate-700 dark:text-slate-200">
          {att.name}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {formatFileSize(att.size)}
        </span>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  messages,
  isStreaming,
  onTutorAnswer,
  onTutorFlashcardEvaluate,
  onTutorFlashcardNext,
  onTutorStartSession,
  onTutorNewSession,
  onOpenWhiteboard,
  onOpenAudioStudio,
  onOpenMockExam,
  onOpenCurriculum,
  onOpenScratchpad,
}: {
  message: ChatMessage;
  messages?: ChatMessage[];
  isStreaming?: boolean;
  onTutorAnswer?: (answer: string) => void;
  onTutorFlashcardEvaluate?: (answer: string) => void;
  onTutorFlashcardNext?: () => void;
  onTutorStartSession?: (mode: 'quiz' | 'flashcard' | 'recitation' | 'exam', topic: string, numItems: number) => void;
  onTutorNewSession?: () => void;
  onOpenWhiteboard?: (topic?: string) => void;
  onOpenAudioStudio?: (topic?: string) => void;
  onOpenMockExam?: (subject?: string) => void;
  onOpenCurriculum?: (subject?: string) => void;
  onOpenScratchpad?: () => void;
}) {
  const isUser = message.role === 'user';
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasTutorData = !!message.tutorData;
  const hasStudioArtifact = !!message.studioArtifact;

  // Render tutor card inline
  if (hasTutorData && !isUser) {
    return (
      <TutorMessageRenderer
        data={message.tutorData!}
        messages={messages}
        onTutorAnswer={onTutorAnswer}
        onTutorFlashcardEvaluate={onTutorFlashcardEvaluate}
        onTutorFlashcardNext={onTutorFlashcardNext}
        onTutorStartSession={onTutorStartSession}
        onTutorNewSession={onTutorNewSession}
      />
    );
  }

  // Render studio artifact inline
  if (hasStudioArtifact && !isUser) {
    return (
      <div className="flex gap-3 flex-row">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 max-w-[calc(100%-2.5rem)]">
          <StudioArtifactCard
            artifact={message.studioArtifact!}
            onOpenAudioStudio={onOpenAudioStudio}
            onOpenWhiteboard={onOpenWhiteboard}
            onOpenMockExam={onOpenMockExam}
            onOpenCurriculum={onOpenCurriculum}
            onOpenScratchpad={onOpenScratchpad}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? 'bg-slate-200 dark:bg-slate-700'
            : 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      <div className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isUser
              ? 'bg-sky-600 text-white'
              : message.error
                ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-slate-700 dark:text-slate-300'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          {message.error ? (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{message.content}</span>
            </div>
          ) : isUser ? (
            <>
              {hasAttachments && (
                <div className={`mb-2 flex flex-wrap gap-2 ${message.content ? 'pb-2 border-b border-white/20' : ''}`}>
                  {message.attachments!.map((att) => (
                    <AttachmentPreview key={att.id} att={att} />
                  ))}
                </div>
              )}
              {message.content && (
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              )}
            </>
          ) : (
            <>
              {message.content ? (
                <Markdown content={message.content} />
              ) : (
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
              {isStreaming && message.content && (
                <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-sky-500 align-middle" />
              )}
            </>
          )}
        </div>

        {!message.error && !isStreaming && (
          <div className="mt-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={message.content} />
            {onOpenWhiteboard && !isUser && message.content && (
              <button
                type="button"
                onClick={() => {
                  const firstLine = message.content.split('\n')[0].replace(/^[#*\s-]+/, '').slice(0, 60);
                  onOpenWhiteboard(firstLine || undefined);
                }}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Visualize this concept on Whiteboard"
              >
                <Layers className="h-3 w-3" />
                <span>Whiteboard</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TutorMessageRenderer({
  data,
  messages,
  onTutorAnswer,
  onTutorFlashcardEvaluate,
  onTutorFlashcardNext,
  onTutorStartSession,
  onTutorNewSession,
}: {
  data: TutorMessageData;
  messages?: ChatMessage[];
  onTutorAnswer?: (answer: string) => void;
  onTutorFlashcardEvaluate?: (answer: string) => void;
  onTutorFlashcardNext?: () => void;
  onTutorStartSession?: (mode: 'quiz' | 'flashcard' | 'recitation' | 'exam', topic: string, numItems: number) => void;
  onTutorNewSession?: () => void;
}) {
  return (
    <div className="flex gap-3 flex-row">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 text-white">
        <GraduationCap className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 max-w-[calc(100%-2.5rem)]">
        {data.type === 'mode-select' && onTutorStartSession && (
          <ModeSelectCard onSelectMode={onTutorStartSession} messages={messages} />
        )}

        {(data.type === 'quiz-question' || data.type === 'quiz-feedback' || data.type === 'exam-question' || data.type === 'exam-feedback') && onTutorAnswer && (
          <QuestionCard
            data={data}
            onSubmitAnswer={onTutorAnswer}
            isLast={data.step === data.totalSteps}
          />
        )}

        {(data.type === 'flashcard' || data.type === 'flashcard-feedback') && onTutorFlashcardEvaluate && onTutorFlashcardNext && (
          <FlashcardCard
            data={data}
            onEvaluate={onTutorFlashcardEvaluate}
            onNext={onTutorFlashcardNext}
            isLast={data.cardIndex === data.totalCards ? true : data.cardIndex === (data.totalCards ?? 0) - 1}
          />
        )}

        {data.type === 'session-complete' && onTutorNewSession && (
          <SessionCompleteCard data={data} onNewSession={onTutorNewSession} />
        )}
      </div>
    </div>
  );
}
