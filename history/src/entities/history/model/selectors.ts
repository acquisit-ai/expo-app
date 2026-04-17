import type { HistoryStore } from './types';

export const historySelectors = {
  getHistoryIds: (state: HistoryStore) => state.historyIds,
  getLoadingState: (state: HistoryStore) => state.loading,
  getPagination: (state: HistoryStore) => state.pagination,
  getHasHistory: (state: HistoryStore) => state.historyIds.length > 0,
  getHasMore: (state: HistoryStore) => state.pagination.hasMore,
};

export const selectHistoryIds = historySelectors.getHistoryIds;
export const selectHistoryLoadingState = historySelectors.getLoadingState;
export const selectHistoryPagination = historySelectors.getPagination;
