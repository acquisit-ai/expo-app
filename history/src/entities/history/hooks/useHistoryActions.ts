import { useHistoryStore } from '../model/store';

export function useHistoryActions() {
  const store = useHistoryStore();

  return {
    resetHistory: store.resetHistory,
    appendHistoryIds: store.appendHistoryIds,
    setHistoryIds: store.setHistoryIds,
    removeHistoryId: store.removeHistoryId,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    setPagination: store.setPagination,
  };
}
