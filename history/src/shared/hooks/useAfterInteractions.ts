/**
 * InteractionManager Hook
 *
 * 在交互完成后执行回调，常用于优化性能：
 * - 导航动画完成后执行
 * - 避免阻塞用户交互
 * - 延迟非关键渲染
 *
 * 使用 requestAnimationFrame 确保在下一帧执行，避免视觉跳动
 */

import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

/**
 * 在交互完成后执行回调的 Hook
 *
 * @param callback - 要执行的回调函数
 * @param deps - 依赖数组（类似 useEffect）
 * @param useRAF - 是否使用 requestAnimationFrame（默认 true）
 *
 * @example
 * ```typescript
 * // 导航完成后加载数据（使用 RAF）
 * useAfterInteractions(() => {
 *   scrollViewRef.current?.scrollTo({ y: savedPosition });
 * }, [savedPosition]);
 *
 * // 导航完成后执行逻辑（不使用 RAF）
 * useAfterInteractions(() => {
 *   loadPendingData();
 * }, [], false);
 * ```
 */
export function useAfterInteractions(
  callback: () => void,
  deps: React.DependencyList,
  useRAF: boolean = true
): void {
  // 🔑 关键：使用 ref 存储最新的 callback，避免闭包陷阱
  const callbackRef = useRef(callback);

  // 始终保持最新的回调引用（遵循 useDebounce 的模式）
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // 等待当前交互完成（导航动画、手势等）
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (useRAF) {
        // 在下一帧执行，确保 UI 已更新
        requestAnimationFrame(() => {
          callbackRef.current();  // ✅ 执行最新的 callback
        });
      } else {
        // 立即执行
        callbackRef.current();  // ✅ 执行最新的 callback
      }
    });

    // 组件卸载时取消待处理的回调
    return () => {
      interactionHandle.cancel();
    };
  }, deps);
}

/**
 * 在交互完成后执行回调，支持自定义帧延迟
 *
 * @param callback - 要执行的回调函数
 * @param deps - 依赖数组
 * @param frameDelay - 延迟的帧数（默认 1 帧）
 *
 * @example
 * ```typescript
 * // 等待 2 帧后执行（确保复杂动画完成）
 * useAfterInteractionsWithDelay(() => {
 *   loadHeavyContent();
 * }, [], 2);
 * ```
 */
export function useAfterInteractionsWithDelay(
  callback: () => void,
  deps: React.DependencyList,
  frameDelay: number = 1
): void {
  // 🔑 关键：使用 ref 存储最新的 callback，避免闭包陷阱
  const callbackRef = useRef(callback);

  // 始终保持最新的回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      let framesLeft = frameDelay;

      const scheduleNextFrame = () => {
        if (framesLeft <= 0) {
          callbackRef.current();  // ✅ 执行最新的 callback
          return;
        }

        framesLeft--;
        requestAnimationFrame(scheduleNextFrame);
      };

      requestAnimationFrame(scheduleNextFrame);
    });

    return () => {
      interactionHandle.cancel();
    };
  }, deps);
}
