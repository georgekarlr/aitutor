import type { SavedStudyItem, TutorSessionData, FactAndQuestionBank } from '@/types';

const DB_NAME = 'aitutor_study_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'study_items';

/**
 * Initializes and returns the IndexedDB database instance for the Study Bank
 */
export function openStudyBankDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('mode', 'mode', { unique: false });
        store.createIndex('topic', 'topic', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Loads all saved study items from IndexedDB, sorted newest to oldest
 */
export async function getAllStudyItemsFromDB(): Promise<SavedStudyItem[]> {
  try {
    const db = await openStudyBankDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as SavedStudyItem[]) || [];
        // Sort descending by updatedAt or createdAt
        items.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        resolve(items);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Failed to get study items from IndexedDB', err);
    return [];
  }
}

/**
 * Retrieves a single study item by its ID from IndexedDB
 */
export async function getStudyItemFromDB(id: string): Promise<SavedStudyItem | null> {
  try {
    const db = await openStudyBankDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as SavedStudyItem) || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error(`Failed to get study item ${id} from IndexedDB`, err);
    return null;
  }
}

/**
 * Stores or updates a study item in IndexedDB
 */
export async function putStudyItemInDB(item: SavedStudyItem): Promise<SavedStudyItem> {
  const db = await openStudyBankDB();
  const itemToSave: SavedStudyItem = {
    ...item,
    updatedAt: item.updatedAt || Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(itemToSave);

    request.onsuccess = () => {
      resolve(itemToSave);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Deletes a single study item by ID from IndexedDB
 */
export async function deleteStudyItemFromDB(id: string): Promise<void> {
  const db = await openStudyBankDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Clears all study items stored in IndexedDB
 */
export async function clearAllStudyItemsInDB(): Promise<void> {
  const db = await openStudyBankDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Records an attempt and score for a stored study item in IndexedDB
 */
export async function recordStudyItemAttemptInDB(
  id: string,
  score: number,
  maxScore: number,
): Promise<SavedStudyItem | null> {
  const existing = await getStudyItemFromDB(id);
  if (!existing) return null;

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const updatedItem: SavedStudyItem = {
    ...existing,
    attemptsCount: (existing.attemptsCount || 0) + 1,
    lastScore: {
      score,
      maxScore,
      percentage,
      timestamp: Date.now(),
    },
    updatedAt: Date.now(),
  };

  return await putStudyItemInDB(updatedItem);
}

/**
 * Converts an active TutorSessionData into a persistable SavedStudyItem
 */
export function createStudyItemFromTutorSession(
  session: TutorSessionData,
  customTitle?: string,
  conversationId?: string,
  conversationTitle?: string,
): SavedStudyItem {
  const now = Date.now();
  const id = `study-${crypto.randomUUID().slice(0, 8)}`;
  const title = customTitle || `${session.topic} ${session.mode.toUpperCase()}`;

  return {
    id,
    title,
    topic: session.topic || 'General Topic',
    mode: (session.mode as SavedStudyItem['mode']) || 'quiz',
    description: `Generated from AI Tutor session with ${session.questions.length} questions.`,
    questions: session.questions,
    conversationId,
    conversationTitle,
    createdAt: now,
    updatedAt: now,
    attemptsCount: session.isFinished ? 1 : 0,
    lastScore: session.isFinished
      ? {
          score: session.score,
          maxScore: session.maxScore,
          percentage:
            session.maxScore > 0 ? Math.round((session.score / session.maxScore) * 100) : 0,
          timestamp: now,
        }
      : undefined,
  };
}

/**
 * Converts a FactAndQuestionBank into a persistable SavedStudyItem
 */
export function createStudyItemFromFactQuestionBank(
  bank: FactAndQuestionBank,
  customTitle?: string,
  conversationId?: string,
  conversationTitle?: string,
): SavedStudyItem {
  const now = Date.now();
  const id = `qna-${crypto.randomUUID().slice(0, 8)}`;
  const title = customTitle || `${bank.topic} Question & Answer Vault`;

  const convertedQuestions = bank.questions.map((q, idx) => ({
    id: q.id || `q-${idx}`,
    question: q.question,
    correctAnswer: q.sampleAnswer || 'See concept explanation',
    hint: q.interactiveFact || `Difficulty: ${q.difficulty}`,
    points: q.difficulty === 'Expert' ? 15 : q.difficulty === 'Hard' ? 10 : 5,
  }));

  return {
    id,
    title,
    topic: bank.topic || 'General Knowledge',
    mode: 'qna',
    description: bank.summary || `Extracted Q&A knowledge set for ${bank.topic}`,
    questions: convertedQuestions,
    conversationId,
    conversationTitle,
    createdAt: now,
    updatedAt: now,
    attemptsCount: 0,
  };
}
