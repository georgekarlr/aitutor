import type { ChatMessage, GeminiSettings } from '@/types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiInlinePart {
  text: string;
}

interface GeminiFilePart {
  inline_data: {
    mime_type: string;
    data: string;
  };
}

type GeminiPart = GeminiInlinePart | GeminiFilePart;

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface StreamChunk {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }>; role?: string };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

export class GeminiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}

export function resolveModelName(model?: string): string {
  if (model && model.trim()) {
    return model.trim();
  }
  return 'gemini-3.7-flash';
}

function toGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  return messages
    .filter((m) => !m.error && (m.content.trim().length > 0 || (m.attachments && m.attachments.length > 0)))
    .map((m) => {
      const parts: GeminiPart[] = [];
      if (m.attachments) {
        for (const att of m.attachments) {
          parts.push({
            inline_data: {
              mime_type: att.mimeType,
              data: att.data,
            },
          });
        }
      }
      if (m.content.trim().length > 0) {
        parts.push({ text: m.content });
      }
      return { role: m.role, parts };
    });
}

interface StreamCallbacks {
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export async function streamGemini(
  settings: GeminiSettings,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
): Promise<void> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new GeminiError('No API key set. Add your Gemini API key in settings.');
  }

  const model = resolveModelName(settings.model);
  const url = `${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: toGeminiContents(messages),
    systemInstruction: settings.systemPrompt
      ? { parts: [{ text: settings.systemPrompt }] }
      : undefined,
    generationConfig: {
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: callbacks.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    throw new GeminiError('Network error. Check your connection or Cloudflare network settings and try again.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errData = await response.json();
      detail = errData?.error?.message ?? '';
    } catch {
      // ignore parse failure
    }
    if (response.status === 400 && /API key not valid/i.test(detail)) {
      throw new GeminiError('Your API key is not valid. Check it in settings.', 400);
    }
    if (response.status === 400 && /User location is not supported/i.test(detail)) {
      throw new GeminiError('User location is not supported for the Gemini API by Google Cloud in this region.', 400);
    }
    if (response.status === 429) {
      if (/GenerateRequestsPerDayPerProjectPerModel-FreeTier/i.test(detail) || /free_tier/i.test(detail) || /quota/i.test(detail)) {
        throw new GeminiError('Free-tier daily quota limit reached for gemini-3.7-flash (20 requests/day on free tier). Generate a key in a new project at aistudio.google.com/apikey or enable billing in GCP to lift limits.', 429);
      }
      throw new GeminiError('Rate limit reached. Wait a moment and try again.', 429);
    }
    if (response.status === 403) {
      if (/denied access/i.test(detail) || /permission/i.test(detail)) {
        throw new GeminiError(
          'Google Cloud Project access denied: The Google Cloud project linked to this API key is restricted or blocked by Google Cloud. Generate a new API key at https://aistudio.google.com/apikey or check your Google Cloud project status.',
          403,
        );
      }
      if (/referer/i.test(detail) || /origin/i.test(detail) || /blocked/i.test(detail)) {
        throw new GeminiError(
          'API Key Domain Restriction: Your API key restrictions in Google Cloud Console block requests from this domain. Allow this production domain in GCP Credentials or set Application Restrictions to None.',
          403,
        );
      }
      throw new GeminiError(detail || 'Access denied (403). Your API key may not have access to this model or project.', 403);
    }
    throw new GeminiError(detail || `Request failed (${response.status}).`, response.status);
  }

  if (!response.body) {
    throw new GeminiError('No response stream received from Gemini.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const chunk: StreamChunk = JSON.parse(data);
          if (chunk.error?.message) {
            throw new GeminiError(chunk.error.message);
          }
          if (chunk.promptFeedback?.blockReason) {
            throw new GeminiError(`Response blocked: ${chunk.promptFeedback.blockReason}`);
          }
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            callbacks.onChunk(text);
          }
        } catch (err) {
          if (err instanceof GeminiError) throw err;
          // Skip malformed JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function generateTitle(
  settings: GeminiSettings,
  firstUserMessage: string,
  firstModelReply: string,
): Promise<string | null> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) return null;

  const model = resolveModelName(settings.model);
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `Based on the following exchange, generate a very short title (3-5 words, no quotes, no punctuation at the end) that summarizes the topic:\n\nUser: ${firstUserMessage.slice(0, 500)}\n\nAssistant: ${firstModelReply.slice(0, 500)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 30 },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return text.trim().replace(/^["']|["']$/g, '').slice(0, 60);
  } catch {
    return null;
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
