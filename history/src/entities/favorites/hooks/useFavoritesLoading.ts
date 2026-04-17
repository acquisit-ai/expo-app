import { useFavoritesStore } from '../model/store';
import { favoritesSelectors } from '../model/selectors';

/**
 * 收藏加载状态 Hook
 */
export function useFavoritesLoading() {
  const loading = useFavoritesStore(favoritesSelectors.getLoadingState);
  const hasMore = useFavoritesStore(favoritesSelectors.getHasMore);

  return {
    isLoading: loading.isLoading,
    loadingType: loading.type,
    error: loading.error,
    hasMore,
  };
}
