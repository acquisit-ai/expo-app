import type { FavoritesStore } from './types';

export const favoritesSelectors = {
  getFavoriteIds: (state: FavoritesStore) => state.favoriteIds,
  getLoadingState: (state: FavoritesStore) => state.loading,
  getPaginationState: (state: FavoritesStore) => state.pagination,
  getHasFavorites: (state: FavoritesStore) => state.favoriteIds.length > 0,
  getHasMore: (state: FavoritesStore) => state.pagination.hasMore,
  getIsLoading: (state: FavoritesStore) => state.loading.isLoading,
};

export const selectFavoriteIds = favoritesSelectors.getFavoriteIds;
export const selectFavoritesLoadingState = favoritesSelectors.getLoadingState;
export const selectFavoritesPagination = favoritesSelectors.getPaginationState;
export const selectHasFavorites = favoritesSelectors.getHasFavorites;
