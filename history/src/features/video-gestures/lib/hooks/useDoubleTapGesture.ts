/**
 * Video Gestures - Double Tap Hook - 性能优化版
 * 双击手势处理Hook
 *
 * 🚀 性能优化：
 * - 移除 useDebounce（不必要的延迟）
 * - 双击手势本身已经有识别延迟保护
 */

import { useMemo, useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { log, LogType } from '@/shared/lib/logger';
import { adjustGestureParams, getGestureZone } from '../utils/screenUtils';
import type { ScreenContext } from '../../model/types';

interface UseDoubleTapGestureOptions {
  /** 左侧双击回调 */
  onDoubleTapLeft?: () => void;
  /** 右侧双击回调 */
  onDoubleTapRight?: () => void;
  /** 中间区域双击回调（可选） */
  onDoubleTapCenter?: () => void;
  /** 双击最大间隔时间 */
  maxDuration?: number;
  /** 最大移动距离 */
  maxDeltaX?: number;
  maxDeltaY?: number;
  /** 点击区域大小 */
  hitSlop?: number;
  /** 左区域占比 */
  leftZoneRatio?: number;
  /** 右区域占比 */
  rightZoneRatio?: number;
  /** 屏幕上下文 */
  screenContext?: ScreenContext;
  /** 是否启用日志 */
  enableLogging?: boolean;
}

/**
 * 双击手势Hook
 */
export function useDoubleTapGesture({
  onDoubleTapLeft,
  onDoubleTapRight,
  onDoubleTapCenter,
  maxDuration = 250,
  maxDeltaX = 20,
  maxDeltaY = 20,
  hitSlop = 20,
  leftZoneRatio = 0.4,
  rightZoneRatio = 0.4,
  screenContext,
  enableLogging = false,
}: UseDoubleTapGestureOptions) {
  // 根据屏幕密度调整参数
  const adjustedParams = useMemo(() => {
    if (!screenContext?.pixelDensity) {
      return { maxDeltaX, maxDeltaY, hitSlop };
    }

    return adjustGestureParams(
      { maxDeltaX, maxDeltaY, hitSlop },
      screenContext.pixelDensity
    );
  }, [maxDeltaX, maxDeltaY, hitSlop, screenContext?.pixelDensity]);

  // 🚀 优化：直接处理双击事件，无防抖延迟
  const handleDoubleTap = useCallback((tapX: number) => {
    const screenWidth = screenContext?.width || 375; // 默认iPhone宽度
    const zone = getGestureZone(tapX, screenWidth, leftZoneRatio, rightZoneRatio);

    if (enableLogging) {
      log('video-gestures', LogType.DEBUG, `Double tap in ${zone} zone at x: ${tapX}`);
    }

    switch (zone) {
      case 'left':
        onDoubleTapLeft?.();
        break;
      case 'right':
        onDoubleTapRight?.();
        break;
      case 'center':
        onDoubleTapCenter?.();
        break;
    }
  }, [
    onDoubleTapLeft,
    onDoubleTapRight,
    onDoubleTapCenter,
    leftZoneRatio,
    rightZoneRatio,
    screenContext?.width,
    enableLogging,
  ]);

  // 创建双击手势
  const doubleTapGesture = useMemo(() => {
    return Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(maxDuration)
      .maxDeltaX(adjustedParams.maxDeltaX)
      .maxDeltaY(adjustedParams.maxDeltaY)
      .hitSlop({
        top: adjustedParams.hitSlop,
        bottom: adjustedParams.hitSlop,
        left: adjustedParams.hitSlop,
        right: adjustedParams.hitSlop,
      })
      .onStart((event) => {
        'worklet';
        const tapX = event.x;
        if (onDoubleTapLeft || onDoubleTapRight || onDoubleTapCenter) {
          runOnJS(handleDoubleTap)(tapX);
        }
      });
  }, [
    maxDuration,
    adjustedParams.maxDeltaX,
    adjustedParams.maxDeltaY,
    adjustedParams.hitSlop,
    handleDoubleTap,
    onDoubleTapLeft,
    onDoubleTapRight,
    onDoubleTapCenter,
  ]);

  return doubleTapGesture;
}