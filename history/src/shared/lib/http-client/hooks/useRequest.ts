/**
 * useRequest Hook - GET 请求封装
 *
 * 职责：
 * - 提供 React 友好的 GET 请求接口
 * - 管理加载状态
 * - 处理错误
 * - 支持手动触发和重新请求
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { httpClient } from '../core/client';
import { ApiError, type RequestConfig } from '../core/types';

/**
 * useRequest Hook 选项
 */
interface UseRequestOptions<T> extends RequestConfig {
  /** 初始数据 */
  initialData?: T;
  /** 成功回调 */
  onSuccess?: (data: T) => void;
  /** 错误回调 */
  onError?: (error: ApiError) => void;
}

/**
 * useRequest Hook 返回值
 */
interface UseRequestResult<T> {
  /** 响应数据 */
  data: T | undefined;
  /** 错误信息 */
  error: ApiError | null;
  /** 加载状态 */
  isLoading: boolean;
  /** 手动执行请求 */
  execute: () => Promise<T>;
  /** 重新请求（execute 的别名） */
  refetch: () => Promise<T>;
}

/**
 * GET 请求 Hook
 *
 * @param endpoint API 端点
 * @param options 请求选项
 * @returns 请求状态和控制方法
 *
 * @example
 * ```ts
 * const { data, error, isLoading, refetch } = useRequest<FeedResponse>(
 *   '/api/v1/feed',
 *   {
 *     onSuccess: (data) => console.log('Loaded:', data),
 *     onError: (error) => toast.show({ message: error.message })
 *   }
 * );
 *
 * useEffect(() => {
 *   refetch();
 * }, [refetch]);
 * ```
 */
export function useRequest<T>(
  endpoint: string,
  options: UseRequestOptions<T> = {}
): UseRequestResult<T> {
  const [data, setData] = useState<T | undefined>(options.initialData);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 使用 ref 存储最新的回调和配置，避免依赖变化导致重渲染
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  const configRef = useRef<RequestConfig>(options);

  // 同步最新的回调和配置到 ref
  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
    configRef.current = options;
  });

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await httpClient.get<T>(endpoint, configRef.current);
      setData(result);
      onSuccessRef.current?.(result);
      return result;
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError('请求失败', 0, 'UNKNOWN_ERROR', err);

      setError(apiError);
      onErrorRef.current?.(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]); // 只依赖 endpoint

  return {
    data,
    error,
    isLoading,
    execute,
    refetch: execute,
  };
}
