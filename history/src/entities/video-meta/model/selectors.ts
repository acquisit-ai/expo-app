/**
 * Video Meta Entity - 选择器
 *
 * 提供便捷的状态选择方法，优化组件性能
 */

import type { VideoMetaStore } from './types';
import type { VideoMetaData } from '@/shared/types';

/**
 * 获取单个视频元数据
 */
export const selectVideo = (videoId: string) => (state: VideoMetaStore): VideoMetaData | null => {
  return state.videos.get(videoId) ?? null;
};

/**
 * 检查视频是否存在于缓存
 */
export const selectHasVideo = (videoId: string) => (state: VideoMetaStore): boolean => {
  return state.videos.has(videoId);
};

/**
 * 获取缓存中的视频总数
 */
export const selectCacheSize = (state: VideoMetaStore): number => {
  return state.videos.size;
};

/**
 * 获取所有视频ID列表
 */
export const selectAllVideoIds = (state: VideoMetaStore): string[] => {
  return Array.from(state.videos.keys());
};

/**
 * 获取所有视频元数据列表
 */
export const selectAllVideos = (state: VideoMetaStore): VideoMetaData[] => {
  return Array.from(state.videos.values());
};
