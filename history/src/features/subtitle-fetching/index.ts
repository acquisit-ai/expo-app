/**
 * Subtitle Data Source Feature - 字幕数据源
 *
 * 负责从后端 API 获取字幕数据，转换格式并存储到 subtitle entity
 *
 * 架构特点：
 * - 单一职责：专注于数据获取和转换
 * - 错误处理：完善的错误处理和重试机制
 * - 性能优化：缓存策略和预加载支持
 * - 类型安全：完整的 TypeScript 类型定义
 * - 易于测试：可测试的纯函数设计
 */

// === API 层 ===
export {
  SubtitleAPI,
  fetchSubtitle,
  healthCheck
} from './api/subtitle-api';

export type {
  SubtitleApiResponse,
} from './api/types';

// 错误处理现在使用统一的 ApiError (@/shared/lib/http-client)

// === 工具库层 ===
export {
  SubtitleDataTransformer,
  DataTransformError
} from './lib/data-transformer';

export {
  SubtitleErrorHandler
} from './lib/error-handler';

export {
  SubtitleFetcher,
  defaultSubtitleFetcher
} from './lib/subtitle-fetcher';

export {
  SubtitleCache,
  defaultSubtitleCache
} from './lib/subtitle-cache';

export type {
  TransformResult,
  TransformOptions
} from './lib/data-transformer';

export type {
  FetchResult,
  SubtitleFetcherConfig
} from './lib/subtitle-fetcher';

export type {
  CacheEntry,
  SubtitleCacheConfig,
  CacheStats,
  CacheEvent,
  CacheEventListener
} from './lib/subtitle-cache';

export type {
  UserFriendlyError
} from './lib/error-handler';

// === 状态管理层 ===
export {
  useSubtitleDataSourceStore,
  selectLoadingState,
  selectLastLoaded,
  selectPrefetchQueue,
  selectLoadHistory,
  selectIsLoading,
  selectHasError,
  selectLoadStats
} from './model/store';

export type {
  SubtitleDataSourceActions
} from './model/store';

export type {
  LoadingState,
  SubtitleLoadingState,
  SubtitleDataSourceState,
  SubtitleLoadOptions,
  UseSubtitleDataSourceReturn,
  SubtitleLoaderConfig,
  SubtitleLoadEvent,
  SubtitleLoadError
} from './model/types';

// === React Hooks 层 ===
export {
  useSubtitleDataSource
} from './hooks/useSubtitleDataSource';

export {
  useSubtitleLoader
} from './hooks/useSubtitleLoader';

export type {
  UseSubtitleLoaderOptions,
  UseSubtitleLoaderReturn
} from './hooks/useSubtitleLoader';

// === 全局自动加载器 ===
export {
  useSubtitleAutoLoader,
  type SubtitleAutoLoaderConfig
} from './hooks/useSubtitleAutoLoader';