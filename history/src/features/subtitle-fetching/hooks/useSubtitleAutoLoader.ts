/**
 * Subtitle Auto Loader Hook
 *
 * 职责：
 * - 监听 Video Entity 的 currentPlayerMeta.videoId 变化
 * - 自动加载和切换字幕
 * - 与其他功能完全解耦
 *
 * 使用场景：
 * - 在 App 根组件调用一次（全局字幕自动加载）
 * - 当视频切换时，自动加载对应的字幕
 *
 * 架构优势：
 * - 页面层（FeedPage 等）无需手动调用字幕加载
 * - 字幕加载逻辑集中管理
 * - 符合单一职责原则
 *
 * @example
 * ```tsx
 * // App.tsx
 * export function App() {
 *   useVideoEntitySync();      // 视频同步
 *   useSubtitleAutoLoader();   // 字幕自动加载
 *   return <Navigation />;
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { useVideoStore } from '@/entities/video';
import { useSubtitleStore } from '@/entities/subtitle';
import { defaultSubtitleFetcher } from '../lib/subtitle-fetcher';
import { log, LogType } from '@/shared/lib/logger';
import { toast } from '@/shared/lib/toast';

const LOG_TAG = 'subtitle-auto-loader';

/**
 * 字幕自动加载器配置
 */
export interface SubtitleAutoLoaderConfig {
  /** 是否启用自动加载，默认 true */
  enabled?: boolean;
  /** 是否启用后台预加载，默认 false */
  enablePrefetch?: boolean;
  /** 是否显示加载失败 Toast，默认 true */
  showErrorToast?: boolean;
}

/**
 * Subtitle Auto Loader Hook
 *
 * 🎯 核心功能：
 * - 订阅 Video Entity 的 currentPlayerMeta.videoId
 * - 当视频切换时，自动加载字幕
 * - 自动更新 Subtitle Entity 的状态
 *
 * ⚠️ 注意：
 * - 整个应用只应调用一次（通常在 App 根组件）
 * - 不要在 Feature 层或 Page 层调用
 * - videoId 变化时，自动触发字幕加载
 *
 * 🎯 性能优化：
 * - 使用缓存避免重复加载
 * - 后台异步加载，不阻塞 UI
 * - 失败不影响视频播放
 */
export const useSubtitleAutoLoader = (config: SubtitleAutoLoaderConfig = {}) => {
  const {
    enabled = true,
    enablePrefetch = false,
    showErrorToast = true
  } = config;

  // 🎯 订阅当前视频 ID
  const currentVideoId = useVideoStore(
    state => state.currentPlayerMeta?.videoId ?? null
  );

  // 使用 ref 追踪状态
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastVideoIdRef = useRef<string | null>(null);

  // ✅ 当视频切换时，自动加载字幕
  useEffect(() => {
    if (!enabled || !currentVideoId) {
      if (!enabled) {
        log(LOG_TAG, LogType.DEBUG, 'Subtitle auto loader is disabled');
      }
      return;
    }

    // 📊 日志：记录视频切换
    log(LOG_TAG, LogType.INFO, `Video changed: ${currentVideoId}`);

    // 🚫 中止之前的加载请求
    if (abortControllerRef.current) {
      log(LOG_TAG, LogType.DEBUG, `Aborting previous subtitle load: ${lastVideoIdRef.current}`);
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      useSubtitleStore.getState().clearLoading();
    }

    // 避免重复加载同一个视频
    if (currentVideoId === lastVideoIdRef.current) {
      log(LOG_TAG, LogType.DEBUG, `Same video, skipping: ${currentVideoId}`);
      return;
    }

    lastVideoIdRef.current = currentVideoId;

    // 🔍 检查缓存
    const subtitleStore = useSubtitleStore.getState();
    const cachedSubtitle = subtitleStore.subtitles.get(currentVideoId);

    if (cachedSubtitle) {
      log(LOG_TAG, LogType.INFO, `Using cached subtitle for: ${currentVideoId}`);
      subtitleStore.setActiveSubtitle(currentVideoId);
      return;
    }

    // 🚀 开始加载字幕
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    subtitleStore.setLoading(currentVideoId);
    log(LOG_TAG, LogType.INFO, `Loading subtitle for: ${currentVideoId}`);

    defaultSubtitleFetcher
      .fetchSubtitle(currentVideoId)
      .then(result => {
        if (abortController.signal.aborted) {
          log(LOG_TAG, LogType.DEBUG, `Load aborted for: ${currentVideoId}`);
          return;
        }

        log(LOG_TAG, LogType.INFO,
          `Subtitle loaded: ${currentVideoId} (${result.source}, ${result.metadata.stats.totalSentences} sentences)`
        );

        // 存储字幕
        const store = useSubtitleStore.getState();
        store.storeSubtitle(currentVideoId, result.subtitle);

        // 如果还是当前视频，激活字幕
        const currentId = useVideoStore.getState().currentPlayerMeta?.videoId;
        if (currentId === currentVideoId) {
          store.setActiveSubtitle(currentVideoId);
          log(LOG_TAG, LogType.INFO, `Activated subtitle for: ${currentVideoId}`);
        }
      })
      .catch(error => {
        // 忽略中止错误
        if (error.name === 'AbortError' || abortController.signal.aborted) {
          log(LOG_TAG, LogType.DEBUG, `Load aborted for: ${currentVideoId}`);
          return;
        }

        log(LOG_TAG, LogType.WARNING,
          `Failed to load subtitle for ${currentVideoId}: ${error.message || error}`
        );

        const subtitleStore = useSubtitleStore.getState();
        if (subtitleStore.activeVideoId === currentVideoId) {
          subtitleStore.clearActiveSubtitle();
          log(LOG_TAG, LogType.INFO,
            `Cleared active subtitle due to load failure: ${currentVideoId}`);
        }

        lastVideoIdRef.current = null;

        // 通知用户字幕不可用
        if (showErrorToast) {
          toast.show({
            type: 'warning',
            title: '字幕加载失败',
            message: '视频可以正常播放，字幕暂不可用',
            duration: 2000
          });
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          useSubtitleStore.getState().clearLoading();
        }

        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      });

  }, [currentVideoId, enabled, showErrorToast]);

  // 🔄 清理函数
  useEffect(() => {
    return () => {
      // 中止未完成的请求
      if (abortControllerRef.current) {
        log(LOG_TAG, LogType.DEBUG, 'Aborting subtitle load on unmount');
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // 清除加载状态
      const subtitleStore = useSubtitleStore.getState();
      if (subtitleStore.isLoading) {
        subtitleStore.clearLoading();
      }

      lastVideoIdRef.current = null;
      log(LOG_TAG, LogType.DEBUG, 'Subtitle auto loader unmounted');
    };
  }, []);
};
