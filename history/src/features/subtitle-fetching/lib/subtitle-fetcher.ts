/**
 * 字幕获取器
 *
 * 统一的字幕数据获取接口，整合 API 调用、缓存和错误处理
 */

import { log, LogType } from '@/shared/lib/logger';
import { SubtitleAPI } from '../api/subtitle-api';
import { SubtitleDataTransformer } from './data-transformer';
import { SubtitleErrorHandler } from './error-handler';
import { SubtitleCache, defaultSubtitleCache } from './subtitle-cache';
import type { TransformOptions } from './data-transformer';
import type { RawDataStats } from '@/entities/subtitle/model/raw-types';
import type { SubtitleJson } from '@/entities/subtitle/model/subtitle';
import type { SubtitleCacheConfig } from './subtitle-cache';

/**
 * 获取结果接口
 */
export interface FetchResult {
  subtitle: SubtitleJson; // 完全处理后的字幕数据
  source: 'api' | 'cache';
  timestamp: string;
  metadata: {
    videoId: string;
    format: 'legacy' | 'flat' | 'unknown';
    stats: RawDataStats;
    parseDuration: number;
  };
}

/**
 * 字幕获取器配置
 */
export interface SubtitleFetcherConfig {
  /** 缓存配置 */
  cache?: SubtitleCacheConfig;
  /** 是否使用默认缓存实例，默认 true */
  useDefaultCache?: boolean;
}

/**
 * 字幕获取器类
 */
export class SubtitleFetcher {
  private cache: SubtitleCache;
  private config: Required<SubtitleFetcherConfig>;

  constructor(config: SubtitleFetcherConfig = {}) {
    this.config = {
      cache: config.cache || {},
      useDefaultCache: config.useDefaultCache !== false
    };

    // 使用默认缓存实例或创建新实例
    if (this.config.useDefaultCache) {
      this.cache = defaultSubtitleCache;
      // 如果提供了缓存配置，更新默认缓存的配置
      if (config.cache) {
        this.cache.updateConfig(config.cache);
      }
    } else {
      this.cache = new SubtitleCache(this.config.cache);
    }

    log('subtitle-fetcher', LogType.INFO, `SubtitleFetcher initialized - useDefaultCache: ${this.config.useDefaultCache}, cacheEnabled: ${this.cache.enabled}`);
  }

  /**
   * 获取字幕数据
   */
  async fetchSubtitle(
    videoId: string,
    transformOptions: TransformOptions = {}
  ): Promise<FetchResult> {
    const startTime = Date.now();

    log('subtitle-fetcher', LogType.INFO, `Fetching subtitle for video: ${videoId}`);

    try {
      // 检查缓存（语言固定为英文）
      if (this.cache.enabled) {
        const cached = this.cache.get(videoId);
        if (cached) {
          log('subtitle-fetcher', LogType.INFO, `Cache hit for video: ${videoId}`);
          return {
            subtitle: cached,
            source: 'cache',
            timestamp: new Date().toISOString(),
            metadata: {
              videoId,
              format: 'unknown', // 缓存数据格式待检测
              stats: {
                format: 'unknown',
                totalSentences: 0,
                totalTokens: 0,
                dataKeys: []
              },
              parseDuration: Date.now() - startTime
            }
          };
        }
      }

      // 从 API 获取数据
      log('subtitle-fetcher', LogType.INFO, `Fetching from API for video: ${videoId}`);
      const apiResponse = await SubtitleAPI.fetchSubtitle(videoId);

      // 解析 JSON 数据（不做格式转换）
      const parseStart = Date.now();
      const parseResult = SubtitleDataTransformer.transform(apiResponse, transformOptions);
      const parseDuration = Date.now() - parseStart;

      // 更新缓存（语言固定为英文）
      if (this.cache.enabled) {
        this.cache.set(videoId, parseResult.subtitle);
      }

      // 记录统计信息
      log('subtitle-fetcher', LogType.INFO,
        `Successfully fetched subtitle: format ${parseResult.stats.format}, ${parseResult.stats.totalSentences} sentences`
      );

      return {
        subtitle: parseResult.subtitle,
        source: 'api',
        timestamp: new Date().toISOString(),
        metadata: {
          videoId,
          format: parseResult.stats.format,
          stats: parseResult.stats,
          parseDuration
        }
      };

    } catch (error) {
      SubtitleErrorHandler.logError(error, 'fetchSubtitle', videoId);
      throw error;
    }
  }

  /**
   * 预加载字幕（后台加载，不阻塞）
   */
  async prefetchSubtitle(videoId: string): Promise<void> {
    try {
      log('subtitle-fetcher', LogType.INFO, `Prefetching subtitle for video: ${videoId}`);
      await this.fetchSubtitle(videoId);
    } catch (error) {
      // 预加载失败不抛出错误，只记录日志
      log('subtitle-fetcher', LogType.WARNING, `Prefetch failed for video ${videoId}: ${error}`);
    }
  }

  /**
   * 批量预加载字幕
   */
  async prefetchMultiple(videoIds: string[]): Promise<void> {
    log('subtitle-fetcher', LogType.INFO, `Prefetching ${videoIds.length} subtitles`);

    // 并发预加载，但限制并发数量
    const concurrency = 3;
    for (let i = 0; i < videoIds.length; i += concurrency) {
      const batch = videoIds.slice(i, i + concurrency);
      await Promise.allSettled(
        batch.map(videoId => this.prefetchSubtitle(videoId))
      );
    }
  }

  /**
   * 检查字幕是否已缓存（语言固定为英文）
   */
  isCached(videoId: string): boolean {
    return this.cache.has(videoId);
  }

  /**
   * 清除缓存
   */
  clearCache(videoId?: string): void {
    if (videoId) {
      this.cache.delete(videoId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * 获取缓存实例（用于高级操作）
   */
  getCache(): SubtitleCache {
    return this.cache;
  }
}

/**
 * 默认的字幕获取器实例
 */
export const defaultSubtitleFetcher = new SubtitleFetcher();