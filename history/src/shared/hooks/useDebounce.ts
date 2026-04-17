/**
 * 防抖处理 Hook
 *
 * 用于防抖函数调用，避免频繁触发相同操作
 * 遵循项目的内存安全模式
 */

import { useCallback, useRef, useEffect } from 'react';
import { useMountedState } from './useMountedState';

/**
 * 防抖 Hook
 *
 * @param callback 要防抖的回调函数
 * @param delay 防抖延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  const isMounted = useMountedState();

  // 确保 delay 为非负数
  const normalizedDelay = Math.max(0, delay);

  // 始终保持最新的回调引用，但不作为依赖
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 防抖函数本身保持稳定，只依赖 delay
  return useCallback((...args: Parameters<T>) => {
    if (!isMounted()) return;

    // 空回调保护
    if (!callbackRef.current) return;

    const now = Date.now();
    if (now - lastCallTimeRef.current < normalizedDelay) {
      return;
    }

    lastCallTimeRef.current = now;
    return callbackRef.current(...args);
  }, [normalizedDelay]) as T;
}