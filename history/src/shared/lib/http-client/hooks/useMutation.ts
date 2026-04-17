/**
 * useMutation Hook - 变更操作封装
 *
 * 职责：
 * - 提供 POST/PUT/PATCH/DELETE 等变更操作的 React 接口
 * - 管理加载和错误状态
 * - 支持成功/失败回调
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError } from '../core/types';

/**
 * useMutation Hook 选项
 */
interface UseMutationOptions<TData, TVariables> {
  /** 成功回调 */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** 错误回调 */
  onError?: (error: ApiError, variables: TVariables) => void;
  /** 完成回调（无论成功或失败） */
  onSettled?: (
    data: TData | undefined,
    error: ApiError | null,
    variables: TVariables
  ) => void;
}

/**
 * useMutation Hook 返回值
 */
interface UseMutationResult<TData, TVariables> {
  /** 执行变更操作 */
  mutate: (variables: TVariables) => Promise<TData>;
  /** 异步执行变更操作 */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: ApiError | null;
  /** 响应数据 */
  data: TData | undefined;
  /** 重置状态 */
  reset: () => void;
}

/**
 * 变更操作 Hook
 *
 * @param mutationFn 变更函数
 * @param options 选项
 * @returns 变更状态和控制方法
 *
 * @example
 * ```ts
 * const { mutate, isLoading } = useMutation(
 *   async (data: CreateVideoInput) => {
 *     return httpClient.post<Video>('/api/v1/videos', data);
 *   },
 *   {
 *     onSuccess: (video) => {
 *       toast.show({ message: '视频创建成功' });
 *       router.push(`/videos/${video.id}`);
 *     },
 *     onError: (error) => {
 *       toast.show({ type: 'error', message: error.message });
 *     }
 *   }
 * );
 *
 * const handleSubmit = () => {
 *   mutate({ title: 'New Video', url: '...' });
 * };
 * ```
 */
export function useMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 使用 ref 存储最新的回调，避免依赖变化导致重渲染
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  const onSettledRef = useRef(options.onSettled);
  const mutationFnRef = useRef(mutationFn);

  // 同步最新的回调到 ref
  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
    onSettledRef.current = options.onSettled;
    mutationFnRef.current = mutationFn;
  });

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFnRef.current(variables);
        setData(result);
        onSuccessRef.current?.(result, variables);
        onSettledRef.current?.(result, null, variables);
        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError('变更操作失败', 0, 'UNKNOWN_ERROR', err);

        setError(apiError);
        onErrorRef.current?.(apiError, variables);
        onSettledRef.current?.(undefined, apiError, variables);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [] // 无依赖，所有值都通过 ref 获取
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
    data,
    reset,
  };
}
