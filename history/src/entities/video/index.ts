/**
 * 视频实体的统一导出 - Player Pool 架构版本
 * 提供基于播放器池的全新视频管理系统，支持预加载和快速切换
 */

// === 核心类型定义 ===
export type {
  VideoPlaybackState,
  VideoEntityState,
  VideoStore,
  VideoPlaybackMode,
  VideoPlaybackContext,
} from './model/types';

// === 状态管理 ===
export { useVideoStore } from './model/store';

// === Selectors（推荐使用，避免重复订阅） ===
export {
  // 核心状态 selectors
  selectCurrentPlayerMeta,
  selectCurrentVideoId,
  selectCurrentPlayer,
  selectPlaybackContext,
  // 播放状态 selectors
  selectCurrentTime,
  selectBufferedTime,
  // Action selectors
  selectSetCurrentPlayerMeta,
  selectClearCurrentVideo,
  selectUpdatePlayback,
  selectSetPlaybackContext,
} from './model/selectors';

// 注意：以下 selectors 已移至 global-settings entity：
// - selectPlaybackRate, selectIsMuted, selectStaysActiveInBackground, selectStartsPictureInPictureAutomatically
// - selectShowSubtitles, selectShowTranslation

// 注意：导航逻辑已移至 features/video-window-management：
// - useVideoNavigation (原 useVideoDataLogic)

// === 播放器控制 ===
export { useVideoPlayer } from './hooks/useVideoPlayer';

// === 条件订阅工具（用于多视频场景） ===
export {
  useConditionalCurrentTime,
  useConditionalBufferedTime,
  useConditionalDuration,
} from './hooks/useConditionalVideoPlayer';

// === Entity 自动同步（推荐使用，在 App 层调用） ===
export { useVideoEntitySync } from './hooks/useVideoEntitySync';
