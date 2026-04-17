/**
 * 视频播放器功能特定常量
 *
 * 这些常量专门用于视频播放器功能，包含业务特定的配置
 */

import { Easing } from 'react-native-reanimated';
import { LAYOUT_CONSTANTS } from '@/shared/config/layout-constants';

/**
 * 视频播放器布局常量
 */
export const VIDEO_PLAYER_LAYOUT = {
  /** 视频高度 (16:9 比例) - 使用全局常量 */
  VIDEO_HEIGHT: LAYOUT_CONSTANTS.VIDEO_HEIGHT,
  /** 播放按钮尺寸 */
  PLAY_BUTTON_SIZE: 60,
  /** 控制栏高度 - 使用全局常量 */
  CONTROL_BAR_HEIGHT: LAYOUT_CONSTANTS.CONTROL_BAR_HEIGHT,
  /** 最小视频高度 */
  MIN_VIDEO_HEIGHT: 64,
  /** 播放指示器位置 */
  PLAYING_INDICATOR_OFFSET: {
    top: 20,
    right: 20,
  },
} as const;

/**
 * 视频播放器动画常量
 */
export const VIDEO_PLAYER_ANIMATION = {
  /** 动画持续时间 (毫秒) */
  DURATION: 300,
  /** 动画缓动函数 */
  EASING: Easing.out(Easing.cubic),
  /** 最大滚动距离 */
  MAX_SCROLL: VIDEO_PLAYER_LAYOUT.VIDEO_HEIGHT - VIDEO_PLAYER_LAYOUT.MIN_VIDEO_HEIGHT,
} as const;

/**
 * 视频播放器交互常量
 */
export const VIDEO_PLAYER_INTERACTION = {
  /** 动作按钮图标尺寸 */
  ACTION_ICON_SIZE: 22,
  /** 播放按钮图标尺寸 */
  PLAY_ICON_SIZE: 30,
  /** 返回按钮图标尺寸 */
  BACK_BUTTON_SIZE: 32,
  /** 控制层自动隐藏时间(毫秒) */
  CONTROLS_TIMEOUT: 3000,
  /** 时间更新间隔配置(秒) */
  TIME_UPDATE_INTERVAL: {
    /** 播放时的更新间隔 */
    PLAYING: 0.3,
    /** 后台或暂停时的更新间隔 */
    BACKGROUND_OR_PAUSED: 1.0,
    /** 拖拽进度条时的高频更新 */
    SCRUBBING: 0.1,
  },
  /** 返回按钮位置 */
  BACK_BUTTON_POSITION: {
    top: 7,
    left: 16,
  },
  /** 返回按钮动画显示范围 */
  BACK_BUTTON_ANIMATION: {
    showStart: 0.6,  // 滚动进度60%开始显示
    showEnd: 0.9,    // 滚动进度90%完全显示
  },
  /** 按钮颜色 */
  BUTTON_COLORS: {
    /** 透明白色 (70%透明度) */
    WHITE_TRANSPARENT: 'rgba(255, 255, 255, 0.75)',
    /** 半透明白色 (65%透明度) */
    WHITE_SEMI_TRANSPARENT: 'rgba(255, 255, 255, 0.65)',
  },
} as const;

/**
 * 视频播放器动画预设
 */
export const VIDEO_PLAYER_ANIMATION_PRESETS = {
  /** 播放过渡动画 */
  playTransition: {
    duration: VIDEO_PLAYER_ANIMATION.DURATION,
    easing: VIDEO_PLAYER_ANIMATION.EASING,
  },
  /** 暂停过渡动画 */
  pauseTransition: {
    duration: VIDEO_PLAYER_ANIMATION.DURATION,
    easing: VIDEO_PLAYER_ANIMATION.EASING,
  },
  /** 视频展开动画 */
  videoExpand: {
    duration: VIDEO_PLAYER_ANIMATION.DURATION,
    easing: VIDEO_PLAYER_ANIMATION.EASING,
  },
} as const;

/**
 * 计算得出的视频播放器常量
 */
export const VIDEO_PLAYER_DERIVED = {
  /** 占位区域高度 (视频 + 控制栏) */
  PLACEHOLDER_HEIGHT: VIDEO_PLAYER_LAYOUT.VIDEO_HEIGHT + VIDEO_PLAYER_LAYOUT.CONTROL_BAR_HEIGHT,
} as const;

/**
 * 视频播放器常量统一导出
 */
export const VIDEO_PLAYER_CONSTANTS = {
  LAYOUT: VIDEO_PLAYER_LAYOUT,
  ANIMATION: VIDEO_PLAYER_ANIMATION,
  INTERACTION: VIDEO_PLAYER_INTERACTION,
  PRESETS: VIDEO_PLAYER_ANIMATION_PRESETS,
  DERIVED: VIDEO_PLAYER_DERIVED,
} as const;

/**
 * 类型定义
 */
export type VideoPlayerLayoutConstants = typeof VIDEO_PLAYER_LAYOUT;
export type VideoPlayerAnimationConstants = typeof VIDEO_PLAYER_ANIMATION;
export type VideoPlayerInteractionConstants = typeof VIDEO_PLAYER_INTERACTION;
export type VideoPlayerAnimationPresets = typeof VIDEO_PLAYER_ANIMATION_PRESETS;