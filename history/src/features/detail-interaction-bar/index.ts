/**
 * 视频交互栏功能模块统一导出
 */

// UI组件 - 对外暴露完整的Feature组件
export { VideoInteractionSection } from './ui/VideoInteractionSection';

// 子组件 - 仅供内部使用，但保持导出以防需要
export { VideoInteractionBar } from './ui/VideoInteractionBar';

// Context相关
export { VideoInteractionProvider, useVideoInteraction } from './hooks/VideoInteractionContext';