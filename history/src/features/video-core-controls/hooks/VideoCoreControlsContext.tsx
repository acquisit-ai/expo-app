/**
 * Video Core Controls Context
 * 独立的feature级别Context，集成useVideoTimeSync Hook
 *
 * 设计原则：
 * - 完全独立：不依赖外部Context
 * - Hook集成：在Context级别使用useVideoTimeSync
 * - 简洁API：统一的数据和状态管理
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useVideoTimeSync } from './useVideoTimeSync';
import type { ControlSize } from '../model/types';

/**
 * Context数据接口
 */
export interface VideoCoreControlsContextValue {
  // === 核心时间和播放控制 ===
  displayTime: number;
  isDragging: boolean;
  isSeeking: boolean;
  isPlaying: boolean;
  onPlayToggle?: () => void;
  bufferedTime: number;
  duration: number;

  // === UI配置 ===
  size: ControlSize;
  isFullscreen: boolean;

  // === 进度控制（Hook提供的统一接口） ===
  progressHandlers: {
    onDragStart: () => void;
    onDragUpdate: (value: number) => void;
    onDragEnd: (value: number) => void;
  };

  // === 导航控制 ===
  onBack?: () => void;
  showBackButton?: boolean;

  // === 全屏和基础控制 ===
  onToggleFullscreen?: () => void;
  onInteraction?: () => void;

  // === 社交功能（全屏模式） ===
  isLiked?: boolean;
  isFavorited?: boolean;
  onToggleLike?: () => void;
  onToggleFavorite?: () => void;

  // === 内容功能（全屏模式） ===
  showSubtitles?: boolean;
  showTranslation?: boolean;
  onToggleSubtitles?: () => void;
  onToggleTranslation?: () => void;

  // === 显示控制 ===
  controlsVisible?: boolean;

  // === 样式和主题 ===
  overlayStyles?: any; // 临时类型，后续优化
  iconSize?: number;
  playbackControlsOpacity?: number; // 播放控件透明度（0-1）
  playbackControlsPointerEvents?: 'auto' | 'none'; // 播放控件交互控制
}

/**
 * Provider属性接口
 */
export interface VideoCoreControlsProviderProps {
  children: ReactNode;

  // === 必需的数据 ===
  currentTime: number;
  duration: number;
  isPlaying: boolean;

  // === 可选的基础数据 ===
  bufferedTime?: number;
  isFullscreen?: boolean;
  size?: ControlSize;

  // === 基础回调函数 ===
  onSeek?: (time: number) => void;
  onPlayToggle?: () => void;
  onToggleFullscreen?: () => void;
  onInteraction?: () => void;
  onProgressInteraction?: () => void;

  // === 导航控制 ===
  onBack?: () => void;
  showBackButton?: boolean;

  // === 社交功能 ===
  isLiked?: boolean;
  isFavorited?: boolean;
  onToggleLike?: () => void;
  onToggleFavorite?: () => void;

  // === 内容功能 ===
  showSubtitles?: boolean;
  showTranslation?: boolean;
  onToggleSubtitles?: () => void;
  onToggleTranslation?: () => void;

  // === 显示控制 ===
  controlsVisible?: boolean;

  // === 样式配置 ===
  overlayStyles?: any;
  iconSize?: number;
  playbackControlsOpacity?: number;
  playbackControlsPointerEvents?: 'auto' | 'none';

  // === Hook选项 ===
  seekingTolerance?: number;
  seekingTimeout?: number;
}

// Context创建
const VideoCoreControlsContext = createContext<VideoCoreControlsContextValue | null>(null);

/**
 * VideoCoreControls Provider
 * 在Context级别集成useVideoTimeSync Hook
 */
export const VideoCoreControlsProvider: React.FC<VideoCoreControlsProviderProps> = ({
  children,
  // 必需属性
  currentTime,
  duration,
  isPlaying,
  // 基础可选属性
  bufferedTime = 0,
  isFullscreen = false,
  size = 'medium',
  // 基础回调
  onSeek,
  onPlayToggle,
  onToggleFullscreen,
  onInteraction,
  onProgressInteraction,
  // 导航控制
  onBack,
  showBackButton = true,
  // 社交功能
  isLiked = false,
  isFavorited = false,
  onToggleLike,
  onToggleFavorite,
  // 内容功能
  showSubtitles = false,
  showTranslation = false,
  onToggleSubtitles,
  onToggleTranslation,
  // 自动隐藏
  controlsVisible = true,
  // 样式配置
  overlayStyles,
  iconSize = 24,
  playbackControlsOpacity = 1,
  playbackControlsPointerEvents = 'auto',
  // Hook选项
  seekingTolerance,
  seekingTimeout,
}) => {
  // 在Context级别使用useVideoTimeSync Hook
  const timeSync = useVideoTimeSync({
    currentTime,
    duration,
    onSeek,
    onInteraction: onProgressInteraction,
    seekingTolerance,
    seekingTimeout,
  });

  const value = useMemo(() => ({
    // === 核心时间和播放控制 ===
    displayTime: timeSync.displayTime,
    isDragging: timeSync.isDragging,
    isSeeking: timeSync.isSeeking,
    isPlaying,
    onPlayToggle,
    bufferedTime,
    duration,

    // === UI配置 ===
    size,
    isFullscreen,

    // === 进度控制（Hook提供的统一接口） ===
    progressHandlers: timeSync.progressHandlers,

    // === 导航控制 ===
    onBack,
    showBackButton,

    // === 全屏和基础控制 ===
    onToggleFullscreen,
    onInteraction,

    // === 社交功能（全屏模式） ===
    isLiked,
    isFavorited,
    onToggleLike,
    onToggleFavorite,

    // === 内容功能（全屏模式） ===
    showSubtitles,
    showTranslation,
    onToggleSubtitles,
    onToggleTranslation,

    // === 显示控制 ===
    controlsVisible,

    // === 样式和主题 ===
    overlayStyles,
    iconSize,
    playbackControlsOpacity,
    playbackControlsPointerEvents,
  }), [
    // 时间同步相关
    timeSync.displayTime,
    timeSync.isDragging,
    timeSync.isSeeking,
    timeSync.progressHandlers,
    // 基础状态
    isPlaying,
    onPlayToggle,
    bufferedTime,
    duration,
    size,
    isFullscreen,
    // 控制回调
    onBack,
    showBackButton,
    onToggleFullscreen,
    onInteraction,
    // 社交功能
    isLiked,
    isFavorited,
    onToggleLike,
    onToggleFavorite,
    // 内容功能
    showSubtitles,
    showTranslation,
    onToggleSubtitles,
    onToggleTranslation,
    // 自动隐藏
    controlsVisible,
    // 样式配置
    overlayStyles,
    iconSize,
    playbackControlsOpacity,
    playbackControlsPointerEvents,
  ]);

  return (
    <VideoCoreControlsContext.Provider value={value}>
      {children}
    </VideoCoreControlsContext.Provider>
  );
};

/**
 * Hook for accessing VideoCoreControls context
 */
export const useVideoCoreControls = (): VideoCoreControlsContextValue => {
  const context = useContext(VideoCoreControlsContext);
  if (!context) {
    throw new Error('useVideoCoreControls must be used within a VideoCoreControlsProvider');
  }
  return context;
};