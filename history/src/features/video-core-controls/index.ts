/**
 * Video Core Controls Feature
 * 统一的视频核心控制功能导出
 */

// 控制栏组件
export { VideoTopBar } from './ui/bars/VideoTopBar';
export { VideoBottomBar } from './ui/bars/VideoBottomBar';
export type { VideoBottomBarConfig } from './ui/bars/VideoBottomBar';

// Layout组件 - 完整的视频控制布局
export { SmallScreenLayout } from './ui/layouts/SmallScreenLayout';
export { FullscreenPortraitLayout } from './ui/layouts/FullscreenPortraitLayout';
export { FullscreenLandscapeLayout } from './ui/layouts/FullscreenLandscapeLayout';
export type { SmallScreenLayoutProps } from './ui/layouts/SmallScreenLayout';
export type { FullscreenPortraitLayoutProps } from './ui/layouts/FullscreenPortraitLayout';
export type { FullscreenLandscapeLayoutProps } from './ui/layouts/FullscreenLandscapeLayout';

// 基础架构组件
export { ControlBar } from './ui/shared/ControlBar';
export { ControlBarSection } from './ui/shared/ControlBarSection';
export { ControlGroup } from './ui/shared/ControlGroup';
export { AnimatedButton } from './ui/shared/AnimatedButton';

// 控制组件
export { PlayButton } from './ui/controls/PlayButton';
export { BackButton } from './ui/controls/BackButton';
export { FullscreenToggle } from './ui/controls/FullscreenToggle';
export { TimeDisplay } from './ui/controls/TimeDisplay';
export { ProgressBar } from './ui/controls/ProgressBar';

// Hooks
export { useVideoTimeSync } from './hooks/useVideoTimeSync';
export type { UseVideoTimeSyncOptions, UseVideoTimeSyncReturn } from './hooks/useVideoTimeSync';

// Context and Provider - 独立使用的核心
export {
  VideoCoreControlsProvider,
  useVideoCoreControls
} from './hooks/VideoCoreControlsContext';
export type {
  VideoCoreControlsContextValue,
  VideoCoreControlsProviderProps
} from './hooks/VideoCoreControlsContext';

// 类型定义
export type {
  ControlSize,
  ControlPosition,
  ControlLayout,
  ControlAlign,
  BaseControlProps,
  ControlBarProps,
  ControlBarSectionProps,
  ControlGroupProps,
  PlayButtonProps,
  ProgressBarProps,
  FullscreenToggleProps,
  BackButtonProps,
  TimeDisplayProps,
  VideoTopBarProps,
  VideoBottomBarProps,
} from './model/types';

// 常量
export {
  CONTROL_DIMENSIONS,
  GRADIENT_COLORS,
  ANIMATION_DURATIONS,
  getButtonDimensions,
  getBarDimensions,
  getProgressDimensions,
  getProgressBarDimensions,
  getTimeTextDimensions,
  getSpacing,
} from './model/constants';