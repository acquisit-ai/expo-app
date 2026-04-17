/**
 * 全局布局常量
 *
 * 用于跨 feature 的布局一致性，避免 feature 之间直接依赖
 * 这些常量定义了应用级别的通用布局规则
 */

import { Dimensions } from 'react-native';

/**
 * 全局布局常量
 */
export const LAYOUT_CONSTANTS = {
  /**
   * 视频控制栏高度
   * 用于视频播放器控制栏和交互栏的统一高度
   */
  CONTROL_BAR_HEIGHT: 42,

  /**
   * 标准视频播放器高度 (16:9 比例)
   * 基于屏幕宽度计算
   */
  VIDEO_HEIGHT: Dimensions.get('window').width * 9 / 16,
} as const;

/**
 * 类型定义
 */
export type LayoutConstants = typeof LAYOUT_CONSTANTS;
