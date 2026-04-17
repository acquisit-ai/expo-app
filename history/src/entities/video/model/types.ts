/**
 * 视频实体的类型定义
 * 专注于当前播放会话的运行时状态，不涉及持久化
 *
 * ⚠️ 重构说明（方案A）：
 * - 使用 PlayerMeta 确保 videoId 和 player 的绑定关系
 * - VideoMetaData 从 Video Meta Entity 获取
 */

import type { PlayerMeta } from '@/shared/types';

export type VideoPlaybackMode = 'pool' | 'standalone';
export type VideoPlaybackContext = VideoPlaybackMode | null;

/**
 * 视频播放状态
 * 通过定时器从播放器实例同步更新，确保 React 组件能正确重新渲染
 *
 * 注意：
 * - 播放设置（playbackRate, isMuted等）已移至 global-settings entity
 * - ❌ isPlaying 不在此管理，使用 usePlayerPlaying Hook 直接监听
 * - ❌ isPlayerReady 不在此管理，使用 usePlayerReadyState Hook 直接监听
 */
export interface VideoPlaybackState {
  // 实时时间状态 (通过 timeUpdate 事件频繁更新)
  currentTime: number;
  bufferedTime: number;
}

/**
 * 完整的视频实体状态
 * 包含当前视频的所有运行时状态
 *
 * ⚠️ 重构：使用 PlayerMeta 确保 videoId 和 player 绑定
 */
export interface VideoEntityState {
  /** 当前播放器元数据（包含 videoId 和 player 的绑定） */
  currentPlayerMeta: PlayerMeta | null;

  playback: VideoPlaybackState;
  playbackContext: VideoPlaybackContext;
}

/**
 * 视频状态管理的 Actions 接口
 */
export interface VideoActions {
  /** 设置当前播放器元数据 */
  setCurrentPlayerMeta: (meta: PlayerMeta, context: VideoPlaybackMode) => void;

  /** 清除当前视频 */
  clearCurrentVideo: () => void;

  // 播放状态管理
  updatePlayback: (updates: Partial<VideoPlaybackState>) => void;

  /** 设置播放上下文（仅在特殊场景下使用） */
  setPlaybackContext: (context: VideoPlaybackContext) => void;
}

/**
 * 视频 Store 的完整接口
 */
export interface VideoStore extends VideoEntityState, VideoActions { }
