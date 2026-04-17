/**
 * 视频手势回调系统Hook
 * 分离手势处理逻辑以优化性能
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { runOnUI, runOnJS } from 'react-native-reanimated';
import { useVideoGestures } from '@/features/video-gestures';
import { log, LogType } from '@/shared/lib/logger';
import { VideoDisplayMode } from '@/shared/types';
import type { VideoPlayer } from 'expo-video';

// 内联手势配置 - 避免外部依赖
const GESTURE_CONFIG = {
  recognition: {
    singleTapDelay: 100,
    doubleTapMaxDelay: 250,
    longPressMinDuration: 500,
    maxMovement: 20,
  },
  zones: {
    leftZoneRatio: 0.4,
    rightZoneRatio: 0.4,
    centerDeadZone: 0.2,
  },
  feedback: { haptic: true },
  debug: { logging: false },
} as const;

interface UseVideoGestureCallbacksOptions {
  displayMode: VideoDisplayMode;
  playerInstance: VideoPlayer | null;
  togglePlay: () => void;
  showControls: () => void;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  subtitleNavigation?: {
    goToPrevious: () => void;
    goToNext: () => void;
  };
  onLongPress: () => void;
  triggerForward: () => void;
  triggerBackward: () => void;
}

interface UseVideoGestureCallbacksReturn {
  gestureHandler: any;
}

/**
 * 视频手势回调系统Hook
 *
 * 🚀 性能优化：
 * - 稳定的手势回调，减少重新创建
 * - 条件性日志记录，避免生产环境开销
 * - 优化的依赖数组，精确控制更新时机
 */
export function useVideoGestureCallbacks({
  displayMode,
  playerInstance,
  togglePlay,
  showControls,
  currentTime,
  duration,
  seek,
  subtitleNavigation,
  onLongPress,
  triggerForward,
  triggerBackward,
}: UseVideoGestureCallbacksOptions): UseVideoGestureCallbacksReturn {

  // 🚀 性能优化：使用ref存储高频更新的值，避免回调重新创建
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);

  // 同步最新值到ref
  useEffect(() => {
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
  }, [currentTime, duration]);

  // 自动隐藏判断 - 优化计算
  const shouldAutoHide = displayMode !== VideoDisplayMode.FULLSCREEN_PORTRAIT;

  // === 手势回调处理 - 优化依赖数组 ===
  const handleVideoTap = useCallback(() => {
    try {
      if (!playerInstance) {
        log('video-gesture-integration', LogType.WARNING, 'Player instance not available for tap interaction');
        return;
      }

      // 竖屏全屏模式下，点击切换播放状态，不处理控件
      if (!shouldAutoHide) {
        togglePlay();
        log('video-gesture-integration', LogType.DEBUG, 'Toggled play state in portrait fullscreen mode');
        return;
      }

      // 其他模式下，点击切换播放状态并显示控件重计时
      togglePlay();
      showControls();
      log('video-gesture-integration', LogType.DEBUG, 'Toggled play state and showed controls');
    } catch (error) {
      log('video-gesture-integration', LogType.ERROR, `Video tap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      try {
        showControls();
      } catch (fallbackError) {
        log('video-gesture-integration', LogType.ERROR, `Fallback showControls failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }, [playerInstance, shouldAutoHide, togglePlay, showControls]);

  const handleSeekForward = useCallback(() => {
    try {
      if (!playerInstance) return;

      // 如果有字幕导航功能，使用字幕导航
      if (subtitleNavigation?.goToNext) {
        // 🚀 关键优化：先触发动画，再通过 UI 线程调度执行 seek
        triggerForward();  // 1. 设置动画 SharedValue
        showControls();    // 2. 显示控件

        // 3. 通过 Reanimated UI 线程确保动画先渲染
        runOnUI(() => {
          'worklet';
          // UI 线程处理完动画后，回到 JS 线程执行 seek
          runOnJS(subtitleNavigation.goToNext)();
        })();

        log('video-gesture-integration', LogType.INFO, 'Navigate to next subtitle sentence');
        return;
      }

      // 后备方案：时间跳转（从ref读取最新值）
      const currentTimeValue = currentTimeRef.current;
      const durationValue = durationRef.current;
      const newTime = Math.min(currentTimeValue + 5, durationValue);
      seek(newTime);
      showControls();
      triggerForward();
      log('video-gesture-integration', LogType.INFO, `Seek forward: ${currentTimeValue.toFixed(1)}s → ${newTime.toFixed(1)}s`);
    } catch (error) {
      log('video-gesture-integration', LogType.ERROR, `Seek forward failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      try {
        showControls();
      } catch (fallbackError) {
        log('video-gesture-integration', LogType.ERROR, `Fallback showControls failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }, [playerInstance, subtitleNavigation, seek, showControls, triggerForward]);

  const handleSeekBackward = useCallback(() => {
    try {
      if (!playerInstance) return;

      // 如果有字幕导航功能，使用字幕导航
      if (subtitleNavigation?.goToPrevious) {
        // 🚀 关键优化：先触发动画，再通过 UI 线程调度执行 seek
        triggerBackward();  // 1. 设置动画 SharedValue
        showControls();     // 2. 显示控件

        // 3. 通过 Reanimated UI 线程确保动画先渲染
        runOnUI(() => {
          'worklet';
          // UI 线程处理完动画后，回到 JS 线程执行 seek
          runOnJS(subtitleNavigation.goToPrevious)();
        })();

        log('video-gesture-integration', LogType.INFO, 'Navigate to previous subtitle sentence');
        return;
      }

      // 后备方案：时间跳转（从ref读取最新值）
      const currentTimeValue = currentTimeRef.current;
      const newTime = Math.max(currentTimeValue - 5, 0);
      seek(newTime);
      showControls();
      triggerBackward();
      log('video-gesture-integration', LogType.INFO, `Seek backward: ${currentTimeValue.toFixed(1)}s → ${newTime.toFixed(1)}s`);
    } catch (error) {
      log('video-gesture-integration', LogType.ERROR, `Seek backward failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      try {
        showControls();
      } catch (fallbackError) {
        log('video-gesture-integration', LogType.ERROR, `Fallback showControls failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }, [playerInstance, subtitleNavigation, seek, showControls, triggerBackward]);

  // === 手势配置 - 稳定的回调配置 ===
  const gestureCallbacks = useMemo(() => ({
    onSingleTap: handleVideoTap,
    onDoubleTapLeft: handleSeekBackward,
    onDoubleTapRight: handleSeekForward,
    onLongPress,
  }), [handleVideoTap, handleSeekBackward, handleSeekForward, onLongPress]);

  // === 手势处理器 - 缓存配置 ===
  const { gestureHandler } = useVideoGestures({
    callbacks: gestureCallbacks,
    config: GESTURE_CONFIG,
  });

  return {
    gestureHandler,
  };
}