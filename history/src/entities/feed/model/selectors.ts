/**
 * Feed Entity - 选择器
 *
 * 提供便捷的状态选择方法
 */

import type { FeedStore } from './types';

/** 获取当前播放的视频 ID */
export const selectCurrentVideoId = (state: FeedStore): string | null => {
  const { videoIds, playback } = state;
  return videoIds[playback.currentFeedIndex] ?? null;
};

/** 获取视频 ID 列表 */
export const selectVideoIds = (state: FeedStore): string[] => state.videoIds;

/** 获取加载状态 */
export const selectLoadingState = (state: FeedStore) => state.loading;

/** 获取播放状态 */
export const selectPlaybackState = (state: FeedStore) => state.playback;

/** 检查是否可以加载更多 */
export const selectCanLoadMore = (state: FeedStore): boolean => {
  return !state.loading.isLoading;
};

/** 获取当前播放索引 */
export const selectCurrentFeedIndex = (state: FeedStore): number => {
  return state.playback.currentFeedIndex;
};
