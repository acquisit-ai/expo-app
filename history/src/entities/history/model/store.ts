import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { log, LogType } from '@/shared/lib/logger';
import type {
  HistoryStore,
  HistoryLoadingState,
  HistoryPaginationState,
  HistoryLoadingKind,
} from './types';

const initialLoadingState: HistoryLoadingState = {
  isLoading: false,
  type: null,
  error: null,
};

const initialPaginationState: HistoryPaginationState = {
  cursor: null,
  hasMore: true,
};

export const useHistoryStore = create<HistoryStore>()(
  subscribeWithSelector((set, get) => ({
    historyIds: [],
    historyIdSet: new Set<string>(),
    loading: initialLoadingState,
    pagination: initialPaginationState,

    resetHistory: () => {
      log('history-store', LogType.INFO, 'Reset history store');
      set({
        historyIds: [],
        historyIdSet: new Set<string>(),
        loading: initialLoadingState,
        pagination: initialPaginationState,
      });
    },

    appendHistoryIds: (ids: string[]) => {
      if (ids.length === 0) {
        log('history-store', LogType.DEBUG, 'appendHistoryIds called with empty array');
        return;
      }

      set((state) => {
        const uniqueIds = ids.filter(id => !state.historyIdSet.has(id));

        if (uniqueIds.length === 0) {
          log('history-store', LogType.DEBUG, `Skipped append: all ${ids.length} ids already exist`);
          return state;
        }

        const nextIds = [...state.historyIds, ...uniqueIds];
        const nextSet = new Set([...state.historyIdSet, ...uniqueIds]);

        log('history-store', LogType.INFO,
          `Appended ${uniqueIds.length} history ids (duplicates filtered: ${ids.length - uniqueIds.length}), total=${nextIds.length}`,
        );

        return {
          historyIds: nextIds,
          historyIdSet: nextSet,
        };
      });
    },

    setHistoryIds: (ids: string[]) => {
      log('history-store', LogType.INFO, `Replacing history ids, new length=${ids.length}`);
      set({
        historyIds: [...ids],
        historyIdSet: new Set(ids),
      });
    },

    removeHistoryId: (id: string) => {
      const state = get();
      if (!state.historyIdSet.has(id)) {
        log('history-store', LogType.DEBUG, `removeHistoryId skipped, id not found: ${id}`);
        return;
      }

      set(() => {
        const updatedIds = state.historyIds.filter(historyId => historyId !== id);
        const updatedSet = new Set(updatedIds);

        log('history-store', LogType.INFO, `Removed history id=${id}, total=${updatedIds.length}`);

        return {
          historyIds: updatedIds,
          historyIdSet: updatedSet,
        };
      });
    },

    setLoading: (isLoading: boolean, type?: HistoryLoadingKind) => {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading,
          type: isLoading ? (type ?? 'initial') : null,
        },
      }));
    },

    setError: (error: string | null) => {
      set((state) => ({
        loading: {
          ...state.loading,
          error,
          isLoading: false,
          type: null,
        },
      }));
    },

    clearError: () => {
      set((state) => ({
        loading: {
          ...state.loading,
          error: null,
        },
      }));
    },

    setPagination: (pagination: HistoryPaginationState) => {
      set(() => ({
        pagination: {
          cursor: pagination.cursor,
          hasMore: pagination.hasMore,
        },
      }));
    },
  })),
);
