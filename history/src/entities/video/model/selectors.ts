/**
 * Video Entity - 选择器
 *
 * 只提供 Video Entity 自己管理的状态选择器
 * 不依赖其他 Entity（如 Video Meta Entity）
 *
 * ⚠️ 设计原则：
 * - VideoMetaData 由组件自己从 Video Meta Entity 获取
 * - Video Entity 提供 currentPlayerMeta，确保 videoId 和 player 绑定
 * - 也提供便捷的选择器来单独获取 videoId 或 player
 */

import type { VideoStore, VideoPlaybackContext } from './types';
import type { VideoPlayer } from 'expo-video';
import type { PlayerMeta } from '@/shared/types';

// ===== 核心状态选择器 =====

/**
 * 获取当前播放器元数据
 */
export const selectCurrentPlayerMeta = (state: VideoStore): PlayerMeta | null => {
  return state.currentPlayerMeta;
};

/**
 * 获取当前视频 ID（便捷选择器）
 */
export const selectCurrentVideoId = (state: VideoStore): string | null => {
  return state.currentPlayerMeta?.videoId ?? null;
};

/**
 * 获取当前播放器实例（便捷选择器）
 */
export const selectCurrentPlayer = (state: VideoStore): VideoPlayer | null => {
  return state.currentPlayerMeta?.playerInstance ?? null;
};

/**
 * 获取当前播放上下文（pool / standalone）
 */
export const selectPlaybackContext = (state: VideoStore): VideoPlaybackContext => {
  return state.playbackContext;
};

// ===== 播放状态选择器 =====

/**
 * 获取当前播放时间
 */
export const selectCurrentTime = (state: VideoStore): number => {
  return state.playback.currentTime;
};

/**
 * 获取已缓冲时间
 */
export const selectBufferedTime = (state: VideoStore): number => {
  return state.playback.bufferedTime;
};

// ===== Actions 选择器 =====

/**
 * 获取 setCurrentPlayerMeta action
 */
export const selectSetCurrentPlayerMeta = (state: VideoStore) => {
  return state.setCurrentPlayerMeta;
};

/**
 * 获取 clearCurrentVideo action
 */
export const selectClearCurrentVideo = (state: VideoStore) => {
  return state.clearCurrentVideo;
};

/**
 * 获取 updatePlayback action
 */
export const selectUpdatePlayback = (state: VideoStore) => {
  return state.updatePlayback;
};

/**
 * 获取 setPlaybackContext action
 */
export const selectSetPlaybackContext = (state: VideoStore) => {
  return state.setPlaybackContext;
};
