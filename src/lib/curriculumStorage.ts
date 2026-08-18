/**
 * curriculumStorage.ts
 *
 * IndexedDB storage for Taskmaster Curricula (Feature 3.A).
 * Supports offline-first persistence, reactive pub/sub, and progress tracking.
 */

import type { CurriculumPlan, CurriculumModule } from '@/types';

const DB_NAME = 'gemini_taskmaster_curricula_db';
const DB_VERSION = 1;
const STORE_NAME = 'curricula';

let dbInstance: IDBDatabase | null = null;
type CurriculumListener = (curricula: CurriculumPlan[]) => void;
const listeners: Set<CurriculumListener> = new Set();

function notifyListeners(curricula: CurriculumPlan[]) {
  listeners.forEach((listener) => {
    try {
      listener(curricula);
    } catch (e) {
      console.error('Curriculum listener error:', e);
    }
  });
}

export function subscribeCurricula(listener: CurriculumListener): () => void {
  listeners.add(listener);
  getAllCurricula().then(listener).catch(console.error);
  return () => {
    listeners.delete(listener);
  };
}

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('subject', 'subject', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      reject((e.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getAllCurricula(): Promise<CurriculumPlan[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const list = (req.result as CurriculumPlan[]) || [];
      // Sort newest updated first
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getCurriculumById(id: string): Promise<CurriculumPlan | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
      resolve(req.result || null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveCurriculum(curriculum: CurriculumPlan): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Compute accurate progress percentage
    const totalModules = curriculum.modules.length;
    const completedModules = curriculum.modules.filter((m) => m.status === 'completed').length;
    const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    const toSave: CurriculumPlan = {
      ...curriculum,
      progressPercentage,
      updatedAt: Date.now(),
    };

    const req = store.put(toSave);
    req.onsuccess = () => {
      getAllCurricula().then(notifyListeners).catch(console.error);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateModuleStatus(
  curriculumId: string,
  moduleId: string,
  newStatus: CurriculumModule['status'],
): Promise<CurriculumPlan | null> {
  const curriculum = await getCurriculumById(curriculumId);
  if (!curriculum) return null;

  const updatedModules = curriculum.modules.map((m) =>
    m.id === moduleId ? { ...m, status: newStatus } : m,
  );

  const total = updatedModules.length;
  const completed = updatedModules.filter((m) => m.status === 'completed').length;
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const updatedPlan: CurriculumPlan = {
    ...curriculum,
    modules: updatedModules,
    progressPercentage,
    updatedAt: Date.now(),
  };

  await saveCurriculum(updatedPlan);
  return updatedPlan;
}

export async function deleteCurriculum(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => {
      getAllCurricula().then(notifyListeners).catch(console.error);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}
