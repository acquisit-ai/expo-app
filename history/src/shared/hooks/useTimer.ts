/**
 * 定时器管理 Hook
 *
 * 提供安全的定时器管理，自动处理组件卸载时的清理工作
 * 支持单定时器和多定时器两种使用模式
 */

import { useRef, useCallback, useEffect } from 'react';
import { useMountedState } from './useMountedState';

export type TimerId = ReturnType<typeof setTimeout>;

/**
 * 单定时器管理 Hook
 * 适用于只需要管理一个定时器的场景，如控件自动隐藏
 */
export function useSingleTimer() {
  const timerRef = useRef<TimerId | null>(null);
  const isMounted = useMountedState();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setTimer = useCallback((callback: () => void, delay: number): TimerId | null => {
    if (!isMounted()) return null;

    // 清除之前的定时器
    clearTimer();

    const timerId = setTimeout(() => {
      timerRef.current = null;
      if (isMounted()) {
        callback();
      }
    }, delay);

    timerRef.current = timerId;
    return timerId;
  }, [isMounted, clearTimer]);

  // 组件卸载时自动清理
  useEffect(() => clearTimer, [clearTimer]);

  return {
    setTimer,
    clearTimer,
    isActive: timerRef.current !== null
  };
}

/**
 * 多定时器管理 Hook
 * 适用于需要同时管理多个定时器的场景，如方向检测中的延迟回调
 */
export function useMultiTimer() {
  const timersRef = useRef<Set<TimerId>>(new Set());
  const isMounted = useMountedState();

  const addTimer = useCallback((callback: () => void, delay: number): TimerId | null => {
    if (!isMounted()) return null;

    const timerId = setTimeout(() => {
      timersRef.current.delete(timerId);
      if (isMounted()) {
        callback();
      }
    }, delay);

    timersRef.current.add(timerId);
    return timerId;
  }, [isMounted]);

  const clearTimer = useCallback((timerId: TimerId) => {
    if (timersRef.current.has(timerId)) {
      clearTimeout(timerId);
      timersRef.current.delete(timerId);
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  // 组件卸载时自动清理所有定时器
  useEffect(() => clearAllTimers, [clearAllTimers]);

  return {
    addTimer,
    clearTimer,
    clearAllTimers,
    activeCount: timersRef.current.size
  };
}

/**
 * 通用定时器 Hook (向后兼容)
 * 提供简化的接口，适用于大多数场景
 */
export function useTimer() {
  return useSingleTimer();
}