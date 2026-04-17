/**
 * Video Entity 细粒度条件订阅
 *
 * 用途：解决多视频实例性能问题
 * - 非活跃视频不订阅 store，避免不必要的重渲染
 * - 活跃视频才订阅，保证 UI 更新
 *
 * 优化策略：
 * 1. 条件订阅：仅活跃视频订阅 video entity
 * 2. 细粒度订阅：每个字段独立订阅，减少重渲染
 * 3. 并发安全：使用 useSyncExternalStore
 */

import { useSyncExternalStore } from 'react';
import type { StoreApi } from 'zustand';
import { useVideoStore } from '../model/store';

/**
 * 通用条件订阅工具
 *
 * @param store - Zustand store
 * @param selector - 字段选择器
 * @param enabled - 是否启用订阅
 * @param fallback - 禁用时的回退值
 */
function useConditionalStoreValue<T, R>(
  store: StoreApi<T>,
  selector: (state: T) => R,
  enabled: boolean,
  fallback: R
): R {
  return useSyncExternalStore(
    // subscribe: 条件创建订阅
    (callback) => {
      if (!enabled) {
        // ✅ 不启用时，返回空的 unsubscribe
        return () => {};
      }

      // ✅ 启用时，创建订阅并手动实现 selector 逻辑
      let previousValue = selector(store.getState());

      const unsubscribe = store.subscribe((state) => {
        const nextValue = selector(state);
        // 仅在值变化时触发回调（细粒度订阅）
        if (!Object.is(previousValue, nextValue)) {
          previousValue = nextValue;
          callback();
        }
      });

      return unsubscribe;
    },

    // getSnapshot: 获取当前值
    () => enabled ? selector(store.getState()) : fallback,

    // getServerSnapshot: SSR 支持
    () => fallback
  );
}

/**
 * 条件订阅：currentTime
 *
 * enabled = true: 订阅 video entity 的 currentTime
 * enabled = false: 返回 0，不订阅
 */
export const useConditionalCurrentTime = (enabled: boolean): number =>
  useConditionalStoreValue(
    useVideoStore,
    (state) => state.playback.currentTime,
    enabled,
    0
  );

/**
 * 条件订阅：bufferedTime
 */
export const useConditionalBufferedTime = (enabled: boolean): number =>
  useConditionalStoreValue(
    useVideoStore,
    (state) => state.playback.bufferedTime,
    enabled,
    0
  );

/**
 * 条件订阅：duration
 * 注意：duration 从 playerInstance 读取，不从 store
 */
export const useConditionalDuration = (enabled: boolean): number =>
  useConditionalStoreValue(
    useVideoStore,
    (state) => state.currentPlayerMeta?.playerInstance?.duration || 0,
    enabled,
    0
  );

/**
 * 组合 Hook：提供便捷 API
 *
 * 注意：内部仍然是细粒度订阅，每个字段独立
 */
export const useConditionalVideoPlayer = (enabled: boolean) => {
  const currentTime = useConditionalCurrentTime(enabled);
  const bufferedTime = useConditionalBufferedTime(enabled);
  const duration = useConditionalDuration(enabled);

  return { currentTime, bufferedTime, duration };
};
