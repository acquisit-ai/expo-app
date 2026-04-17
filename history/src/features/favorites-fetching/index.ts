/**
 * Favorites Fetching Feature 公共 API
 *
 * 负责收藏列表的数据获取与实体层写入
 */

export { fetchFavorites } from './api/favorites-api';
export {
  initializeFavorites,
  loadMoreFavorites,
  refreshFavorites,
} from './lib/favoritesService';

export type {
  FavoritesFetchParams,
  FavoritesFetchResponse,
} from './model/types';
