import { useState, useCallback } from 'react';
import type { CreateFeedbackItemInput } from '../types';

export interface PendingFeedbackItem extends CreateFeedbackItemInput {
  _id: string;
}

export interface UseFeedbackModeReturn {
  isActive: boolean;
  toggle: () => void;
  activate: () => void;
  deactivate: () => void;
  pendingItems: PendingFeedbackItem[];
  addItem: (item: CreateFeedbackItemInput) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  pendingCount: number;
}

let nextId = 0;

export function useFeedbackMode(): UseFeedbackModeReturn {
  const [isActive, setIsActive] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingFeedbackItem[]>([]);

  const toggle = useCallback(() => setIsActive((v) => !v), []);
  const activate = useCallback(() => setIsActive(true), []);
  const deactivate = useCallback(() => setIsActive(false), []);

  const addItem = useCallback((item: CreateFeedbackItemInput) => {
    setPendingItems((prev) => [...prev, { ...item, _id: `fb-${++nextId}` }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setPendingItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const clearItems = useCallback(() => setPendingItems([]), []);

  return {
    isActive,
    toggle,
    activate,
    deactivate,
    pendingItems,
    addItem,
    removeItem,
    clearItems,
    pendingCount: pendingItems.length,
  };
}
