/**
 * 异步安全状态Hook
 *
 * 结合useMountedState的安全状态更新hook，确保在组件卸载后不会执行setState，
 * 避免内存泄漏和React警告。遵循项目的内存安全模式。
 */

import { useState, useCallback } from 'react';
import { useMountedState } from './useMountedState';

/**
 * 异步安全状态Hook
 *
 * 提供与useState相同的API，但确保只在组件仍然挂载时执行状态更新
 *
 * @param initialState 初始状态值
 * @returns [state, safeSetState] 状态值和安全的状态更新函数
 */
export function useAsyncSafeState<T>(initialState: T | (() => T)) {
  const [state, setState] = useState<T>(initialState);
  const isMounted = useMountedState();

  const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMounted()) {
      setState(value);
    }
  }, [isMounted]);

  return [state, safeSetState] as const;
}