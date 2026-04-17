/**
 * 视频控件动画系统Hook - 性能优化版
 * 分离动画逻辑以优化性能
 *
 * 🚀 性能优化：
 * - 使用 withDelay + withTiming 替代 setTimeout（UI线程）
 * - 减少 JS 线程定时器，避免播放时延迟
 * - 动画完全在 UI 线程执行
 */

import { useRef, useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withDelay, cancelAnimation } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { VideoDisplayMode } from '@/shared/types';

interface UseVideoAnimationOptions {
  displayMode: VideoDisplayMode;
  controlsVisible: boolean;
  isPlayingShared?: SharedValue<boolean>;
  smallScreenOpacity: SharedValue<number>;
}

interface UseVideoAnimationReturn {
  /** 容器动画样式 */
  animatedStyle: any;
  /** 快进回退动画控制 */
  seekFeedback: {
    forwardOpacity: SharedValue<number>;
    backwardOpacity: SharedValue<number>;
    triggerForward: () => void;
    triggerBackward: () => void;
  };
}

/**
 * 视频控件动画系统Hook
 *
 * 🚀 性能优化：
 * - 动画逻辑完全独立，减少组合Hook复杂度
 * - 最小化依赖，避免不必要的重计算
 * - 内存安全的定时器管理
 */
export function useVideoAnimation({
  displayMode,
  controlsVisible,
  smallScreenOpacity,
}: UseVideoAnimationOptions): UseVideoAnimationReturn {

  const isFullscreen = displayMode !== VideoDisplayMode.SMALL;

  // === 快进回退动画系统 - 性能优化版 ===
  // 🚀 性能优化：使用 useRef 确保 SharedValue 引用稳定
  const forwardOpacity = useRef(useSharedValue(0)).current;
  const backwardOpacity = useRef(useSharedValue(0)).current;

  // 🚀 优化：使用 Reanimated 动画替代 setTimeout（完全在UI线程执行）
  const triggerForward = useCallback(() => {
    'worklet';
    // 取消之前的动画
    cancelAnimation(forwardOpacity);
    // 立即显示
    forwardOpacity.value = 1;
    // 延迟550ms后淡出（UI线程）
    forwardOpacity.value = withDelay(550, withTiming(0, { duration: 120 }));
  }, [forwardOpacity]);

  const triggerBackward = useCallback(() => {
    'worklet';
    // 取消之前的动画
    cancelAnimation(backwardOpacity);
    // 立即显示
    backwardOpacity.value = 1;
    // 延迟550ms后淡出（UI线程）
    backwardOpacity.value = withDelay(550, withTiming(0, { duration: 120 }));
  }, [backwardOpacity]);

  // === 统一容器动画样式 ===
  const animatedStyle = useAnimatedStyle(() => {
    if (isFullscreen) {
      // 全屏模式：只使用自动隐藏状态
      return {
        opacity: withTiming(controlsVisible ? 1 : 0, { duration: 200 }),
      };
    } else {
      // 小屏模式：自动隐藏状态 AND 滚动感知状态
      const scrollOpacity = smallScreenOpacity.value;
      const finalOpacity = controlsVisible ? scrollOpacity : 0;
      return {
        opacity: withTiming(finalOpacity, { duration: 200 }),
      };
    }
  }, [isFullscreen, controlsVisible, smallScreenOpacity]);

  return {
    animatedStyle,
    seekFeedback: {
      forwardOpacity,
      backwardOpacity,
      triggerForward,
      triggerBackward,
    },
  };
}