import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUp, Square, Paperclip, X, FileText, AlertCircle, Mic } from 'lucide-react';
import type { FileAttachment } from '@/types';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/types';
import { fileToBase64, formatFileSize, isImageFile } from '@/lib/gemini';

function fileToText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

function isSupportedFile(file: File): boolean {
  if (file.type && ACCEPTED_FILE_TYPES.includes(file.type)) return true;
  const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  const allowedExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'csv', 'md', 'json',
    'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'mp3', 'wav', 'ogg', 'mp4', 'webm'
  ];
  return allowedExtensions.includes(ext);
}

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
    js: 'text/javascript',
    ts: 'text/plain',
    py: 'text/x-python',
    html: 'text/html',
    css: 'text/css',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    mp4: 'video/mp4',
  };
  return map[ext] || 'application/octet-stream';
}

interface InputBarProps {
  onSend: (text: string, attachments: FileAttachment[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  placeholder?: string;
  onVoiceToggle?: () => void;
}

export default function InputBar({
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder,
  onVoiceToggle,
}: InputBarProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    if (disabled) return;
    onSend(trimmed, attachments);
    setText('');
    setAttachments([]);
    setFileError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setFileError(null);
    const fileArray = Array.from(files);
    const newAttachments: FileAttachment[] = [];

    for (const file of fileArray) {
      const mimeType = getMimeType(file);
      if (!isSupportedFile(file)) {
        setFileError(`"${file.name}" is not a supported file type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" exceeds the 50MB limit.`);
        continue;
      }
      try {
        const data = await fileToBase64(file);
        let textContent: string | undefined = undefined;

        if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('csv') || file.name.match(/\.(txt|md|csv|json|js|ts|py|html|css)$/i)) {
          textContent = await fileToText(file);
        }

        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          mimeType,
          size: file.size,
          data,
          textContent,
        });
      } catch {
        setFileError(`Failed to read "${file.name}".`);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 md:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs"
              >
                {isImageFile(att.mimeType) ? (
                  <img
                    src={`data:${att.mimeType};base64,${att.data}`}
                    alt={att.name}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="max-w-[140px] truncate font-medium text-slate-700 dark:text-slate-200">
                    {att.name}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    {formatFileSize(att.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {fileError && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{fileError}</span>
            <button
              type="button"
              onClick={() => setFileError(null)}
              className="ml-auto rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div
          className={`relative flex items-end gap-2 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 transition-all ${
            isDragging
              ? 'border-sky-400 dark:border-sky-500 ring-2 ring-sky-400/30'
              : 'border-slate-300 dark:border-slate-700 focus-within:border-sky-400 dark:focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-400/20'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Paperclip button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={disabled && !isStreaming}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40 mb-1.5 ml-1"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled && !isStreaming}
            rows={1}
            placeholder={placeholder ?? 'Message Gemini...'}
            className="flex-1 resize-none bg-transparent py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none disabled:opacity-50"
          />
          <div className="flex items-center gap-1 pb-1.5 pr-1.5">
            {onVoiceToggle && (
              <button
                type="button"
                onClick={onVoiceToggle}
                disabled={disabled && !isStreaming}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors disabled:opacity-40"
                aria-label="Voice mode"
                title="Voice conversation mode"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                aria-label="Stop generating"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sm hover:shadow-md hover:from-sky-600 hover:to-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-center text-xs text-slate-400 dark:text-slate-600">
          Gemini can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
