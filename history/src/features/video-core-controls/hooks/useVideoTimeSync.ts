/**
 * 视频时间同步Hook
 * 统一管理进度条拖拽、时间显示同步和seeking状态
 *
 * 设计原则：
 * - ✅ 单一真相源：正常播放时使用 Entity 的 currentTime
 * - ✅ 临时状态：拖拽/seeking 时使用本地 tempTime
 * - ✅ 明确的状态机：normal → dragging → seeking → normal
 * - ✅ 智能seeking检测：自动判断视频是否已到达目标位置
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { log, LogType } from '@/shared/lib/logger';
import { useSingleTimer } from '@/shared/hooks';

/**
 * 视频时间同步状态机
 */
type TimeSyncState = 'normal' | 'dragging' | 'seeking';

/**
 * Hook配置选项
 */
export interface UseVideoTimeSyncOptions {
  /** 当前实际播放时间 */
  currentTime: number;
  /** 视频总时长 */
  duration: number;
  /** 跳转回调 */
  onSeek?: (time: number) => void;
  /** 交互回调 - 重置自动隐藏等 */
  onInteraction?: () => void;
  /** Seeking容差时间(秒) - 判断是否到达目标位置 */
  seekingTolerance?: number;
  /** Seeking超时时间(毫秒) - 防止永久seeking状态 */
  seekingTimeout?: number;
}

/**
 * Hook返回值
 */
export interface UseVideoTimeSyncReturn {
  /** 用于显示的时间（拖拽时显示预览，否则显示实际） */
  displayTime: number;
  /** 当前是否正在拖拽 */
  isDragging: boolean;
  /** 当前是否正在seeking */
  isSeeking: boolean;
  /** 进度条回调 */
  progressHandlers: {
    onDragStart: () => void;
    onDragUpdate: (value: number) => void;
    onDragEnd: (value: number) => void;
  };
}

/**
 * 视频时间同步Hook
 *
 * 使用示例：
 * ```tsx
 * const timeSync = useVideoTimeSync({
 *   currentTime,
 *   duration,
 *   onSeek
 * });
 *
 * <ProgressBar {...timeSync.progressHandlers} />
 * <TimeDisplay currentTime={timeSync.displayTime} />
 * ```
 */
export const useVideoTimeSync = ({
  currentTime,
  duration,
  onSeek,
  onInteraction,
  seekingTolerance = 0.5,
  seekingTimeout = 3000,
}: UseVideoTimeSyncOptions): UseVideoTimeSyncReturn => {
  // 状态机
  const [state, setState] = useState<TimeSyncState>('normal');

  // 拖拽/Seeking时的临时时间（只在非normal状态下使用）
  const [tempTime, setTempTime] = useState<number>(0);

  // Seeking目标时间
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // 使用通用 timer hook
  const { setTimer, clearTimer } = useSingleTimer();

  // ✅ 不再需要同步 useEffect，直接在 return 时选择使用哪个时间

  // Seeking状态检测
  useEffect(() => {
    if (state === 'seeking' && seekTarget !== null) {
      const timeDiff = Math.abs(currentTime - seekTarget);

      // 如果已经到达目标位置（在容差范围内）
      if (timeDiff <= seekingTolerance) {
        log('video-time-sync', LogType.DEBUG, `Seeking completed. Target: ${seekTarget}, Current: ${currentTime}`);
        setState('normal');
        setSeekTarget(null);
        clearTimer();
      }
    }
  }, [currentTime, seekTarget, state, seekingTolerance, clearTimer]);

  // 开始拖拽
  const handleDragStart = useCallback(() => {
    log('video-time-sync', LogType.DEBUG, 'Drag started');
    setState('dragging');
    clearTimer();
    onInteraction?.();
  }, [onInteraction, clearTimer]);

  // 拖拽更新
  const handleDragUpdate = useCallback((value: number) => {
    // 确保值在有效范围内
    const clampedValue = Math.max(0, Math.min(value, duration));
    setTempTime(clampedValue);  // ✅ 只在拖拽时更新临时时间

    // 保持拖拽状态
    if (state !== 'dragging') {
      setState('dragging');
    }
  }, [duration, state]);

  // 拖拽结束
  const handleDragEnd = useCallback((value: number) => {
    // 确保值在有效范围内
    const clampedValue = Math.max(0, Math.min(value, duration));

    log('video-time-sync', LogType.DEBUG, `Drag ended. Seeking to: ${clampedValue}`);

    // 设置seeking状态和目标
    setState('seeking');
    setSeekTarget(clampedValue);
    setTempTime(clampedValue);  // ✅ seeking 时保持临时时间

    // 触发seek
    onSeek?.(clampedValue);
    onInteraction?.();

    // 设置超时保护（防止永久seeking）
    setTimer(() => {
      log('video-time-sync', LogType.WARNING, `Seeking timeout for target: ${clampedValue}. Forcing normal state.`);
      setState('normal');
      setSeekTarget(null);
    }, seekingTimeout);
  }, [duration, onSeek, onInteraction, seekingTimeout, setTimer]);

  // timer 自动清理，无需手动 useEffect

  return {
    // ✅ 统一使用 Entity 的时间作为单一真相来源
    // 只在拖拽/seeking 时使用临时时间
    displayTime: state === 'normal' ? currentTime : tempTime,
    isDragging: state === 'dragging',
    isSeeking: state === 'seeking',
    progressHandlers: {
      onDragStart: handleDragStart,
      onDragUpdate: handleDragUpdate,
      onDragEnd: handleDragEnd,
    },
  };
};