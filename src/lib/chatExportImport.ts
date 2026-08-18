import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import type { Conversation, ChatMessage } from '@/types';

export interface ChatExportBundle {
  version: 1;
  exportedAt: number;
  appName: string;
  conversations: Conversation[];
}

export interface ImportPreviewItem {
  id: string;
  title: string;
  messageCount: number;
  firstMessagePreview: string;
  createdAt: number;
  original: Conversation;
}

/**
 * Downloads a blob in the browser
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Clean filename helper
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'chat_export';
}

/**
 * Export a single conversation to JSON
 */
export function exportConversationToJSON(conv: Conversation) {
  const bundle: ChatExportBundle = {
    version: 1,
    exportedAt: Date.now(),
    appName: 'aitutor Gemini Chat',
    conversations: [conv],
  };
  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadFile(blob, `${sanitizeFilename(conv.title)}_chat.json`);
}

/**
 * Export multiple selected conversations to JSON
 */
export function exportSelectedConversationsToJSON(conversations: Conversation[], filename?: string) {
  const bundle: ChatExportBundle = {
    version: 1,
    exportedAt: Date.now(),
    appName: 'aitutor Gemini Chat',
    conversations,
  };
  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const safeName = filename ? sanitizeFilename(filename) : `gemini_chats_export_${new Date().toISOString().slice(0, 10)}`;
  downloadFile(blob, `${safeName}.json`);
}

/**
 * Export all conversations to JSON Archive
 */
export function exportAllConversationsToJSON(conversations: Conversation[]) {
  exportSelectedConversationsToJSON(conversations, `all_gemini_chats_archive_${new Date().toISOString().slice(0, 10)}`);
}

/**
 * Export a conversation to Markdown (.md)
 */
