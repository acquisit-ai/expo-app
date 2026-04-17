/**
 * 字幕加载器 Hook
 *
 * 简化的字幕加载接口，专注于单个视频的字幕加载
 * 结合当前视频状态，提供更便捷的使用方式
 */

import { useEffect, useCallback, useState } from 'react';
import { useVideoStore, selectCurrentVideoId } from '@/entities/video';
import { useSubtitleDataSource } from './useSubtitleDataSource';
import { log, LogType } from '@/shared/lib/logger';
import type { SubtitleLoadOptions, SubtitleLoaderConfig } from '../model/types';

/**
 * 字幕加载器选项
 */
export interface UseSubtitleLoaderOptions extends SubtitleLoaderConfig {
  /** 是否自动加载当前视频的字幕 */
  autoLoad?: boolean;
  /** 是否在视频变化时自动加载 */
  autoLoadOnVideoChange?: boolean;
  /** 默认语言 */
  defaultLanguage?: string;
  /** 加载选项 */
  loadOptions?: Omit<SubtitleLoadOptions, 'onSuccess' | 'onError'>;
}

/**
 * 字幕加载器返回类型
 */
export interface UseSubtitleLoaderReturn {
  // 当前视频的字幕加载状态
  isLoading: boolean;
  hasError: boolean;
  error: string | null;

  // 加载方法
  loadCurrentVideo: (options?: SubtitleLoadOptions) => Promise<any | null>;
  loadVideo: (videoId: string, options?: SubtitleLoadOptions) => Promise<any>;
  reload: () => Promise<any | null>;

  // 状态查询
  isLoadedForCurrentVideo: boolean;
  isCachedForCurrentVideo: boolean;

  // 工具方法
  prefetchForCurrentVideo: () => Promise<void>;
  clearCacheForCurrentVideo: () => void;
}

/**
 * 字幕加载器 Hook
 */
export const useSubtitleLoader = (
  options: UseSubtitleLoaderOptions = {}
): UseSubtitleLoaderReturn => {
  const {
    autoLoad = true,
    autoLoadOnVideoChange = true,
    defaultLanguage = 'en',
    loadOptions = {},
    ...dataSourceConfig
  } = options;

  // 当前视频 ID
  const currentVideoId = useVideoStore(selectCurrentVideoId);

  // 字幕数据源
  const dataSource = useSubtitleDataSource(dataSourceConfig);

  // 本地状态
  const [hasLoadedCurrentVideo, setHasLoadedCurrentVideo] = useState(false);

  /**
   * 加载当前视频的字幕
   */
  const loadCurrentVideo = useCallback(async (
    customOptions: SubtitleLoadOptions = {}
  ): Promise<any | null> => {
    if (!currentVideoId) {
      log('subtitle-loader', LogType.WARNING, 'No current video to load subtitle for');
      return null;
    }

    try {
      const finalOptions: SubtitleLoadOptions = {
        ...loadOptions,
        ...customOptions,
        onSuccess: (subtitle, videoId) => {
          setHasLoadedCurrentVideo(true);
          log('subtitle-loader', LogType.INFO, `Successfully loaded subtitle for current video: ${videoId}`);
          customOptions.onSuccess?.(subtitle, videoId);
        },
        onError: (error, videoId) => {
          setHasLoadedCurrentVideo(false);
          log('subtitle-loader', LogType.ERROR, `Failed to load subtitle for current video: ${videoId}`);
          customOptions.onError?.(error, videoId);
        }
      };

      const subtitle = await dataSource.loadSubtitle(currentVideoId, finalOptions);
      return subtitle;

    } catch (error) {
      setHasLoadedCurrentVideo(false);
      throw error;
    }
  }, [currentVideoId, defaultLanguage, loadOptions, dataSource]);

  /**
   * 加载指定视频的字幕
   */
  const loadVideo = useCallback(async (
    videoId: string,
    customOptions: SubtitleLoadOptions = {}
  ): Promise<any> => {
    const finalOptions: SubtitleLoadOptions = {
      ...loadOptions,
      ...customOptions
    };

    return dataSource.loadSubtitle(videoId, finalOptions);
  }, [loadOptions, dataSource]);

  /**
   * 重新加载当前视频的字幕
   */
  const reload = useCallback(async (): Promise<any | null> => {
    if (!currentVideoId) return null;

    log('subtitle-loader', LogType.INFO, `Reloading subtitle for current video: ${currentVideoId}`);

    return loadCurrentVideo();
  }, [currentVideoId, loadCurrentVideo]);

  /**
   * 预加载当前视频的字幕
   */
  const prefetchForCurrentVideo = useCallback(async (): Promise<void> => {
    if (!currentVideoId) return;

    await dataSource.prefetchSubtitle(currentVideoId);
  }, [currentVideoId, dataSource]);

  /**
   * 清除当前视频的缓存
   */
  const clearCacheForCurrentVideo = useCallback((): void => {
    if (!currentVideoId) return;

    dataSource.clearCache(currentVideoId);
    setHasLoadedCurrentVideo(false);
  }, [currentVideoId, dataSource]);

  /**
   * 自动加载逻辑
   */
  useEffect(() => {
    if (!autoLoad || !autoLoadOnVideoChange || !currentVideoId) {
      return;
    }

    // 重置加载状态
    setHasLoadedCurrentVideo(false);

    // 检查是否已缓存（语言固定为英文）
    const isCached = dataSource.isCached(currentVideoId);
    if (isCached) {
      log('subtitle-loader', LogType.INFO, `Auto-loading cached subtitle for video: ${currentVideoId}`);
    } else {
      log('subtitle-loader', LogType.INFO, `Auto-loading subtitle for video: ${currentVideoId}`);
    }

    // 自动加载
    loadCurrentVideo().catch(error => {
      log('subtitle-loader', LogType.ERROR, `Auto-load failed for video ${currentVideoId}: ${error}`);
    });
  }, [currentVideoId, autoLoad, autoLoadOnVideoChange, dataSource, loadCurrentVideo]);

  // 计算衍生状态
  const isLoadingForCurrentVideo = currentVideoId
    ? dataSource.isLoading(currentVideoId)
    : false;

  const isCachedForCurrentVideo = currentVideoId
    ? dataSource.isCached(currentVideoId)
    : false;

  const hasErrorForCurrentVideo = dataSource.loading.state === 'error' &&
                                 dataSource.loading.videoId === currentVideoId;

  const errorForCurrentVideo = hasErrorForCurrentVideo
    ? dataSource.loading.error
    : null;

  return {
    // 当前视频的字幕加载状态
    isLoading: isLoadingForCurrentVideo,
    hasError: hasErrorForCurrentVideo,
    error: errorForCurrentVideo,

    // 加载方法
    loadCurrentVideo,
    loadVideo,
    reload,

    // 状态查询
    isLoadedForCurrentVideo: hasLoadedCurrentVideo,
    isCachedForCurrentVideo,

    // 工具方法
    prefetchForCurrentVideo,
    clearCacheForCurrentVideo
  };
};