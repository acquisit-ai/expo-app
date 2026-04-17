import { fetchFavorites } from '../api/favorites-api';
import { useFavoritesStore } from '@/entities/favorites';
import { useVideoMetaStore } from '@/entities/video-meta';
import { log, LogType } from '@/shared/lib/logger';
import { toast } from '@/shared/lib/toast';

const INITIAL_FETCH_LIMIT = 12;
const LOAD_MORE_LIMIT = 10;

function showErrorToast(title: string, message?: string) {
  toast.show({
    type: 'error',
    title,
    message: message ?? '请稍后重试',
    duration: 2500,
  });
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

/**
 * 初始化收藏列表
 */
export async function initializeFavorites(limit: number = INITIAL_FETCH_LIMIT): Promise<void> {
  const favoritesStore = useFavoritesStore.getState();

  if (favoritesStore.loading.isLoading || favoritesStore.favoriteIds.length > 0) {
    log('favorites-service', LogType.DEBUG, 'Skip initialize: already loading or initialized');
    return;
  }

  favoritesStore.setLoading(true, 'initial');
  favoritesStore.clearError();

  try {
    const response = await fetchFavorites({ limit, cursor: null });
    const videoMetaStore = useVideoMetaStore.getState();

    videoMetaStore.addVideos(response.videos);
    favoritesStore.setFavoriteIds(response.videos.map(video => video.id));
    favoritesStore.setPagination({
      cursor: response.nextCursor,
      hasMore: response.hasMore,
    });
    favoritesStore.setLoading(false);

    log(
      'favorites-service',
      LogType.INFO,
      `Initialized favorites: count=${response.videos.length}, nextCursor=${response.nextCursor}, hasMore=${response.hasMore}`,
    );
  } catch (error) {
    const message = extractErrorMessage(error);
    favoritesStore.setError(message);

    log('favorites-service', LogType.ERROR, `Failed to initialize favorites: ${message}`);
    showErrorToast('收藏加载失败', '请检查网络连接后重试');
    throw error;
  }
}

/**
 * 加载更多收藏
 */
export async function loadMoreFavorites(limit: number = LOAD_MORE_LIMIT): Promise<void> {
  const favoritesStore = useFavoritesStore.getState();

  if (favoritesStore.loading.isLoading) {
    log('favorites-service', LogType.DEBUG, 'Skip load more: still loading');
    return;
  }

  if (!favoritesStore.pagination.hasMore || !favoritesStore.pagination.cursor) {
    log('favorites-service', LogType.INFO, 'No more favorites to load');
    return;
  }

  favoritesStore.setLoading(true, 'loadMore');
  favoritesStore.clearError();

  try {
    const response = await fetchFavorites({
      limit,
      cursor: favoritesStore.pagination.cursor,
    });
    const videoMetaStore = useVideoMetaStore.getState();

    videoMetaStore.addVideos(response.videos);
    favoritesStore.appendFavoriteIds(response.videos.map(video => video.id));
    favoritesStore.setPagination({
      cursor: response.nextCursor,
      hasMore: response.hasMore,
    });
    favoritesStore.setLoading(false);

    log(
      'favorites-service',
      LogType.INFO,
      `Loaded more favorites: count=${response.videos.length}, nextCursor=${response.nextCursor}, hasMore=${response.hasMore}`,
    );
  } catch (error) {
    const message = extractErrorMessage(error);
    favoritesStore.setError(message);

    log('favorites-service', LogType.ERROR, `Failed to load more favorites: ${message}`);
    showErrorToast('加载更多失败', '请稍后重试');
    throw error;
  }
}

/**
 * 刷新收藏列表
 */
export async function refreshFavorites(limit: number = INITIAL_FETCH_LIMIT): Promise<void> {
  const favoritesStore = useFavoritesStore.getState();

  if (favoritesStore.loading.isLoading) {
    log('favorites-service', LogType.DEBUG, 'Skip refresh: still loading');
    return;
  }

  favoritesStore.setLoading(true, 'refresh');
  favoritesStore.clearError();

  try {
    const response = await fetchFavorites({ limit, cursor: null });
    const videoMetaStore = useVideoMetaStore.getState();

    videoMetaStore.addVideos(response.videos);
    favoritesStore.setFavoriteIds(response.videos.map(video => video.id));
    favoritesStore.setPagination({
      cursor: response.nextCursor,
      hasMore: response.hasMore,
    });
    favoritesStore.setLoading(false);

    log(
      'favorites-service',
      LogType.INFO,
      `Refreshed favorites: count=${response.videos.length}, nextCursor=${response.nextCursor}, hasMore=${response.hasMore}`,
    );
  } catch (error) {
    const message = extractErrorMessage(error);
    favoritesStore.setError(message);

    log('favorites-service', LogType.ERROR, `Failed to refresh favorites: ${message}`);
    showErrorToast('刷新失败', '请检查网络连接后重试');
    throw error;
  }
}
