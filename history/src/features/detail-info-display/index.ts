/**
 * 视频信息展示功能模块统一导出
 * 专注于视频信息展示，不包含交互功能
 */

// UI组件 - 对外暴露完整的Feature组件
export { VideoInfoDisplaySection } from './ui/VideoInfoDisplaySection';

// 子组件 - 仅供内部使用，但保持导出以防需要
export { VideoInfoSection } from './ui/VideoInfoSection';

// Context相关
export { VideoInfoDisplayProvider, useVideoInfoDisplay } from './hooks/VideoInfoDisplayContext';

// 注意：直接使用 @/shared/types 中的 VideoMetaData，不需要额外的类型导出