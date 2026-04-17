/**
 * 视频控件自动隐藏逻辑 Hook
 *
 * 集中管理控件的显示/隐藏逻辑和定时器
 * 支持不同显示模式的特殊行为（如竖屏全屏永久显示）
 */

import { useCallback, useRef, useEffect } from 'react';
import { VideoDisplayMode } from '@/shared/types';
import { log, LogType } from '@/shared/lib/logger';
import { useMountedState } from '@/shared/hooks/useMountedState';
import { useTimer } from '@/shared/hooks/useTimer';
import type { VideoPlayer } from 'expo-video';

interface UseControlsAutoHideOptions {
  /** 当前显示模式 */
  displayMode: VideoDisplayMode;
  /** 控件是否可见 */
  controlsVisible: boolean;
  /** 设置控件可见性 */
  setControlsVisible: (visible: boolean) => void;
  /** 播放器实例 */
  playerInstance: VideoPlayer | null;
  /** 可见性变化回调 */
  onVisibilityChange?: (isVisible: boolean) => void;
  /** 自动隐藏延迟时间（毫秒） */
  autoHideDelay?: number;
}

interface UseControlsAutoHideReturn {
  /** 显示控件 */
  showControls: () => void;
  /** 隐藏控件 */
  hideControls: () => void;
  /** 重置自动隐藏定时器 */
  resetAutoHideTimer: () => void;
}

/**
 * 控件自动隐藏逻辑 Hook
 */
export function useControlsAutoHide({
  displayMode,
  controlsVisible,
  setControlsVisible,
  playerInstance,
  onVisibilityChange,
  autoHideDelay = 3000,
}: UseControlsAutoHideOptions): UseControlsAutoHideReturn {
  // 定时器管理
  const { setTimer, clearTimer } = useTimer();

  // 组件挂载状态跟踪
  const isMounted = useMountedState();

  // 判断是否应该自动隐藏（竖屏全屏模式不自动隐藏）
  const shouldAutoHide = displayMode !== VideoDisplayMode.FULLSCREEN_PORTRAIT;

  // 显示控件并启动自动隐藏定时器
  const showControls = useCallback(() => {
    // 检查组件是否仍然挂载
    if (!isMounted()) return;

    setControlsVisible(true);
    onVisibilityChange?.(true);
    clearTimer();

    // 根据模式决定是否启动自动隐藏
    if (shouldAutoHide) {
      log('video-controls', LogType.DEBUG, `Starting auto-hide timer`);
      setTimer(() => {
        if (isMounted()) {
          setControlsVisible(false);
          onVisibilityChange?.(false);
        }
      }, autoHideDelay);
    }
  }, [setControlsVisible, onVisibilityChange, clearTimer, setTimer, shouldAutoHide, autoHideDelay, isMounted]);

  // 立即隐藏控件
  const hideControls = useCallback(() => {
    // 检查组件是否仍然挂载
    if (!isMounted()) return;

    clearTimer();
    setControlsVisible(false);
    onVisibilityChange?.(false);
  }, [setControlsVisible, onVisibilityChange, clearTimer, isMounted]);

  // 重置自动隐藏定时器 - 用于控件交互时延长显示时间
  const resetAutoHideTimer = useCallback(() => {
    // 检查组件是否仍然挂载
    if (!isMounted()) return;

    if (controlsVisible) {
      clearTimer();
      // 根据模式决定是否重启定时器
      if (shouldAutoHide) {
        log('video-controls', LogType.DEBUG, `Resetting auto-hide timer`);
        setTimer(() => {
          if (isMounted()) {
            setControlsVisible(false);
            onVisibilityChange?.(false);
          }
        }, autoHideDelay);
      }
    }
  }, [controlsVisible, setControlsVisible, onVisibilityChange, clearTimer, setTimer, shouldAutoHide, autoHideDelay, isMounted]);


  // 监听 displayMode 变化，处理特殊模式
  useEffect(() => {
    // 检查组件是否仍然挂载
    if (!isMounted()) return;

    // 进入竖屏全屏模式时，自动显示控件
    if (!shouldAutoHide) {
      log('video-controls', LogType.DEBUG, 'Entering portrait fullscreen, showing controls permanently');
      setControlsVisible(true);
      onVisibilityChange?.(true);
      clearTimer(); // 确保没有定时器
    } else {
      // 小屏和横屏模式：组件挂载时启动初始定时器
      // 保持与用户交互一致的3秒延迟，代码复用更好
      log('video-controls', LogType.DEBUG, 'Component mounted, starting initial auto-hide timer');
      setControlsVisible(true);
      onVisibilityChange?.(true);
      clearTimer();

      // 使用统一的3秒延迟，与交互后的行为保持一致
      setTimer(() => {
        if (isMounted()) {
          setControlsVisible(false);
          onVisibilityChange?.(false);
        }
      }, autoHideDelay);
    }
  }, [displayMode, setControlsVisible, onVisibilityChange, clearTimer, setTimer, shouldAutoHide, autoHideDelay, isMounted]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    showControls,
    hideControls,
    resetAutoHideTimer,
  };
}