/**
 * Video Gestures - Single Tap Hook
 * 单击手势处理Hook
 */

import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { log, LogType } from '@/shared/lib/logger';
import { adjustGestureParams } from '../utils/screenUtils';
import type { ScreenContext } from '../../model/types';

interface UseTapGestureOptions {
  /** 点击回调 */
  onTap?: () => void;
  /** 最大移动距离 */
  maxDeltaX?: number;
  maxDeltaY?: number;
  /** 防抖延迟 */
  debounceDelay?: number;
  /** 屏幕上下文 */
  screenContext?: ScreenContext;
  /** 是否启用日志 */
  enableLogging?: boolean;
}

/**
 * 单击手势Hook
 */
export function useTapGesture({
  onTap,
  maxDeltaX = 10,
  maxDeltaY = 10,
  debounceDelay = 100,
  screenContext,
  enableLogging = false,
}: UseTapGestureOptions) {
  // 根据屏幕密度调整参数
  const adjustedParams = useMemo(() => {
    if (!screenContext?.pixelDensity) {
      return { maxDeltaX, maxDeltaY };
    }

    return adjustGestureParams(
      { maxDeltaX, maxDeltaY },
      screenContext.pixelDensity
    );
  }, [maxDeltaX, maxDeltaY, screenContext?.pixelDensity]);

  // 防抖处理的点击回调
  const debouncedTap = useDebounce(() => {
    if (enableLogging) {
      log('video-gestures', LogType.DEBUG, 'Single tap triggered');
    }
    onTap?.();
  }, debounceDelay);

  // 创建单击手势
  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .numberOfTaps(1)
      .maxDeltaX(adjustedParams.maxDeltaX)
      .maxDeltaY(adjustedParams.maxDeltaY)
      .onStart(() => {
        'worklet';
        if (onTap) {
          runOnJS(debouncedTap)();
        }
      });
  }, [adjustedParams.maxDeltaX, adjustedParams.maxDeltaY, debouncedTap, onTap]);

  return tapGesture;
}