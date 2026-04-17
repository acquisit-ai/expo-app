import { fetchHistory } from '../api/history-api';
import { useHistoryStore } from '@/entities/history';
import { useVideoMetaStore } from '@/entities/video-meta';
import { log, LogType } from '@/shared/lib/logger';
import { toast } from '@/shared/lib/toast';

const INITIAL_FETCH_LIMIT = 12;
const LOAD_MORE_LIMIT = 10;

const showErrorToast = (title: string, message?: string) => {
  toast.show({
    type: 'error',
    title,
    message: message ?? '请稍后重试',
    duration: 2500,
  });
};

const extractError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
};

export async function initializeHistory(limit: number = INITIAL_FETCH_LIMIT): Promise<void> {
  const historyStore = useHistoryStore.getState();

  if (historyStore.loading.isLoading || historyStore.historyIds.length > 0) {
    log('history-service', LogType.DEBUG, 'Skip initialize: already loading or initialized');
    return;
  }

  historyStore.setLoading(true, 'initial');
  historyStore.clearError();

  try {
    const response = await fetchHistory({ limit, cursor: null });
    const videoMeta = useVideoMetaStore.getState();

    videoMeta.addVideos(response.videos);
    historyStore.setHistoryIds(response.videos.map(video => video.id));
    historyStore.setPagination({
      cursor: response.nextCursor,
      hasMore: response.hasMore,
    });
    historyStore.setLoading(false);

    log('history-service', LogType.INFO,
      `Initialized history: count=${response.videos.length}, nextCursor=${response.nextCursor}, hasMore=${response.hasMore}`,
    );
  } catch (error) {
    const message = extractError(error);
    historyStore.setError(message);
    log('history-service', LogType.ERROR, `Failed to initialize history: ${message}`);
    showErrorToast('历史记录加载失败', '请检查网络连接后重试');
    throw error;
  }
}

export async function loadMoreHistory(limit: number = LOAD_MORE_LIMIT): Promise<void> {
  const historyStore = useHistoryStore.getState();

  if (historyStore.loading.isLoading) {
    log('history-service', LogType.DEBUG, 'Skip load more: still loading');
    return;
  }

  if (!historyStore.pagination.hasMore || !historyStore.pagination.cursor) {
    log('history-service', LogType.INFO, 'No more history items to load');
    return;
  }

  historyStore.setLoading(true, 'loadMore');
  historyStore.clearError();

  try {
    const response = await fetchHistory({
      limit,
      cursor: historyStore.pagination.cursor,
    });
    const videoMeta = useVideoMetaStore.getState();

    videoMeta.addVideos(response.videos);
    historyStore.appendHistoryIds(response.videos.map(video => video.id));
    historyStore.setPagination({
      cursor: response.nextCursor,
      hasMore: response.hasMore,
    });
    historyStore.setLoading(false);

    log('history-service', LogType.INFO,
      `Loaded more history: count=${response.videos.length}, nextCursor=${response.nextCursor}, hasMore=${response.hasMore}`,
    );
  } catch (error) {
    const message = extractError(error);
    historyStore.setError(message);
    log('history-service', LogType.ERROR, `Failed to load more history: ${message}`);
    showErrorToast('加载更多失败', '请稍后重试');
    throw error;
  }
}

export async function refreshHistory(limit: number = INITIAL_FETCH_LIMIT): Promise<void> {
  const historyStore = useHistoryStore.getState();

  if (historyStore.loading.isLoading) {
    log('history-service', LogType.DEBUG, 'Skip refresh: still loading');
    return;
  }

  historyStore.setLoading(true, 'refresh');
  historyStore.clearError();

  try {
    const response = await fetchHistory({ limit, cursor: null });
    const videoMeta = useVideoMetaStore.getState();

    videoMeta.addVideos(response.videos);
    historyStore.setHistoryIds(response.videos.map(video => video.id));
    historyStore.setPagination({
      cursor: response.nextCursor,
      hasMore: response.hasMore,
    });
    historyStore.setLoading(false);

    log('history-service', LogType.INFO,
      `Refreshed history: count=${response.videos.length}, nextCursor=${response.nextCursor}, hasMore=${response.hasMore}`,
    );
  } catch (error) {
    const message = extractError(error);
    historyStore.setError(message);
    log('history-service', LogType.ERROR, `Failed to refresh history: ${message}`);
    showErrorToast('刷新失败', '请检查网络连接后重试');
    throw error;
  }
}
