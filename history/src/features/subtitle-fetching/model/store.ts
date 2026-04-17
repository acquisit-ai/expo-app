/**
 * 字幕数据源状态管理
 *
 * 管理字幕加载状态、缓存和预加载队列
 */

import { create } from 'zustand';
import { log, LogType } from '@/shared/lib/logger';
import type {
  SubtitleDataSourceState,
  LoadingState,
  SubtitleLoadingState,
  SubtitleLoadEvent
} from './types';

/**
 * 字幕数据源状态操作接口
 */
export interface SubtitleDataSourceActions {
  // 加载状态管理
  setLoadingState: (videoId: string, state: LoadingState, error?: string) => void;
  setLoadingProgress: (videoId: string, progress: number) => void;
  clearLoadingState: () => void;

  // 加载历史管理
  addLoadHistory: (entry: {
    videoId: string;
    success: boolean;
    duration: number;
    source: 'api' | 'cache';
  }) => void;
  clearLoadHistory: () => void;

  // 最后加载记录
  setLastLoaded: (videoId: string, source: 'api' | 'cache') => void;

  // 预加载队列管理
  addToPrefetchQueue: (videoId: string) => void;
  removeFromPrefetchQueue: (videoId: string) => void;
  clearPrefetchQueue: () => void;

  // 事件发布
  publishEvent: (event: SubtitleLoadEvent) => void;
}

/**
 * 初始状态
 */
const INITIAL_STATE: SubtitleDataSourceState = {
  loading: {
    videoId: null,
    state: 'idle',
    error: null,
    progress: 0
  },
  lastLoaded: null,
  prefetchQueue: [],
  loadHistory: []
};

/**
 * 字幕数据源状态存储
 */
export const useSubtitleDataSourceStore = create<
  SubtitleDataSourceState & SubtitleDataSourceActions
>()((set, get) => ({
  // === 初始状态 ===
  ...INITIAL_STATE,

  // === 加载状态管理 ===
  setLoadingState: (videoId: string, state: LoadingState, error?: string) => {
    set((prevState) => ({
      loading: {
        videoId,
        state,
        error: error || null,
        progress: state === 'loading' ? prevState.loading.progress : 0
      }
    }));

    log('subtitle-fetching', LogType.DEBUG,
      `Loading state changed: ${videoId} -> ${state}${error ? ` (${error})` : ''}`
    );
  },

  setLoadingProgress: (videoId: string, progress: number) => {
    set((prevState) => ({
      loading: {
        ...prevState.loading,
        progress: Math.max(0, Math.min(100, progress))
      }
    }));
  },

  clearLoadingState: () => {
    set({
      loading: {
        videoId: null,
        state: 'idle',
        error: null,
        progress: 0
      }
    });
  },

  // === 加载历史管理 ===
  addLoadHistory: (entry) => {
    set((state) => {
      const newEntry = {
        ...entry,
        timestamp: new Date().toISOString()
      };

      // 保持历史记录不超过 50 条
      const newHistory = [newEntry, ...state.loadHistory].slice(0, 50);

      return {
        loadHistory: newHistory
      };
    });

    log('subtitle-fetching', LogType.DEBUG,
      `Added load history: ${entry.videoId} (${entry.success ? 'success' : 'failed'}, ${entry.duration}ms, ${entry.source})`
    );
  },

  clearLoadHistory: () => {
    set({ loadHistory: [] });
    log('subtitle-fetching', LogType.DEBUG, 'Cleared load history');
  },

  // === 最后加载记录 ===
  setLastLoaded: (videoId: string, source: 'api' | 'cache') => {
    set({
      lastLoaded: {
        videoId,
        source,
        timestamp: new Date().toISOString()
      }
    });

    log('subtitle-fetching', LogType.INFO,
      `Last loaded updated: ${videoId} from ${source}`
    );
  },

  // === 预加载队列管理 ===
  addToPrefetchQueue: (videoId: string) => {
    set((state) => {
      // 避免重复添加
      if (state.prefetchQueue.includes(videoId)) {
        return state;
      }

      // 限制队列大小
      const newQueue = [videoId, ...state.prefetchQueue].slice(0, 10);

      return {
        prefetchQueue: newQueue
      };
    });

    log('subtitle-fetching', LogType.DEBUG, `Added to prefetch queue: ${videoId}`);
  },

  removeFromPrefetchQueue: (videoId: string) => {
    set((state) => ({
      prefetchQueue: state.prefetchQueue.filter(id => id !== videoId)
    }));

    log('subtitle-fetching', LogType.DEBUG, `Removed from prefetch queue: ${videoId}`);
  },

  clearPrefetchQueue: () => {
    set({ prefetchQueue: [] });
    log('subtitle-fetching', LogType.DEBUG, 'Cleared prefetch queue');
  },

  // === 事件发布 ===
  publishEvent: (event: SubtitleLoadEvent) => {
    // 在开发环境下记录事件
    if (__DEV__) {
      log('subtitle-fetching', LogType.DEBUG,
        `Event: ${event.type} ${event.videoId ? `(${event.videoId})` : ''}`
      );
    }

    // 可以在这里添加事件监听器或发送到分析服务
  }
}));

/**
 * 选择器函数
 */
export const selectLoadingState = (state: SubtitleDataSourceState) => state.loading;
export const selectLastLoaded = (state: SubtitleDataSourceState) => state.lastLoaded;
export const selectPrefetchQueue = (state: SubtitleDataSourceState) => state.prefetchQueue;
export const selectLoadHistory = (state: SubtitleDataSourceState) => state.loadHistory;

/**
 * 工具选择器
 */
export const selectIsLoading = (videoId?: string) => (state: SubtitleDataSourceState) => {
  if (videoId) {
    return state.loading.videoId === videoId && state.loading.state === 'loading';
  }
  return state.loading.state === 'loading';
};

export const selectHasError = (state: SubtitleDataSourceState) => {
  return state.loading.state === 'error' && !!state.loading.error;
};

export const selectLoadStats = (state: SubtitleDataSourceState) => {
  const history = state.loadHistory;
  const total = history.length;
  const successful = history.filter(h => h.success).length;
  const avgDuration = total > 0
    ? history.reduce((sum, h) => sum + h.duration, 0) / total
    : 0;

  return {
    total,
    successful,
    failed: total - successful,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    avgDuration
  };
};