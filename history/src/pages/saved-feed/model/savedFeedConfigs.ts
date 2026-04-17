import {
  useFavoriteIds,
  useFavoritesLoading,
} from '@/entities/favorites';
import {
  initializeFavorites,
  loadMoreFavorites,
  refreshFavorites,
} from '@/features/favorites-fetching';
import {
  useHistoryIds,
  useHistoryLoading,
} from '@/entities/history';
import {
  initializeHistory,
  loadMoreHistory,
  refreshHistory,
} from '@/features/history-fetching';
import type { SavedFeedConfig, SavedFeedKind, SavedFeedLoadingState } from './types';

const mapFavoritesLoading = (): SavedFeedLoadingState => {
  const { isLoading, loadingType, hasMore } = useFavoritesLoading();
  return {
    isLoading,
    loadingType,
    hasMore,
  };
};

const mapHistoryLoading = (): SavedFeedLoadingState => {
  const { isLoading, loadingType, hasMore } = useHistoryLoading();
  return {
    isLoading,
    loadingType,
    hasMore,
  };
};

export const SAVED_FEED_CONFIGS: Record<SavedFeedKind, SavedFeedConfig> = {
  favorites: {
    title: '我的收藏',
    emptyState: {
      title: '还没有收藏',
      description: '在 Feed 页面收藏喜欢的视频，就会显示在这里。',
    },
    dataSource: {
      useIds: useFavoriteIds,
      useLoading: mapFavoritesLoading,
      initialize: () => initializeFavorites(),
      loadMore: () => loadMoreFavorites(),
      refresh: () => refreshFavorites(),
    },
  },
  history: {
    title: '历史记录',
    emptyState: {
      title: '暂无观看记录',
      description: '开始学习后，我们会在这里记录你的观看历史。',
    },
    dataSource: {
      useIds: useHistoryIds,
      useLoading: mapHistoryLoading,
      initialize: () => initializeHistory(),
      loadMore: () => loadMoreHistory(),
      refresh: () => refreshHistory(),
    },
  },
};

export const getSavedFeedConfig = (kind: SavedFeedKind): SavedFeedConfig => {
  return SAVED_FEED_CONFIGS[kind];
};
