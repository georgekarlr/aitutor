/**
 * scratchpadStorage.ts
 *
 * Dedicated offline-first IndexedDB persistence for AI-synthesized Live Scratchpad Notes.
 * Includes in-memory caching, localStorage backup, and cross-component subscription listeners.
 */

import type { LiveScratchpadNote } from '@/types';

const DB_NAME = 'aitutor_scratchpad_db';
const DB_VERSION = 1;
const STORE_NAME = 'scratchpad_notes';
const LOCALSTORAGE_KEY = 'aitutor_scratchpad_notes_backup_v1';

let memoryNotes: LiveScratchpadNote[] = [];
let dbPromise: Promise<IDBDatabase> | null = null;
const listeners = new Set<(notes: LiveScratchpadNote[]) => void>();

function notifyListeners() {
  const current = [...memoryNotes];
  listeners.forEach((cb) => {
    try {
      cb(current);
    } catch (e) {
      console.warn('Scratchpad listener error:', e);
    }
  });
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('conversationId', 'conversationId', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error for Scratchpad:', event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

function loadLocalStorageFallback(): LiveScratchpadNote[] {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Could not read scratchpad notes from localStorage fallback:', e);
  }
  return [];
}

function saveLocalStorageFallback(notes: LiveScratchpadNote[]): void {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('Could not write scratchpad notes to localStorage fallback:', e);
  }
}

/**
 * Fetch all scratchpad notes from IndexedDB with in-memory caching and fallback.
 */
export async function getAllScratchpadNotes(): Promise<LiveScratchpadNote[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result as LiveScratchpadNote[]) || [];
        // Sort descending by updatedAt
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        memoryNotes = results;
        saveLocalStorageFallback(results);
        notifyListeners();
        resolve(results);
      };

      req.onerror = () => {
        const fallback = loadLocalStorageFallback();
        memoryNotes = fallback;
        resolve(fallback);
      };
    });
  } catch (err) {
    console.warn('IndexedDB unavailable for Scratchpad, using fallback:', err);
    const fallback = loadLocalStorageFallback();
    memoryNotes = fallback;
    return fallback;
  }
}

/**
 * Get note by ID
 */
export async function getScratchpadNoteById(id: string): Promise<LiveScratchpadNote | null> {
  const notes = await getAllScratchpadNotes();
  return notes.find((n) => n.id === id) || null;
}

/**
 * Get note by conversation ID
 */
export async function getScratchpadNoteByConversationId(
  conversationId: string,
): Promise<LiveScratchpadNote | null> {
  const notes = await getAllScratchpadNotes();
  return notes.find((n) => n.conversationId === conversationId) || null;
}

/**
 * Save or update a scratchpad note in IndexedDB.
 */
export async function saveScratchpadNote(note: LiveScratchpadNote): Promise<LiveScratchpadNote> {
  const updatedNote: LiveScratchpadNote = {
    ...note,
    updatedAt: Date.now(),
  };

  // Update memory list immediately
  const existingIdx = memoryNotes.findIndex((n) => n.id === updatedNote.id);
  if (existingIdx >= 0) {
    memoryNotes[existingIdx] = updatedNote;
  } else {
    memoryNotes.unshift(updatedNote);
  }
  saveLocalStorageFallback(memoryNotes);
  notifyListeners();

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(updatedNote);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save scratchpad note to IndexedDB, fallback preserved:', err);
  }

  return updatedNote;
}

/**
 * Delete a scratchpad note
 */
export async function deleteScratchpadNote(id: string): Promise<void> {
  memoryNotes = memoryNotes.filter((n) => n.id !== id);
  saveLocalStorageFallback(memoryNotes);
  notifyListeners();

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete scratchpad note from IndexedDB:', err);
  }
}

/**
 * Subscribe to real-time scratchpad updates across UI drawers and views.
 */
export function subscribeScratchpadNotes(
  callback: (notes: LiveScratchpadNote[]) => void,
): () => void {
  listeners.add(callback);
  // Send initial data if available
  if (memoryNotes.length > 0) {
    callback([...memoryNotes]);
  } else {
    getAllScratchpadNotes().then((notes) => callback(notes));
  }

  return () => {
    listeners.delete(callback);
  };
}

/**
 * Helper to generate default empty note
 */
export function createEmptyScratchpadNote(
  conversationId?: string,
  conversationTitle?: string,
): LiveScratchpadNote {
  const timestamp = Date.now();
  return {
    id: `note_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
    title: conversationTitle ? `${conversationTitle} - Live Notes` : 'New Study Note',
    subject: conversationTitle || 'General Studies',
    summary: 'Live collaborative notes synthesized as you study.',
    content: `# ${conversationTitle || 'Study Session Notes'}\n\n*Live notes will be auto-generated or can be edited here manually.*\n\n## Key Takeaways\n- Start chatting or studying to see real-time distilled concepts, formulas, and flashcards.\n`,
    keyConcepts: [],
    formulas: [],
    flashcards: [],
    actionItems: [
      { id: 'act_1', text: 'Review key terms after session', done: false },
      { id: 'act_2', text: 'Practice quiz in Study Bank', done: false },
    ],
    conversationId,
    conversationTitle,
    isAutoExtracted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
