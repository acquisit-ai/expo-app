/**
 * 按钮动画Hook
 * 提供通用的按钮出现/消失动画效果
 */

import { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';
import { VIDEO_PLAYER_CONSTANTS } from '../model/constants';

const { ANIMATION, INTERACTION } = VIDEO_PLAYER_CONSTANTS;
const { BACK_BUTTON_ANIMATION } = INTERACTION;

/**
 * 按钮动画配置
 */
export interface ButtonAnimationConfig {
  /** 动画开始的进度值 (0-1) */
  showStart?: number;
  /** 动画结束的进度值 (0-1) */
  showEnd?: number;
  /** 最小缩放值 */
  minScale?: number;
  /** 最大缩放值 */
  maxScale?: number;
  /** 最小透明度 */
  minOpacity?: number;
  /** 最大透明度 */
  maxOpacity?: number;
}

/**
 * 使用按钮动画Hook
 *
 * @param effectiveScrollY - 有效滚动位置的SharedValue
 * @param config - 动画配置
 * @returns 动画样式
 */
export function useButtonAnimation(
  effectiveScrollY: SharedValue<number>,
  config: ButtonAnimationConfig = {}
) {
  const {
    showStart = BACK_BUTTON_ANIMATION.showStart,
    showEnd = BACK_BUTTON_ANIMATION.showEnd,
    minScale = 0.8,
    maxScale = 1,
    minOpacity = 0,
    maxOpacity = 1,
  } = config;

  return useAnimatedStyle(() => {
    const progress = Math.min(effectiveScrollY.value / ANIMATION.MAX_SCROLL, 1);

    const opacity = interpolate(
      progress,
      [showStart, showEnd],
      [minOpacity, maxOpacity],
      'clamp'
    );

    const scale = interpolate(
      progress,
      [showStart, showEnd],
      [minScale, maxScale],
      'clamp'
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });
}