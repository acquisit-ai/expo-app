export type FavoritesLoadingKind = 'initial' | 'loadMore' | 'refresh';

export interface FavoritesLoadingState {
  isLoading: boolean;
  type: FavoritesLoadingKind | null;
  error: string | null;
}

export interface FavoritesPaginationState {
  cursor: string | null;
  hasMore: boolean;
}

export interface FavoritesStore {
  /** 收藏 ID 列表，按时间倒序（最新在前） */
  favoriteIds: string[];
  /** 用于快速去重的 Set */
  favoriteIdSet: Set<string>;
  /** 加载状态 */
  loading: FavoritesLoadingState;
  /** 分页游标 */
  pagination: FavoritesPaginationState;

  /** 重置收藏列表（清空所有状态） */
  resetFavorites: () => void;
  /** 追加收藏 ID（自动去重） */
  appendFavoriteIds: (ids: string[]) => void;
  /** 使用新列表替换当前收藏数据 */
  setFavoriteIds: (ids: string[]) => void;
  /** 移除收藏 ID */
  removeFavoriteId: (id: string) => void;

  /** 设置加载状态 */
  setLoading: (isLoading: boolean, type?: FavoritesLoadingKind) => void;
  /** 设置错误并停止加载 */
  setError: (error: string | null) => void;
  /** 清除错误但保留加载状态 */
  clearError: () => void;

  /** 更新分页信息 */
  setPagination: (pagination: FavoritesPaginationState) => void;
}
