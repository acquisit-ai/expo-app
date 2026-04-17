/**
 * 字幕数据源主 Hook
 *
 * 提供字幕数据获取的统一接口，集成 API 调用、缓存管理和 entity 存储
 */

import { useCallback, useMemo, useRef } from 'react';
import { useSubtitleEntity } from '@/entities/subtitle';
import { log, LogType } from '@/shared/lib/logger';
import { defaultSubtitleFetcher } from '../lib/subtitle-fetcher';
import { SubtitleErrorHandler } from '../lib/error-handler';
import {
  useSubtitleDataSourceStore,
  selectLoadingState,
  selectLastLoaded,
  selectIsLoading,
  selectHasError,
  selectLoadStats
} from '../model/store';
import type {
  UseSubtitleDataSourceReturn,
  SubtitleLoadOptions,
  SubtitleLoaderConfig
} from '../model/types';
// 移除对 SubtitleJson 的依赖，使用原始数据

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<SubtitleLoaderConfig> = {
  autoRetry: true,
  maxRetries: 2,
  retryDelay: 1000,
  enablePrefetch: true,
  prefetchQueueSize: 5
};

/**
 * 字幕数据源主 Hook
 */
export const useSubtitleDataSource = (
  config: SubtitleLoaderConfig = {}
): UseSubtitleDataSourceReturn => {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // Entity 状态和操作
  const { storeSubtitle, setActiveSubtitle } = useSubtitleEntity();

  // 数据源状态
  const store = useSubtitleDataSourceStore();
  const loading = useSubtitleDataSourceStore(selectLoadingState);
  const lastLoaded = useSubtitleDataSourceStore(selectLastLoaded);
  const isLoadingAny = useSubtitleDataSourceStore(selectIsLoading());
  const hasError = useSubtitleDataSourceStore(selectHasError);

  // 重试计数器
  const retryCountRef = useRef<Map<string, number>>(new Map());

  /**
   * 加载字幕数据
   */
  const loadSubtitle = useCallback(async (
    videoId: string,
    options: SubtitleLoadOptions = {}
  ): Promise<any> => {
    const {
      autoStore = true,
      background = false,
      onSuccess,
      onError,
      onProgress,
      ...fetchOptions
    } = options;

    const startTime = Date.now();

    log('subtitle-fetching', LogType.INFO, `Starting subtitle load for video: ${videoId}`);

    try {
      // 发布开始事件
      store.publishEvent({ type: 'LOAD_START', videoId });

      // 设置加载状态
      if (!background) {
        store.setLoadingState(videoId, 'loading');
      }

      // 进度回调
      const progressCallback = (progress: number) => {
        if (!background) {
          store.setLoadingProgress(videoId, progress);
        }
        onProgress?.(progress);
      };

      // 模拟进度更新
      progressCallback(10);

      // 检查缓存（语言固定为英文）
      const isCached = defaultSubtitleFetcher.isCached(videoId);
      if (isCached) {
        store.publishEvent({ type: 'CACHE_HIT', videoId });
        progressCallback(50);
      } else {
        store.publishEvent({ type: 'CACHE_MISS', videoId });
      }

      progressCallback(30);

      // 获取字幕数据（原始 JSON）
      const result = await defaultSubtitleFetcher.fetchSubtitle(
        videoId,
        { enableValidation: true }
      );

      progressCallback(70);

      // 存储到 entity（传递原始数据，让 entity 自己处理）
      if (autoStore) {
        storeSubtitle(videoId, result.subtitle);
        setActiveSubtitle(videoId);
      }

      progressCallback(90);

      // 更新状态
      if (!background) {
        store.setLoadingState(videoId, 'success');
      }
      store.setLastLoaded(videoId, result.source);

      // 记录加载历史
      store.addLoadHistory({
        videoId,
        success: true,
        duration: Date.now() - startTime,
        source: result.source
      });

      // 重置重试计数
      retryCountRef.current.delete(videoId);

      progressCallback(100);

      // 发布成功事件
      store.publishEvent({
        type: 'LOAD_SUCCESS',
        videoId,
        subtitle: result.subtitle,
        source: result.source
      });

      // 调用成功回调
      onSuccess?.(result.subtitle, videoId);

      log('subtitle-fetching', LogType.INFO,
        `Successfully loaded subtitle for video: ${videoId} (source: ${result.source}, duration: ${Date.now() - startTime}ms)`
      );

      return result.subtitle;

    } catch (error) {
      const currentRetryCount = retryCountRef.current.get(videoId) || 0;
      const shouldRetry = finalConfig.autoRetry &&
                         currentRetryCount < finalConfig.maxRetries &&
                         SubtitleErrorHandler.toUserFriendlyError(error).canRetry;

      if (shouldRetry) {
        // 增加重试计数
        retryCountRef.current.set(videoId, currentRetryCount + 1);

        log('subtitle-fetching', LogType.WARNING,
          `Retrying subtitle load for video: ${videoId} (attempt ${currentRetryCount + 1})`
        );

        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
        return loadSubtitle(videoId, options);
      }

      // 记录错误
      SubtitleErrorHandler.logError(error, 'loadSubtitle', videoId);

      // 更新状态
      const userError = SubtitleErrorHandler.toUserFriendlyError(error);
      if (!background) {
        store.setLoadingState(videoId, 'error', userError.message);
      }

      // 记录加载历史
      store.addLoadHistory({
        videoId,
        success: false,
        duration: Date.now() - startTime,
        source: 'api'
      });

      // 发布错误事件
      store.publishEvent({ type: 'LOAD_ERROR', videoId, error });

      // 调用错误回调
      onError?.(error, videoId);

      throw error;
    }
  }, [
    finalConfig,
    storeSubtitle,
    setActiveSubtitle,
    store
  ]);

  /**
   * 预加载字幕
   */
  const prefetchSubtitle = useCallback(async (videoId: string): Promise<void> => {
    if (!finalConfig.enablePrefetch) {
      log('subtitle-fetching', LogType.DEBUG, 'Prefetch disabled');
      return;
    }

    try {
      log('subtitle-fetching', LogType.INFO, `Prefetching subtitle for video: ${videoId}`);

      // 添加到预加载队列
      store.addToPrefetchQueue(videoId);
      store.publishEvent({ type: 'PREFETCH_START', videoId });

      // 后台加载
      await loadSubtitle(videoId, {
        background: true,
        autoStore: false // 预加载不自动存储到 entity
      });

      // 从队列中移除
      store.removeFromPrefetchQueue(videoId);
      store.publishEvent({ type: 'PREFETCH_COMPLETE', videoId });

    } catch (error) {
      // 预加载失败不抛出错误
      store.removeFromPrefetchQueue(videoId);
      log('subtitle-fetching', LogType.WARNING, `Prefetch failed for video ${videoId}: ${error}`);
    }
  }, [finalConfig.enablePrefetch, loadSubtitle, store]);

  /**
   * 清除缓存
   */
  const clearCache = useCallback((videoId?: string) => {
    defaultSubtitleFetcher.clearCache(videoId);
    log('subtitle-fetching', LogType.INFO,
      `Cleared subtitle cache${videoId ? ` for video: ${videoId}` : ''}`
    );
  }, []);

  /**
   * 检查是否正在加载
   */
  const isLoading = useCallback((videoId?: string) => {
    if (videoId) {
      return loading.videoId === videoId && loading.state === 'loading';
    }
    return loading.state === 'loading';
  }, [loading]);

  /**
   * 检查是否已缓存（语言固定为英文）
   */
  const isCached = useCallback((videoId: string) => {
    return defaultSubtitleFetcher.isCached(videoId);
  }, []);

  /**
   * 获取缓存统计
   */
  const getCacheStats = useCallback(() => {
    return defaultSubtitleFetcher.getCacheStats();
  }, []);

  /**
   * 获取加载历史
   */
  const getLoadHistory = useCallback(() => {
    return store.loadHistory;
  }, [store.loadHistory]);

  /**
   * 重试最后失败的加载
   */
  const retryLastFailed = useCallback(async () => {
    if (loading.state === 'error' && loading.videoId) {
      const videoId = loading.videoId;
      log('subtitle-fetching', LogType.INFO, `Retrying failed load for video: ${videoId}`);

      // 重置重试计数
      retryCountRef.current.delete(videoId);

      await loadSubtitle(videoId);
    }
  }, [loading, loadSubtitle]);

  return {
    // 状态
    loading,
    lastLoaded,

    // 核心方法
    loadSubtitle,
    prefetchSubtitle,
    clearCache,

    // 状态查询
    isLoading,
    isCached,
    hasError: () => hasError,

    // 工具方法
    getCacheStats,
    getLoadHistory,
    retryLastFailed
  };
};