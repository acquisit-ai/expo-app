import { useFavoritesStore } from '../model/store';
import { favoritesSelectors } from '../model/selectors';

/**
 * 订阅收藏 ID 列表
 */
export function useFavoriteIds() {
  return useFavoritesStore(favoritesSelectors.getFavoriteIds);
}
