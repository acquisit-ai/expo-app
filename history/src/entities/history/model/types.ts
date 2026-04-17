export type HistoryLoadingKind = 'initial' | 'loadMore' | 'refresh';

export interface HistoryLoadingState {
  isLoading: boolean;
  type: HistoryLoadingKind | null;
  error: string | null;
}

export interface HistoryPaginationState {
  cursor: string | null;
  hasMore: boolean;
}

export interface HistoryStore {
  historyIds: string[];
  historyIdSet: Set<string>;
  loading: HistoryLoadingState;
  pagination: HistoryPaginationState;

  resetHistory: () => void;
  appendHistoryIds: (ids: string[]) => void;
  setHistoryIds: (ids: string[]) => void;
  removeHistoryId: (id: string) => void;

  setLoading: (isLoading: boolean, type?: HistoryLoadingKind) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  setPagination: (pagination: HistoryPaginationState) => void;
}
