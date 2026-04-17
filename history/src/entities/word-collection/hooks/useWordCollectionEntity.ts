import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useWordCollectionStore } from '../model/store';
import type { WordCollectionStore, WordItem } from '../model/types';

export interface UseWordCollectionEntityReturn {
  items: WordItem[];
  entities: Record<string, WordItem>;
  order: string[];
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  actions: {
    setLoading: (value: boolean) => void;
    setError: (value: string | null) => void;
    replaceItems: (items: WordItem[], syncedAt?: string) => void;
    upsertItem: (item: WordItem) => void;
    removeItem: (id: string) => void;
    clearSorted: () => void;
    reset: () => void;
  };
}

export function useWordCollectionEntity(): UseWordCollectionEntityReturn {
  const entities = useStore(useWordCollectionStore, (state) => state.entities);
  const order = useStore(useWordCollectionStore, (state) => state.order);
  const isLoading = useStore(useWordCollectionStore, (state) => state.isLoading);
  const error = useStore(useWordCollectionStore, (state) => state.error);
  const lastSyncedAt = useStore(useWordCollectionStore, (state) => state.lastSyncedAt);

  const items = useMemo(() => order.map(id => entities[id]).filter((item): item is WordItem => Boolean(item)), [order, entities]);

  const actions = useMemo(() => {
    const store: WordCollectionStore = useWordCollectionStore.getState();
    return {
      setLoading: store.setLoading,
      setError: store.setError,
      replaceItems: store.replaceItems,
      upsertItem: store.upsertItem,
      removeItem: store.removeItem,
      clearSorted: store.clearSorted,
      reset: store.reset,
    };
  }, []);

  return {
    items,
    entities,
    order,
    isLoading,
    error,
    lastSyncedAt,
    actions,
  };
}
