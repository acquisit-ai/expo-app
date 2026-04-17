import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { log, LogType } from '@/shared/lib/logger';
import type { WordCollectionStateCreator, WordCollectionStore, WordItem, WordPrimaryKey } from './types';

const ensurePrimaryKey = (item: WordItem): WordPrimaryKey => {
  return item.id ?? String(Date.now());
};

const createState: WordCollectionStateCreator = (set) => ({
  entities: {},
  order: [],
  sorted: [],
  isLoading: false,
  error: null,
  lastSyncedAt: null,
  setLoading: (value) => set({ isLoading: value }),
  setError: (value) => set({ error: value }),
  replaceItems: (items: WordItem[], syncedAt = new Date().toISOString()) => {
    const entities: Record<WordPrimaryKey, WordItem> = {};
    const order: WordPrimaryKey[] = [];

    items.forEach((raw) => {
      const key = ensurePrimaryKey(raw);
      const nextItem: WordItem = {
        ...raw,
        id: key,
        addedAt: raw.addedAt ?? new Date().toISOString(),
      };
      entities[key] = nextItem;
      order.push(key);
    });

    set({
      entities,
      order,
      sorted: [],
      lastSyncedAt: syncedAt,
      isLoading: false,
      error: null,
    });
    log('word-collection', LogType.INFO, `Stored ${order.length} word items`);
  },
  upsertItem: (item: WordItem) => {
    set((state) => {
      const key = ensurePrimaryKey(item);
      const nextItem: WordItem = {
        ...item,
        id: key,
        addedAt: item.addedAt ?? new Date().toISOString(),
      };

      const exists = Boolean(state.entities[key]);
      const entities = {
        ...state.entities,
        [key]: nextItem,
      };

      const order = exists ? state.order : [key, ...state.order];

      log('word-collection', LogType.INFO, `${exists ? 'Updated' : 'Added'} word item ${nextItem.label}`);

      return {
        entities,
        order,
        sorted: [],
        lastSyncedAt: state.lastSyncedAt ?? new Date().toISOString(),
      };
    });
  },
  removeItem: (id: WordPrimaryKey) => {
    set((state) => {
      if (!state.entities[id]) {
        log('word-collection', LogType.DEBUG, `No word found for id ${id}, skip removal`);
        return {};
      }

      const { [id]: removed, ...rest } = state.entities;
      const order = state.order.filter(key => key !== id);
      log('word-collection', LogType.INFO, `Removed word with id ${id}`);
      return {
        entities: rest,
        order,
        sorted: state.sorted.filter(key => key !== id),
      };
    });
  },
  clearSorted: () => set({ sorted: [] }),
  reset: () => {
    set({
      entities: {},
      order: [],
      sorted: [],
      isLoading: false,
      error: null,
      lastSyncedAt: null,
    });
  },
});

export const useWordCollectionStore = create<WordCollectionStore>()(
  subscribeWithSelector(createState)
);
