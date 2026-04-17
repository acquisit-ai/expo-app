/**
 * Video Gestures - Long Press Hook
 * 长按手势处理Hook
 */

import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { log, LogType } from '@/shared/lib/logger';
import { adjustGestureParams } from '../utils/screenUtils';
import type { ScreenContext } from '../../model/types';

interface UseLongPressGestureOptions {
  /** 长按回调 */
  onLongPress?: () => void;
  /** 最小持续时间 */
  minDuration?: number;
  /** 最大移动距离 */
  maxDistance?: number;
  /** 防抖延迟 */
  debounceDelay?: number;
  /** 屏幕上下文 */
  screenContext?: ScreenContext;
  /** 是否启用日志 */
  enableLogging?: boolean;
}

/**
 * 长按手势Hook
 */
export function useLongPressGesture({
  onLongPress,
  minDuration = 500,
  maxDistance = 20,
  debounceDelay = 500,
  screenContext,
  enableLogging = false,
}: UseLongPressGestureOptions) {
  // 根据屏幕密度调整参数
  const adjustedParams = useMemo(() => {
    if (!screenContext?.pixelDensity) {
      return { maxDistance };
    }

    return adjustGestureParams(
      { maxDistance },
      screenContext.pixelDensity
    );
  }, [maxDistance, screenContext?.pixelDensity]);

  // 防抖处理的长按回调
  const debouncedLongPress = useDebounce(() => {
    if (enableLogging) {
      log('video-gestures', LogType.DEBUG, 'Long press triggered');
    }
    onLongPress?.();
  }, debounceDelay);

  // 创建长按手势
  const longPressGesture = useMemo(() => {
    return Gesture.LongPress()
      .minDuration(minDuration)
      .maxDistance(adjustedParams.maxDistance)
      .onStart(() => {
        'worklet';
        if (onLongPress) {
          runOnJS(debouncedLongPress)();
        }
      });
  }, [minDuration, adjustedParams.maxDistance, debouncedLongPress, onLongPress]);

  return longPressGesture;
}