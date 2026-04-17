import { useHistoryStore } from '../model/store';
import { historySelectors } from '../model/selectors';

export function useHistoryLoading() {
  const loading = useHistoryStore(historySelectors.getLoadingState);
  const hasMore = useHistoryStore(historySelectors.getHasMore);

  return {
    isLoading: loading.isLoading,
    loadingType: loading.type,
    error: loading.error,
    hasMore,
  };
}
