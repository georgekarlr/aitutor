import { encryptApiKey, decryptApiKey } from './apiKeyCrypto';

const CONV_KEY = 'gemini-chat-conversations';
const SETTINGS_KEY = 'gemini-chat-settings';
const THEME_KEY = 'gemini-chat-theme';

export function loadConversations<T>(): T | null {
  try {
    const raw = localStorage.getItem(CONV_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    
    // Automatically sanitize loaded conversations to unlock any stale in-flight generation or evaluation
    if (Array.isArray(parsed)) {
      const sanitized = parsed.map((c: Record<string, unknown>) => {
        if (!c || typeof c !== 'object') return c;
        const session = c.tutorSession as Record<string, unknown> | undefined;
        if (!session || typeof session !== 'object') return c;

        const questions = Array.isArray(session.questions) ? session.questions : [];
        const hasQuestions = questions.length > 0;

        return {
          ...c,
          tutorSession: {
            ...session,
            isGenerating: false,
            isEvaluating: false,
            state: hasQuestions ? (session.state === 'setup' ? 'question' : session.state) : 'setup',
          },
        };
      });
      return sanitized as unknown as T;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export function saveConversations<T>(data: T): void {
  try {
    localStorage.setItem(CONV_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export function loadSettings<T>(): T | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && typeof parsed.apiKey === 'string') {
      parsed.apiKey = decryptApiKey(parsed.apiKey);
    }
    return parsed as unknown as T;
  } catch {
    return null;
  }
}

export function saveSettings<T>(data: T): void {
  try {
    if (data && typeof data === 'object') {
      const copy = { ...data } as Record<string, unknown>;
      if (typeof copy.apiKey === 'string' && copy.apiKey.trim()) {
        copy.apiKey = encryptApiKey(copy.apiKey.trim());
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(copy));
      return;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}
