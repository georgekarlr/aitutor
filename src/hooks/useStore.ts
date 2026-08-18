import { useEffect, useState, useCallback, useRef } from 'react';
import type { Conversation, GeminiSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  loadConversations,
  saveConversations,
  loadSettings,
  saveSettings,
  loadTheme,
  saveTheme,
} from '@/lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<GeminiSettings>(() => {
    const saved = loadSettings<Partial<GeminiSettings>>();
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    if (!merged.apiKey || !merged.apiKey.trim()) {
      merged.apiKey = DEFAULT_SETTINGS.apiKey;
    }
    // Automatically migrate legacy/deprecated model names to gemini-3.7-flash
    if (!merged.model || merged.model.includes('3.6') || merged.model.includes('1.5') || merged.model.includes('2.0') || merged.model.includes('2.5')) {
      merged.model = 'gemini-3.7-flash';
    }
    return merged;
  });

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<GeminiSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, updateSettings };
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, setTheme };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return loadConversations<Conversation[]>() ?? [];
  });
  const [activeId, setActiveId] = useState<string | null>(
    () => (loadConversations<Conversation[]>() ?? [])[0]?.id ?? null,
  );

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const createConversation = useCallback((): string => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const conv: Conversation = {
      id,
      title: 'New chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    return id;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  }, [activeId]);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c)),
    );
  }, []);

  const updateConversation = useCallback(
    (id: string, updater: (c: Conversation) => Conversation) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? updater(c) : c)),
      );
    },
    [],
  );

  const importConversations = useCallback(
    (importedList: Conversation[], replaceAll = false) => {
      if (importedList.length === 0) return;
      setConversations((prev) => {
        if (replaceAll) {
          return importedList;
        }
        // Deduplicate or append new ones to the top
        const existingIds = new Set(prev.map((c) => c.id));
        const filteredNew = importedList.filter((c) => !existingIds.has(c.id));
        return [...filteredNew, ...prev];
      });
      // Set the first imported conversation as active
      if (importedList[0]) {
        setActiveId(importedList[0].id);
      }
    },
    [],
  );

  return {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    renameConversation,
    updateConversation,
    importConversations,
  };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useAutoScroll(deps: unknown[]) {
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom('smooth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { endRef, autoScroll, setAutoScroll, scrollToBottom };
}
