import { useState, useEffect, useCallback } from 'react';
import type { SavedStudyItem, TutorSessionData, FactAndQuestionBank } from '@/types';
import {
  getAllStudyItemsFromDB,
  putStudyItemInDB,
  deleteStudyItemFromDB,
  createStudyItemFromTutorSession,
  createStudyItemFromFactQuestionBank,
  recordStudyItemAttemptInDB,
} from '@/lib/studyBankStorage';
import { exportStudyItemToDocx, exportMultipleStudyItemsToDocx } from '@/lib/docxExport';

export function useStudyBank() {
  const [items, setItems] = useState<SavedStudyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Load items from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const stored = await getAllStudyItemsFromDB();
        if (isMounted) {
          setItems(stored);
        }
      } catch (err) {
        console.error('Error loading study bank from IndexedDB:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh items from IndexedDB
  const refresh = useCallback(async () => {
    try {
      const stored = await getAllStudyItemsFromDB();
      setItems(stored);
    } catch (err) {
      console.error('Failed to refresh study bank:', err);
    }
  }, []);

  // Save current active tutor session to IndexedDB
  const saveSession = useCallback(
    async (
      session: TutorSessionData,
      customTitle?: string,
      conversationId?: string,
      conversationTitle?: string,
    ): Promise<SavedStudyItem> => {
      const newItem = createStudyItemFromTutorSession(
        session,
        customTitle,
        conversationId,
        conversationTitle,
      );
      await putStudyItemInDB(newItem);
      setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
      return newItem;
    },
    [],
  );

  // Save a fact and question bank to IndexedDB
  const saveQnABank = useCallback(
    async (
      bank: FactAndQuestionBank,
      customTitle?: string,
      conversationId?: string,
      conversationTitle?: string,
    ): Promise<SavedStudyItem> => {
      const newItem = createStudyItemFromFactQuestionBank(
        bank,
        customTitle,
        conversationId,
        conversationTitle,
      );
      await putStudyItemInDB(newItem);
      setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
      return newItem;
    },
    [],
  );

  // Add a new or customized study item
  const addItem = useCallback(
    async (item: Omit<SavedStudyItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedStudyItem> => {
      const now = Date.now();
      const newItem: SavedStudyItem = {
        ...item,
        id: `custom-${crypto.randomUUID().slice(0, 8)}`,
        createdAt: now,
        updatedAt: now,
        attemptsCount: 0,
      };
      await putStudyItemInDB(newItem);
      setItems((prev) => [newItem, ...prev]);
      return newItem;
    },
    [],
  );

  // Modify / update a specific quiz/item in IndexedDB
  const updateItem = useCallback(
    async (id: string, patch: Partial<SavedStudyItem>): Promise<SavedStudyItem | null> => {
      let updated: SavedStudyItem | null = null;
      setItems((prev) => {
        const next = prev.map((item) => {
          if (item.id === id) {
            updated = {
              ...item,
              ...patch,
              updatedAt: Date.now(),
            };
            return updated;
          }
          return item;
        });
        return next;
      });

      if (updated) {
        await putStudyItemInDB(updated);
      }
      return updated;
    },
    [],
  );

  // Delete a specific quiz from IndexedDB
  const deleteItem = useCallback(async (id: string) => {
    await deleteStudyItemFromDB(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Export single quiz to DOCX
  const exportToDocx = useCallback(async (item: SavedStudyItem) => {
    try {
      setIsExporting(true);
      await exportStudyItemToDocx(item);
    } catch (err) {
      console.error('Failed to export DOCX', err);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Export multiple selected quizzes to DOCX
  const exportBatchToDocx = useCallback(
    async (selectedItems: SavedStudyItem[], filename?: string) => {
      try {
        setIsExporting(true);
        await exportMultipleStudyItemsToDocx(selectedItems, filename);
      } catch (err) {
        console.error('Failed to export batch DOCX', err);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  // Record an attempt in IndexedDB
  const recordScore = useCallback(
    async (id: string, score: number, maxScore: number) => {
      await recordStudyItemAttemptInDB(id, score, maxScore);
      await refresh();
    },
    [refresh],
  );

  // Clear all items in DB
  const clearAll = useCallback(async () => {
    await clearAllStudyItemsInDB();
    setItems([]);
  }, []);

  // Import batch study items (with merge or replaceAll option)
  const importItems = useCallback(
    async (newItems: SavedStudyItem[], replaceAll = false) => {
      if (replaceAll) {
        await clearAllStudyItemsInDB();
        for (const item of newItems) {
          await putStudyItemInDB(item);
        }
        setItems(newItems);
      } else {
        for (const item of newItems) {
          await putStudyItemInDB(item);
        }
        const existingIds = new Set(newItems.map((i) => i.id));
        setItems((prev) => [...newItems, ...prev.filter((i) => !existingIds.has(i.id))]);
      }
    },
    [],
  );

  return {
    items,
    isLoading,
    refresh,
    saveSession,
    saveQnABank,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    importItems,
    exportToDocx,
    exportBatchToDocx,
    recordScore,
    isExporting,
  };
}
