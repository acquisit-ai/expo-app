/**
 * 字幕数据源业务类型定义
 */

import type { SubtitleRawJson } from '@/entities/subtitle/model/raw-types';

/**
 * 加载状态枚举
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 字幕加载状态接口
 */
export interface SubtitleLoadingState {
  videoId: string | null;
  state: LoadingState;
  error: string | null;
  progress?: number; // 0-100，可选的加载进度
}

/**
 * 字幕数据源状态
 */
export interface SubtitleDataSourceState {
  /** 当前加载状态 */
  loading: SubtitleLoadingState;
  /** 最后加载成功的字幕信息 */
  lastLoaded: {
    videoId: string;
    timestamp: string;
    source: 'api' | 'cache';
  } | null;
  /** 预加载队列 */
  prefetchQueue: string[];
  /** 加载历史（用于调试和统计） */
  loadHistory: Array<{
    videoId: string;
    timestamp: string;
    success: boolean;
    duration: number;
    source: 'api' | 'cache';
  }>;
}

/**
 * 字幕加载选项（简化版，语言固定为英文）
 */
export interface SubtitleLoadOptions {
  /** 是否自动存储到 entity */
  autoStore?: boolean;
  /** 是否在后台加载 */
  background?: boolean;
  /** 加载完成回调 */
  onSuccess?: (subtitle: SubtitleRawJson, videoId: string) => void;
  /** 加载失败回调 */
  onError?: (error: any, videoId: string) => void;
  /** 加载进度回调 */
  onProgress?: (progress: number) => void;
}

/**
 * Hook 返回类型
 */
export interface UseSubtitleDataSourceReturn {
  // 状态
  loading: SubtitleLoadingState;
  lastLoaded: SubtitleDataSourceState['lastLoaded'];

  // 核心方法
  loadSubtitle: (videoId: string, options?: SubtitleLoadOptions) => Promise<SubtitleRawJson>;
  prefetchSubtitle: (videoId: string) => Promise<void>;
  clearCache: (videoId?: string) => void;

  // 状态查询
  isLoading: (videoId?: string) => boolean;
  isCached: (videoId: string) => boolean;
  hasError: () => boolean;

  // 工具方法
  getCacheStats: () => any;
  getLoadHistory: () => SubtitleDataSourceState['loadHistory'];
  retryLastFailed: () => Promise<void>;
}

/**
 * 字幕加载器配置
 */
export interface SubtitleLoaderConfig {
  /** 是否自动重试 */
  autoRetry?: boolean;
  /** 重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用预加载 */
  enablePrefetch?: boolean;
  /** 预加载队列大小 */
  prefetchQueueSize?: number;
}

/**
 * 字幕加载事件
 */
export type SubtitleLoadEvent =
  | { type: 'LOAD_START'; videoId: string }
  | { type: 'LOAD_SUCCESS'; videoId: string; subtitle: any; source: 'api' | 'cache' }
  | { type: 'LOAD_ERROR'; videoId: string; error: any }
  | { type: 'LOAD_PROGRESS'; videoId: string; progress: number }
  | { type: 'CACHE_HIT'; videoId: string }
  | { type: 'CACHE_MISS'; videoId: string }
  | { type: 'PREFETCH_START'; videoId: string }
  | { type: 'PREFETCH_COMPLETE'; videoId: string };

/**
 * 错误类型
 */
export interface SubtitleLoadError {
  videoId: string;
  type: 'NETWORK_ERROR' | 'PARSE_ERROR' | 'NOT_FOUND' | 'UNKNOWN_ERROR';
  message: string;
  timestamp: string;
  retryCount: number;
  canRetry: boolean;
}