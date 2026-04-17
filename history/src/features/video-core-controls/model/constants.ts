/**
 * Video Core Controls - 常量定义
 * 统一的尺寸和样式常量
 */

import type { ControlSize } from './types';

/**
 * 统一的控制尺寸定义
 */
export const CONTROL_DIMENSIONS = {
  BUTTON: {
    small: { width: 32, height: 32, iconSize: 20 },
    medium: { width: 40, height: 40, iconSize: 24 },
    large: { width: 48, height: 48, iconSize: 28 },
  },
  BAR: {
    small: { height: 48, padding: 8, verticalPadding: 4 },
    medium: { height: 64, padding: 12, verticalPadding: 6 },
    large: { height: 80, padding: 16, verticalPadding: 8 },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  PROGRESS: {
    small: { height: 32, sliderHeight: 4, paddingVertical: 14 },
    medium: { height: 40, sliderHeight: 6, paddingVertical: 17 },
    large: { height: 48, sliderHeight: 8, paddingVertical: 20 },
  },
  TIME_TEXT: {
    small: { fontSize: 12, minWidth: 32 },
    medium: { fontSize: 13, minWidth: 36 },
    large: { fontSize: 14, minWidth: 40 },
  },
} as const;

/**
 * 获取按钮尺寸
 */
export const getButtonDimensions = (size: ControlSize) => CONTROL_DIMENSIONS.BUTTON[size];

/**
 * 获取控制栏尺寸
 */
export const getBarDimensions = (size: ControlSize) => CONTROL_DIMENSIONS.BAR[size];

/**
 * 获取进度条尺寸
 */
export const getProgressDimensions = (size: ControlSize) => CONTROL_DIMENSIONS.PROGRESS[size];

/**
 * 获取进度条尺寸（别名，保持一致性）
 */
export const getProgressBarDimensions = getProgressDimensions;

/**
 * 获取时间文本尺寸
 */
export const getTimeTextDimensions = (size: ControlSize) => CONTROL_DIMENSIONS.TIME_TEXT[size];

/**
 * 获取间距值
 */
export const getSpacing = (spacing: keyof typeof CONTROL_DIMENSIONS.SPACING) =>
  CONTROL_DIMENSIONS.SPACING[spacing];

/**
 * 渐变色配置
 */
export const GRADIENT_COLORS = {
  top: ['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0)'],
  bottom: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)'],
  floating: ['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.4)'],
  none: ['transparent', 'transparent'],
} as const;

/**
 * 动画时长配置
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;