export function exportConversationToMarkdown(conv: Conversation) {
  let md = `# ${conv.title}\n\n`;
  md += `> **Export Date:** ${new Date().toLocaleString()}  \n`;
  md += `> **Total Messages:** ${conv.messages.length}  \n`;
  if (conv.tutorSession) {
    md += `> **AI Tutor Mode:** ${conv.tutorSession.mode.toUpperCase()} (Score: ${conv.tutorSession.score}/${conv.tutorSession.maxScore})  \n`;
  }
  md += `\n---\n\n`;

  conv.messages.forEach((msg, idx) => {
    const sender = msg.role === 'user' ? '👤 **User**' : '🤖 **Gemini Assistant**';
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    md += `### ${sender} \`[${time}]\`\n\n`;
    md += `${msg.content}\n\n`;

    if (msg.attachments && msg.attachments.length > 0) {
      md += `📎 **Attachments:** ${msg.attachments.map((a) => a.name).join(', ')}\n\n`;
    }
    if (idx < conv.messages.length - 1) {
      md += `---\n\n`;
    }
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadFile(blob, `${sanitizeFilename(conv.title)}.md`);
}

/**
 * Export a conversation to Plain Text (.txt)
 */
export function exportConversationToPlainText(conv: Conversation) {
  let txt = `=================================================================\n`;
  txt += `aitutor CHAT TRANSCRIPT: ${conv.title.toUpperCase()}\n`;
  txt += `Exported: ${new Date().toLocaleString()} | Messages: ${conv.messages.length}\n`;
  txt += `=================================================================\n\n`;

  conv.messages.forEach((msg, idx) => {
    const sender = msg.role === 'user' ? 'USER' : 'GEMINI';
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    txt += `[${sender} - ${time}]\n`;
    txt += `${msg.content}\n`;
    if (msg.attachments && msg.attachments.length > 0) {
      txt += `Attachments: ${msg.attachments.map((a) => a.name).join(', ')}\n`;
    }
    if (idx < conv.messages.length - 1) {
      txt += `\n-----------------------------------------------------------------\n\n`;
    }
  });

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  downloadFile(blob, `${sanitizeFilename(conv.title)}.txt`);
}

/**
 * Export a conversation to Word Document (.docx)
 */
export async function exportConversationToDocx(conv: Conversation): Promise<void> {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: conv.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `aitutor Chat Transcript  |  Exported: ${new Date().toLocaleDateString()}  |  Total Messages: ${conv.messages.length}`,
          italics: true,
          size: 20,
          color: '64748B',
        }),
      ],
      spacing: { after: 300 },
    }),
  ];

  conv.messages.forEach((msg) => {
    const isUser = msg.role === 'user';
    const roleLabel = isUser ? 'USER' : 'GEMINI ASSISTANT';
    const roleColor = isUser ? '0284C7' : '0F172A';
    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `[${roleLabel} - ${timeStr}]`,
            bold: true,
            color: roleColor,
            size: 22,
          }),
        ],
        spacing: { before: 160, after: 60 },
      }),
    );

    // Split message lines
    const lines = msg.content.split('\n');
    lines.forEach((line) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 22,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    });

    if (msg.attachments && msg.attachments.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Attachments: ${msg.attachments.map((a) => a.name).join(', ')}`,
              italics: true,
              size: 18,
              color: '64748B',
            }),
          ],
          spacing: { after: 80 },
        }),
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadFile(blob, `${sanitizeFilename(conv.title)}_chat.docx`);
}

/**
 * Parses and validates an uploaded chat file or raw text (JSON, Markdown, or Text)
 */
export async function parseImportChatFile(file: File): Promise<Conversation[]> {
  const text = await file.text();
  return parseRawTextToConversations(text, file.name);
}

/**
 * Parses raw text input (from file or clipboard) into structured Conversation objects
 */
export function parseRawTextToConversations(text: string, defaultName = 'Imported Chat'): Conversation[] {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Input text is empty.');
  }

  // Case 1: JSON import (Standard Export format, array, or single conversation)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);

      // Subcase 1: ChatExportBundle format
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.conversations)) {
        return sanitizeImportedConversations(parsed.conversations);
      }

      // Subcase 2: Array of Conversations
      if (Array.isArray(parsed)) {
        // Check if it's standard ChatGPT exports array
        if (parsed.length > 0 && parsed[0]?.mapping) {
          return parseChatGPTExportArray(parsed);
        }
        return sanitizeImportedConversations(parsed);
      }

      // Subcase 3: Single ChatGPT export conversation object with mapping
      if (parsed && typeof parsed === 'object' && parsed.mapping) {
        return parseChatGPTExportArray([parsed]);
      }

      // Subcase 4: Single Conversation object
      if (parsed && typeof parsed === 'object' && (parsed.title || parsed.messages)) {
        return sanitizeImportedConversations([parsed as Conversation]);
      }

      throw new Error('Unrecognized JSON format. Must contain valid chat messages or conversations.');
    } catch (err: unknown) {
      // If JSON parsing fails, fall back to Markdown/Text parsing below
      if (err instanceof Error && err.message.includes('Unrecognized JSON format')) {
        throw err;
      }
    }
  }

  // Case 2: Markdown or Plain Text import (.md or .txt)
  const importedConv = parseMarkdownToConversation(defaultName, trimmed);
  return [importedConv];
}

interface ChatGPTNode {
  message?: {
    id?: string;
    create_time?: number;
    author?: { role?: string };
    content?: { parts?: unknown[] };
  };
}

interface ChatGPTConversationExport {
  title?: string;
  create_time?: number;
  update_time?: number;
  mapping?: Record<string, ChatGPTNode>;
}

/**
 * Converts ChatGPT conversation export mapping into standard Conversation format
 */
function parseChatGPTExportArray(chatGPTList: ChatGPTConversationExport[]): Conversation[] {
  const results: Conversation[] = [];

  for (const item of chatGPTList) {
    if (!item) continue;
    const title = item.title || 'ChatGPT Export';
    const createdAt = item.create_time ? item.create_time * 1000 : Date.now();
    const updatedAt = item.update_time ? item.update_time * 1000 : createdAt;
    const messages: ChatMessage[] = [];

    if (item.mapping && typeof item.mapping === 'object') {
      const nodeKeys = Object.keys(item.mapping);
      for (const key of nodeKeys) {
        const node = item.mapping[key];
        const msg = node?.message;
        if (!msg) continue;
        const authorRole = msg.author?.role;
        if (authorRole !== 'user' && authorRole !== 'assistant') continue;
        const parts = msg.content?.parts;
        const textContent = Array.isArray(parts) ? parts.filter((p): p is string => typeof p === 'string').join('\n') : '';
        if (!textContent.trim()) continue;

        messages.push({
          id: msg.id || crypto.randomUUID(),
          role: authorRole === 'assistant' ? 'model' : 'user',
          content: textContent.trim(),
          createdAt: msg.create_time ? msg.create_time * 1000 : Date.now(),
        });
      }
    }

    // Sort by timestamp
    messages.sort((a, b) => a.createdAt - b.createdAt);

    if (messages.length > 0) {
      results.push({
        id: crypto.randomUUID(),
        title,
        messages,
        createdAt,
        updatedAt,
      });
    }
  }

  if (results.length === 0) {
    throw new Error('No readable messages found in ChatGPT export format.');
  }

  return results;
}

/**
 * Sanitize and guarantee required fields for imported conversations
 */
function sanitizeImportedConversations(rawList: unknown[]): Conversation[] {
  const validated: Conversation[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Partial<Conversation>;

    const id = raw.id ? `import-${raw.id}-${crypto.randomUUID().slice(0, 4)}` : crypto.randomUUID();
    const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Imported Chat';
    const now = Date.now();
    const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : now;
    const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : now;

    const messages: ChatMessage[] = [];
    if (Array.isArray(raw.messages)) {
      for (const m of raw.messages) {
        if (!m || typeof m !== 'object') continue;
        const msg = m as Partial<ChatMessage>;
        const content = typeof msg.content === 'string' ? msg.content : '';
        if (!content && (!msg.attachments || msg.attachments.length === 0)) continue;

        messages.push({
          id: msg.id || crypto.randomUUID(),
          role: msg.role === 'model' || msg.role === 'user' ? msg.role : 'user',
          content,
          createdAt: typeof msg.createdAt === 'number' ? msg.createdAt : now,
          attachments: Array.isArray(msg.attachments) ? msg.attachments : undefined,
          tutorData: msg.tutorData,
        });
      }
    }

    validated.push({
      id,
      title,
      messages,
      createdAt,
      updatedAt,
      tutorSession: raw.tutorSession,
    });
  }

  if (validated.length === 0) {
    throw new Error('No valid conversations or messages found in the file.');
  }

  return validated;
}

/**
 * Enhanced markdown and text transcript parser to construct a readable conversation
 */
function parseMarkdownToConversation(fileName: string, text: string): Conversation {
  const lines = text.split('\n');
  const rawTitle = fileName.replace(/\.(md|txt|json)$/i, '').replace(/[-_]/g, ' ');
  let title = rawTitle ? rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1) : 'Imported Chat';

  const messages: ChatMessage[] = [];
  let currentRole: 'user' | 'model' = 'user';
  let currentContent: string[] = [];
  const now = Date.now();

  const userPatterns = [
    /^#{1,4}\s*(?:👤\s*)?(?:user|human|student|me|you)(?:[:\s([])/i,
    /^\*\*(?:👤\s*)?(?:user|human|student|me|you):\*\*/i,
    /^(?:👤\s*)?(?:user|human|student|me|you):/i,
    /^\[(?:user|human|student|me|you)[^\]]*\]/i,
  ];

  const assistantPatterns = [
    /^#{1,4}\s*(?:🤖\s*)?(?:gemini|assistant|ai|bot|tutor|chatgpt|claude)(?:[:\s([])/i,
    /^\*\*(?:🤖\s*)?(?:gemini|assistant|ai|bot|tutor|chatgpt|claude):\*\*/i,
    /^(?:🤖\s*)?(?:gemini|assistant|ai|bot|tutor|chatgpt|claude):/i,
    /^\[(?:gemini|assistant|ai|bot|tutor|chatgpt|claude)[^\]]*\]/i,
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line is title header # Title at start
    if (trimmed.startsWith('# ') && messages.length === 0 && currentContent.length === 0) {
      const extracted = trimmed.replace(/^#\s+/, '').trim();
      if (extracted) {
        title = extracted;
        continue;
      }
    }

    // Ignore horizontal rules or export metadata headers
    if (trimmed.startsWith('>') && (trimmed.includes('Export Date:') || trimmed.includes('Total Messages:'))) {
      continue;
    }
    if (trimmed.startsWith('==') || trimmed.startsWith('--') || trimmed === '---') {
      continue;
    }

    const isUserMatch = userPatterns.some((pattern) => pattern.test(trimmed));
    const isAssistantMatch = assistantPatterns.some((pattern) => pattern.test(trimmed));

    if (isUserMatch) {
      if (currentContent.length > 0) {
        messages.push({
          id: crypto.randomUUID(),
          role: currentRole,
          content: currentContent.join('\n').trim(),
          createdAt: now,
        });
        currentContent = [];
      }
      currentRole = 'user';
      continue;
    } else if (isAssistantMatch) {
      if (currentContent.length > 0) {
        messages.push({
          id: crypto.randomUUID(),
          role: currentRole,
          content: currentContent.join('\n').trim(),
          createdAt: now,
        });
        currentContent = [];
      }
      currentRole = 'model';
      continue;
    }

    currentContent.push(line);
  }

  if (currentContent.length > 0) {
    const finalTrimmed = currentContent.join('\n').trim();
    if (finalTrimmed) {
      messages.push({
        id: crypto.randomUUID(),
        role: currentRole,
        content: finalTrimmed,
        createdAt: now,
      });
    }
  }

  // If no role headers matched, store entire text as a single user message
  if (messages.length === 0 && text.trim()) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      createdAt: now,
    });
  }

  return {
    id: crypto.randomUUID(),
    title,
    messages,
    createdAt: now,
    updatedAt: now,
  };
}
