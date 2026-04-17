/**
 * Video Gestures Feature - Configuration Constants
 * 视频手势功能的配置常量
 */

import type { VideoGestureConfig } from './types';

/**
 * 默认手势配置常量
 */
export const GESTURE_CONSTANTS = {
  /** 快进/回退秒数 */
  SEEK_SECONDS: 5,

  /** 防抖延迟（ms） */
  DEBOUNCE_DELAY: 100,

  /** 长按防抖延迟（ms） */
  LONG_PRESS_DEBOUNCE_DELAY: 500,

  // 注意：动画相关常量已移除
} as const;

/**
 * 默认手势识别参数
 */
export const DEFAULT_RECOGNITION_CONFIG = {
  /** 单击延迟 */
  singleTapDelay: 100,

  /** 双击最大间隔 */
  doubleTapMaxDelay: 250,

  /** 长按最小持续时间 */
  longPressMinDuration: 500,

  /** 滑动最小速度 */
  swipeMinVelocity: 100,

  /** 滑动最小距离 */
  swipeMinDistance: 50,

  /** 手势最大移动距离 */
  maxMovement: 20,
} as const;

/**
 * 默认区域配置
 */
export const DEFAULT_ZONE_CONFIG = {
  /** 左侧区域占比 */
  leftZoneRatio: 0.4,

  /** 右侧区域占比 */
  rightZoneRatio: 0.4,

  /** 中间死区占比 */
  centerDeadZone: 0.2,
} as const;

/**
 * 默认反馈配置
 */
export const DEFAULT_FEEDBACK_CONFIG = {
  /** 触觉反馈 */
  haptic: true,
} as const;

/**
 * 默认调试配置
 */
export const DEFAULT_DEBUG_CONFIG = {
  /** 日志记录 */
  logging: false,

  /** 显示手势区域 */
  showZones: false,

  /** 显示手势轨迹 */
  showTrail: false,
} as const;

/**
 * 获取默认手势配置
 */
export function getDefaultGestureConfig(): VideoGestureConfig {
  return {
    recognition: { ...DEFAULT_RECOGNITION_CONFIG },
    zones: { ...DEFAULT_ZONE_CONFIG },
    feedback: { ...DEFAULT_FEEDBACK_CONFIG },
    debug: { ...DEFAULT_DEBUG_CONFIG },
  };
}

/**
 * 合并手势配置
 * @param custom - 自定义配置
 * @returns 合并后的配置
 */
export function mergeGestureConfig(
  custom?: Partial<VideoGestureConfig>
): VideoGestureConfig {
  const defaultConfig = getDefaultGestureConfig();

  if (!custom) {
    return defaultConfig;
  }

  return {
    recognition: {
      ...defaultConfig.recognition,
      ...custom.recognition,
    },
    zones: {
      ...defaultConfig.zones,
      ...custom.zones,
    },
    feedback: {
      ...defaultConfig.feedback,
      ...custom.feedback,
    },
    debug: {
      ...defaultConfig.debug,
      ...custom.debug,
    },
  };
}

/**
 * 根据屏幕密度调整手势参数
 * @param baseValue - 基础值
 * @param screenDensity - 屏幕密度倍数
 * @returns 调整后的值
 */
export function adjustForScreenDensity(
  baseValue: number,
  screenDensity: number = 1
): number {
  // 限制密度范围在 0.5 到 3 之间
  const safeDensity = Math.max(0.5, Math.min(3, screenDensity));
  return Math.round(baseValue * safeDensity);
}

/**
 * 计算屏幕密度倍数
 * @param screenWidth - 屏幕宽度
 * @param baseWidth - 基准宽度（默认360）
 * @returns 密度倍数
 */
export function calculateScreenDensity(
  screenWidth: number,
  baseWidth: number = 360
): number {
  // 防止极端情况
  const safeWidth = Math.max(screenWidth, 200);
  return safeWidth / baseWidth;
}