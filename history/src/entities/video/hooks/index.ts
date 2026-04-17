/**
 * Hook 导出管理
 */

// 播放器控制功能 Hook
export { useVideoPlayer } from './useVideoPlayer';

// VideoView同步 Hook (播放器视图同步机制)
export { usePlayerEventSync, useTimeUpdateInterval } from './videoview-sync';

// 条件订阅工具 Hook（用于多视频场景）
export {
  useConditionalCurrentTime,
  useConditionalBufferedTime,
  useConditionalDuration,
} from './useConditionalVideoPlayer';
