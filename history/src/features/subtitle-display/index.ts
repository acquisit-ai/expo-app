/**
 * 字幕显示功能模块
 *
 * 提供完整的字幕显示和导航功能，采用feature级Context架构
 * 只有IntegratedSubtitleView与外部entity耦合，其他组件通过Context解耦
 */

// Hooks 模块 - Context相关
export * from './hooks';

// 核心 Hook
export { useSubtitleDisplay, useSubtitleAtTime, useSubtitleAvailability } from './hooks/useSubtitleDisplay';

// UI 组件
export { SubtitleDisplay } from './ui/SubtitleDisplay';
export { SubtitleNavigationControls } from './ui/SubtitleNavigationControls';
export { IntegratedSubtitleView } from './ui/IntegratedSubtitleView';
export { default as ElementExplanationModal } from './ui/ElementExplanationModal';

// 类型定义
export type {
  SubtitleDisplayConfig,
  SubtitleDisplayState,
  SubtitleDisplayActions,
  SubtitleNavigationActions,
  SubtitleTokenKey,
  UseSubtitleDisplayReturn,
  SubtitleDisplayProps,
  SubtitleNavigationControlsProps,
  IntegratedSubtitleViewProps,
} from './model/types';

export { DEFAULT_SUBTITLE_CONFIG } from './model/types';
