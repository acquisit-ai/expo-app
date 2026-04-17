/**
 * 屏幕方向检测Hook
 * 使用 Expo 的原生屏幕方向库，采用最佳实践
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useMountedState } from './useMountedState';
import { useMultiTimer } from './useTimer';

export type Orientation = 'portrait' | 'landscape';

export interface OrientationDetectionConfig {
  /** 是否启用方向检测 */
  enabled?: boolean;
  /** 方向变化回调 */
  onOrientationChange?: (orientation: Orientation) => void;
  /** 进入横屏回调 */
  onEnterLandscape?: () => void;
  /** 进入竖屏回调 */
  onEnterPortrait?: () => void;
}

/**
 * 将 Expo 的方向枚举转换为简化的方向类型
 */
const mapExpoOrientationToSimple = (
  expoOrientation: ScreenOrientation.Orientation
): Orientation => {
  return expoOrientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
         expoOrientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
    ? 'portrait'
    : 'landscape';
};

/**
 * 屏幕方向检测Hook
 *
 * 基于 Expo 最佳实践：
 * 1. 使用原生 ScreenOrientation API 确保准确性
 * 2. 采用 useCallback 优化回调函数性能
 * 3. 使用 useRef 避免闭包陷阱
 * 4. 延迟执行回调避免渲染期间状态更新
 * 5. 妥善处理异步操作和错误边界
 * 6. 完整的timeout清理机制防止内存泄漏
 */
export const useOrientationDetection = ({
  enabled = true,
  onOrientationChange,
  onEnterLandscape,
  onEnterPortrait,
}: OrientationDetectionConfig = {}) => {
  const [currentOrientation, setCurrentOrientation] = useState<Orientation>('portrait');
  const isMounted = useMountedState();
  const { addTimer } = useMultiTimer();

  // 使用 useRef 避免回调函数的闭包问题
  const callbacksRef = useRef({
    onOrientationChange,
    onEnterLandscape,
    onEnterPortrait,
  });

  // 更新回调引用
  callbacksRef.current = {
    onOrientationChange,
    onEnterLandscape,
    onEnterPortrait,
  };

  // 触发方向变化回调的函数，使用 useCallback 优化性能
  const triggerOrientationCallbacks = useCallback((newOrientation: Orientation, prevOrientation: Orientation) => {
    if (newOrientation === prevOrientation) return;

    // 延迟执行回调，避免在渲染期间触发状态更新
    addTimer(() => {
      callbacksRef.current.onOrientationChange?.(newOrientation);

      if (newOrientation === 'landscape') {
        callbacksRef.current.onEnterLandscape?.();
      } else {
        callbacksRef.current.onEnterPortrait?.();
      }
    }, 0);
  }, [addTimer]);

  useEffect(() => {
    if (!enabled) return;

    let subscription: any = null;

    // 获取初始方向
    const initializeOrientation = async () => {
      try {
        const orientation = await ScreenOrientation.getOrientationAsync();
        if (isMounted()) {
          const simpleOrientation = mapExpoOrientationToSimple(orientation);
          setCurrentOrientation(simpleOrientation);
        }
      } catch (error) {
        console.warn('Failed to get initial orientation:', error);
        if (isMounted()) {
          setCurrentOrientation('portrait');
        }
      }
    };

    // 设置方向变化监听器
    const setupOrientationListener = () => {
      subscription = ScreenOrientation.addOrientationChangeListener((event) => {
        if (!enabled || !isMounted()) return;

        const newOrientation = mapExpoOrientationToSimple(event.orientationInfo.orientation);

        setCurrentOrientation(prevOrientation => {
          if (newOrientation !== prevOrientation) {
            triggerOrientationCallbacks(newOrientation, prevOrientation);
          }
          return newOrientation;
        });
      });
    };

    // 初始化
    initializeOrientation();
    setupOrientationListener();

    // 清理函数
    return () => {
      if (subscription) {
        ScreenOrientation.removeOrientationChangeListener(subscription);
      }

      // 定时器清理由 useMultiTimer 自动处理
    };
  }, [enabled, triggerOrientationCallbacks]);

  return {
    currentOrientation,
    isLandscape: currentOrientation === 'landscape',
    isPortrait: currentOrientation === 'portrait',
  };
};