/**
 * Favorites Entity 公共 API
 *
 * 负责管理收藏 ID 列表及其加载状态
 */

export { useFavoritesStore } from './model/store';
export { favoritesSelectors, selectFavoriteIds, selectFavoritesLoadingState, selectFavoritesPagination } from './model/selectors';
export type { FavoritesStore, FavoritesLoadingState, FavoritesLoadingKind, FavoritesPaginationState } from './model/types';

export { useFavoritesActions, useFavoritesLoading, useFavoriteIds } from './hooks';
