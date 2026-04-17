import { useFavoritesStore } from '../model/store';

/**
 * 收藏实体操作集合
 */
export function useFavoritesActions() {
  const store = useFavoritesStore();

  return {
    resetFavorites: store.resetFavorites,
    appendFavoriteIds: store.appendFavoriteIds,
    setFavoriteIds: store.setFavoriteIds,
    removeFavoriteId: store.removeFavoriteId,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    setPagination: store.setPagination,
  };
}
