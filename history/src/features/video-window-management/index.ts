/**
 * Video Window Management Feature
 *
 * 🔑 职责：协调 player-pool Entity 与其他 Entities
 * - 从 video-meta, feed, video entities 读取数据
 * - 将数据作为参数传递给 player-pool manager
 * - 符合 FSD 架构：Feature 层可以依赖多个 Entities
 *
 * v7.0: 依赖注入重构
 * v7.1: 添加导航逻辑（移自 entities/video）
 * v7.2: 修复循环依赖 - 提取业务逻辑到 lib/
 */

// === 导航逻辑（Feature 层业务编排） ===
export { useVideoNavigation } from './hooks/useVideoNavigation';
export type { VideoNavigationActions } from './hooks/useVideoNavigation';

// === 视频操作业务逻辑 ===
export {
  acquirePlayerForVideo,
  performPreloadVideos,
  enterFullscreenMode,
  exitFullscreenMode,
  extendWindowNext,
  extendWindowPrev,
  loadPendingVideos,
  getPoolInfo,
} from './lib/video-operations';
