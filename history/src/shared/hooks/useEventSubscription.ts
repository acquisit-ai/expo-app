/**
 * 通用事件订阅 Hook
 *
 * 用于管理React Native中常见的事件监听器生命周期
 * 自动处理组件挂载状态检查和清理
 */

import { useEffect } from 'react';
import { useMountedState } from './useMountedState';

/**
 * 标准React Native事件订阅接口
 * 适用于: AppState, Dimensions, BackHandler等
 */
interface StandardEventSubscription {
  remove(): void;
}

/**
 * React Native事件监听器Hook
 *
 * @param eventSource - 事件源对象，必须有addEventListener方法
 * @param eventName - 事件名称
 * @param handler - 事件处理函数
 * @param deps - 依赖数组，默认为空数组
 *
 * @example
 * ```typescript
 * // 监听应用状态变化
 * useEventSubscription(
 *   AppState,
 *   'change',
 *   (nextAppState) => {
 *     console.log('App state changed:', nextAppState);
 *   },
 *   []
 * );
 *
 * // 监听屏幕尺寸变化
 * useEventSubscription(
 *   Dimensions,
 *   'change',
 *   ({ window }) => {
 *     setScreenDimensions(window);
 *   },
 *   []
 * );
 * ```
 */
export function useEventSubscription<
  TEventName extends string,
  THandler extends (...args: any[]) => any
>(
  eventSource: {
    addEventListener: (eventName: TEventName, handler: THandler) => StandardEventSubscription | null | undefined
  } | null | undefined,
  eventName: TEventName,
  handler: THandler,
  deps: React.DependencyList = []
): void {
  const isMounted = useMountedState();

  useEffect(() => {
    // 检查事件源是否可用
    if (!eventSource || !eventSource.addEventListener) {
      return;
    }

    // 包装处理函数，添加挂载状态检查
    const wrappedHandler = ((...args: Parameters<THandler>) => {
      if (isMounted()) {
        handler(...args);
      }
    }) as THandler;

    // 创建订阅
    const subscription = eventSource.addEventListener(eventName, wrappedHandler);

    // 返回清理函数
    return () => {
      subscription?.remove();
    };
  }, [eventSource, eventName, isMounted, ...deps]);
}

/**
 * 后退按钮事件订阅Hook (Android专用)
 *
 * @param handler - 返回true阻止默认行为，返回false允许默认行为
 * @param enabled - 是否启用监听，默认true
 *
 * @example
 * ```typescript
 * useBackHandler(() => {
 *   console.log('Back button pressed');
 *   return true; // 阻止默认行为
 * }, isFullscreen);
 * ```
 */
export function useBackHandler(
  handler: () => boolean,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    // 动态导入BackHandler (仅在需要时加载)
    let BackHandler: any;
    try {
      BackHandler = require('react-native').BackHandler;
    } catch {
      // 非React Native环境，忽略
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => subscription?.remove();
  }, [handler, enabled]);
}