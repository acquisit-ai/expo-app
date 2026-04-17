/**
 * Video Gestures - Main Hook
 * 视频手势主Hook，整合所有手势功能
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
// 注意：动画相关导入已移除
import * as Haptics from 'expo-haptics';
import { useMountedState } from '@/shared/hooks/useMountedState';
import { useEventSubscription } from '@/shared/hooks/useEventSubscription';
import { useSingleTimer } from '@/shared/hooks';
import { log, LogType } from '@/shared/lib/logger';
import { Dimensions } from 'react-native';

import { getCurrentScreenContext } from '../utils/screenUtils';
import { mergeGestureConfig, GESTURE_CONSTANTS } from '../../model/config';
import { useTapGesture } from './useTapGesture';
import { useDoubleTapGesture } from './useDoubleTapGesture';
import { useLongPressGesture } from './useLongPressGesture';

import type {
  UseVideoGesturesOptions,
  UseVideoGesturesReturn,
  VideoGestureConfig,
  ScreenContext,
  GestureEvent,
} from '../../model/types';
import { GestureType } from '../../model/types';

/**
 * 视频手势主Hook
 *
 * 整合所有手势功能，提供统一的手势处理接口
 */
export function useVideoGestures({
  callbacks,
  config: userConfig,
  screenContext: userScreenContext,
  enabled = true,
}: UseVideoGesturesOptions): UseVideoGesturesReturn {
  // 组件挂载状态跟踪
  const isMounted = useMountedState();

  // 🚀 性能优化：使用ref存储callbacks，避免wrappedCallbacks重建
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // 合并配置
  const config = useMemo(
    () => mergeGestureConfig(userConfig),
    [userConfig]
  );

  // 屏幕上下文状态
  const [screenContext, setScreenContext] = useState<ScreenContext>(
    userScreenContext || getCurrentScreenContext()
  );

  // 监听屏幕尺寸变化
  useEventSubscription(
    Dimensions,
    'change',
    ({ window }) => {
      if (!isMounted()) return;

      const newContext = {
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
        pixelDensity: window.width / 360,
      };

      setScreenContext(newContext);

      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, `Screen context updated: ${window.width}x${window.height}`);
      }
    },
    [config.debug?.logging, isMounted]
  );

  // 当前手势事件状态
  const [currentGesture, setCurrentGesture] = useState<GestureEvent | null>(null);

  // 使用通用 timer hook
  const { setTimer } = useSingleTimer();

  // 注意：反馈状态和动画已移除，由使用方自行实现

  // 创建手势事件
  const createGestureEvent = useCallback((type: GestureType, x: number = 0, y: number = 0): GestureEvent => ({
    type,
    timestamp: Date.now(),
    position: { x, y },
  }), []);

  // 注意：触发反馈函数已移除，视觉反馈由使用方自行实现

  // 触觉反馈
  const triggerHapticFeedback = useCallback(() => {
    if (config.feedback?.haptic) {
      Haptics.selectionAsync();
    }
  }, [config.feedback?.haptic]);

  // 包装回调函数，添加反馈和日志
  // 🚀 性能优化：从ref读取callbacks，避免依赖变化导致重建
  const wrappedCallbacks = useMemo(() => ({
    onSingleTap: () => {
      const event = createGestureEvent(GestureType.SINGLE_TAP);
      setCurrentGesture(event);

      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, 'Single tap executed');
      }

      triggerHapticFeedback();
      callbacksRef.current.onSingleTap?.();
    },

    onDoubleTapLeft: () => {
      const event = createGestureEvent(GestureType.DOUBLE_TAP_LEFT);
      setCurrentGesture(event);

      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, 'Double tap left executed');
      }

      triggerHapticFeedback();
      // 视觉反馈由使用方处理
      callbacksRef.current.onDoubleTapLeft?.();
    },

    onDoubleTapRight: () => {
      const event = createGestureEvent(GestureType.DOUBLE_TAP_RIGHT);
      setCurrentGesture(event);

      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, 'Double tap right executed');
      }

      triggerHapticFeedback();
      // 视觉反馈由使用方处理
      callbacksRef.current.onDoubleTapRight?.();
    },

    onDoubleTapCenter: () => {
      // 中间区域双击可以复用单击逻辑
      callbacksRef.current.onSingleTap?.();
    },

    onLongPress: () => {
      const event = createGestureEvent(GestureType.LONG_PRESS);
      setCurrentGesture(event);

      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, 'Long press executed');
      }

      triggerHapticFeedback();
      callbacksRef.current.onLongPress?.();
    },
  }), [
    createGestureEvent,
    config.debug?.logging,
    triggerHapticFeedback,
  ]);

  // 创建各种手势
  const singleTapGesture = useTapGesture({
    onTap: wrappedCallbacks.onSingleTap,
    maxDeltaX: config.recognition?.maxMovement,
    maxDeltaY: config.recognition?.maxMovement,
    debounceDelay: config.recognition?.singleTapDelay,
    screenContext,
    enableLogging: config.debug?.logging,
  });

  const doubleTapGesture = useDoubleTapGesture({
    onDoubleTapLeft: wrappedCallbacks.onDoubleTapLeft,
    onDoubleTapRight: wrappedCallbacks.onDoubleTapRight,
    onDoubleTapCenter: wrappedCallbacks.onDoubleTapCenter,
    maxDuration: config.recognition?.doubleTapMaxDelay,
    maxDeltaX: config.recognition?.maxMovement,
    maxDeltaY: config.recognition?.maxMovement,
    leftZoneRatio: config.zones?.leftZoneRatio,
    rightZoneRatio: config.zones?.rightZoneRatio,
    screenContext,
    enableLogging: config.debug?.logging,
  });

  const longPressGesture = useLongPressGesture({
    onLongPress: wrappedCallbacks.onLongPress,
    minDuration: config.recognition?.longPressMinDuration,
    maxDistance: config.recognition?.maxMovement,
    screenContext,
    enableLogging: config.debug?.logging,
  });

  // 组合手势：长按与点击并行，双击优先于单击
  const gestureHandler = useMemo(() => {
    if (!enabled) {
      return Gesture.Tap().enabled(false);
    }

    return Gesture.Simultaneous(
      longPressGesture,
      Gesture.Exclusive(doubleTapGesture, singleTapGesture)
    );
  }, [enabled, longPressGesture, doubleTapGesture, singleTapGesture]);

  // 控制方法
  const controls = useMemo(() => ({
    enable: () => {
      // 手势启用逻辑
      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, 'Gestures enabled');
      }
    },
    disable: () => {
      // 手势禁用逻辑
      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, 'Gestures disabled');
      }
    },
    updateConfig: (newConfig: Partial<VideoGestureConfig>) => {
      // 配置更新逻辑（在实际使用中可能需要状态管理）
      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, `Gesture config updated: ${JSON.stringify(newConfig)}`);
      }
    },
    resetConfig: () => {
      // 重置为默认配置
      if (config.debug?.logging) {
        log('video-gestures', LogType.DEBUG, 'Gesture config reset to default');
      }
    },
    getState: () => ({
      enabled,
      config,
    }),
  }), [config, enabled]);

  // 清理当前手势事件
  useEffect(() => {
    if (currentGesture) {
      setTimer(() => {
        if (isMounted()) {
          setCurrentGesture(null);
        }
      }, 1000); // 1秒后清理
    }
  }, [currentGesture, isMounted, setTimer]);

  return {
    gestureHandler,
    controls,
    currentGesture,
  };
}