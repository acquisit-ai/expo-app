/**
 * 控件可见性计算 Hook
 * 统一管理所有策略组件的显示逻辑，避免重复代码
 */

import { useRef } from 'react';
import { useDerivedValue, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface UseControlsVisibilityOptions {
  /** 滚动位置SharedValue */
  scrollY?: SharedValue<number>;
  /** 回退可见性状态 */
  fallbackVisible?: boolean;
  /** 可见性变化回调 */
  onVisibilityChange?: (isVisible: boolean) => void;
  /** 动画持续时间 */
  animationDuration?: number;
  /** 播放状态 SharedValue - 从外部传入 */
  isPlayingShared: SharedValue<boolean>;
}

/**
 * 滚动感知的控件可见性管理 Hook
 *
 * 新设计：只负责滚动相关的可见性判断，不依赖自动隐藏状态
 * 核心逻辑：scrollY <= 10 || isPlaying
 * - 视频未被压缩或正在播放时允许显示
 * - 返回 0-1 的透明度值，由外层结合自动隐藏状态
 */
export const useScrollAwareVisibility = ({
  scrollY,
  fallbackVisible = true,
  onVisibilityChange,
  animationDuration = 300,
  isPlayingShared,
}: UseControlsVisibilityOptions) => {
  // 🚀 性能优化：使用 useRef 确保 SharedValue 引用稳定
  const opacity = useRef(useSharedValue(1)).current;

  // 计算滚动感知的可见性（独立于自动隐藏逻辑）
  const shouldShow = useDerivedValue(() => {
    if (!scrollY) {
      // 没有滚动位置时，回退到基础状态
      return fallbackVisible;
    }

    const notCompressed = scrollY.value <= 10; // 放宽阈值，提升用户体验
    const isCurrentlyPlaying = isPlayingShared.value;

    // 核心逻辑：未压缩 或 正在播放时允许显示
    return notCompressed || isCurrentlyPlaying;
  }, [scrollY, isPlayingShared, fallbackVisible]);

  // 处理动画和状态回调
  useDerivedValue(() => {
    const visible = shouldShow.value;

    // 更新动画
    opacity.value = withTiming(visible ? 1 : 0, { duration: animationDuration });

    // 安全地调用状态变化回调
    if (onVisibilityChange) {
      runOnJS(onVisibilityChange)(visible);
    }

    return visible;
  }, [shouldShow, animationDuration]);

  return {
    /** 控件是否应该显示 */
    shouldShow,
    /** 动画透明度 SharedValue */
    opacity,
  };
};