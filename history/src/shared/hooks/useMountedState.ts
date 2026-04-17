/**
 * 组件挂载状态跟踪 Hook
 *
 * 用于防止在组件卸载后执行异步操作，避免内存泄漏
 * 遵循项目的内存安全模式
 */

import { useRef, useEffect, useCallback } from 'react';

/**
 * 组件挂载状态跟踪 Hook
 *
 * @returns 获取当前组件是否仍然挂载的函数
 */
export function useMountedState(): () => boolean {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      // 组件卸载时立即标记为未挂载
      mountedRef.current = false;
    };
  }, []);

  // 返回检查挂载状态的函数
  const isMounted = useCallback(() => mountedRef.current, []);

  return isMounted;
}