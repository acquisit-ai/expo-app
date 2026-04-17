/**
 * 字幕缓存管理器
 *
 * 专门负责字幕数据的内存缓存管理，采用LRU淘汰策略和TTL过期机制
 * 提供高性能的缓存读写操作，减少网络请求和提升用户体验
 */

import { log, LogType } from '@/shared/lib/logger';
import type { SubtitleJson } from '@/entities/subtitle/model/subtitle';

/**
 * 缓存条目接口
 */
export interface CacheEntry {
  /** 完全处理后的字幕数据 */
  subtitle: SubtitleJson;
  /** 缓存创建时间戳（毫秒） */
  timestamp: number;
  /** 视频ID */
  videoId: string;
  /** 访问次数（用于统计） */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessed: number;
}

/**
 * 缓存配置接口
 */
export interface SubtitleCacheConfig {
  /** 缓存过期时间（毫秒），默认 10 分钟 */
  ttl?: number;
  /** 最大缓存条目数，默认 20 */
  maxSize?: number;
  /** 是否启用缓存，默认 true */
  enabled?: boolean;
  /** 是否启用访问统计，默认 true */
  enableStats?: boolean;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 当前缓存条目数 */
  size: number;
  /** 最大缓存容量 */
  maxSize: number;
  /** 缓存命中次数 */
  hits: number;
  /** 缓存未命中次数 */
  misses: number;
  /** 缓存命中率 */
  hitRate: number;
  /** 最老条目的键 */
  oldestEntry: string | null;
  /** 最老条目的年龄（毫秒） */
  oldestAge: number;
  /** 总访问次数 */
  totalAccess: number;
  /** 淘汰次数 */
  evictions: number;
}

/**
 * 缓存事件类型
 */
export type CacheEvent =
  | { type: 'HIT'; key: string; entry: CacheEntry }
  | { type: 'MISS'; key: string }
  | { type: 'SET'; key: string; entry: CacheEntry }
  | { type: 'DELETE'; key: string; reason: 'TTL_EXPIRED' | 'LRU_EVICTED' | 'MANUAL' }
  | { type: 'CLEAR'; reason: 'MANUAL' | 'FULL' };

/**
 * 缓存事件监听器
 */
export type CacheEventListener = (event: CacheEvent) => void;

/**
 * 字幕缓存管理器
 */
export class SubtitleCache {
  private cache = new Map<string, CacheEntry>();
  private config: Required<SubtitleCacheConfig>;
  private listeners: CacheEventListener[] = [];

  // 统计信息
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAccess: 0
  };

  constructor(config: SubtitleCacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 10 * 60 * 1000, // 10分钟
      maxSize: config.maxSize || 20,
      enabled: config.enabled !== false,
      enableStats: config.enableStats !== false
    };

    log('subtitle-cache', LogType.INFO, `SubtitleCache initialized - TTL: ${this.config.ttl}ms, MaxSize: ${this.config.maxSize}, Enabled: ${this.config.enabled}`);
  }

  /**
   * 生成缓存键
   *
   * 注意：语言固定为英文，缓存键直接使用 videoId
   */
  private getCacheKey(videoId: string): string {
    return videoId;
  }

  /**
   * 发布缓存事件
   */
  private emit(event: CacheEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        log('subtitle-cache', LogType.ERROR, `Cache event listener error: ${error}`);
      }
    });
  }

  /**
   * 检查条目是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  /**
   * 查找并删除最老的条目（LRU淘汰）
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    // 遍历查找最老的条目（基于最后访问时间）
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;

      this.emit({
        type: 'DELETE',
        key: oldestKey,
        reason: 'LRU_EVICTED'
      });

      log('subtitle-cache', LogType.DEBUG, `Evicted oldest cache entry: ${oldestKey}, cache size: ${this.cache.size}`);
    }
  }

  /**
   * 清理过期的条目
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.emit({
        type: 'DELETE',
        key,
        reason: 'TTL_EXPIRED'
      });
    });

    if (expiredKeys.length > 0) {
      log('subtitle-cache', LogType.DEBUG, `Cleaned up ${expiredKeys.length} expired entries: [${expiredKeys.join(', ')}]`);
    }
  }

  /**
   * 获取缓存条目（语言固定为英文）
   */
  get(videoId: string): SubtitleJson | null {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.getCacheKey(videoId);
    const entry = this.cache.get(key);

    this.stats.totalAccess++;

    if (!entry) {
      this.stats.misses++;
      this.emit({ type: 'MISS', key });
      return null;
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.emit({
        type: 'DELETE',
        key,
        reason: 'TTL_EXPIRED'
      });
      return null;
    }

    // 更新访问统计
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.emit({ type: 'HIT', key, entry });

    log('subtitle-cache', LogType.DEBUG, `Cache hit: ${key}, access count: ${entry.accessCount}`);

    return entry.subtitle;
  }

  /**
   * 设置缓存条目（语言固定为英文）
   */
  set(videoId: string, subtitle: SubtitleJson): void {
    if (!this.config.enabled) {
      return;
    }

    // 检查容量限制
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const key = this.getCacheKey(videoId);
    const now = Date.now();

    const entry: CacheEntry = {
      subtitle,
      timestamp: now,
      videoId,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.emit({ type: 'SET', key, entry });

    log('subtitle-cache', LogType.DEBUG, `Cache entry set: ${key}, cache size: ${this.cache.size}/${this.config.maxSize}`);
  }

  /**
   * 检查是否已缓存（语言固定为英文）
   */
  has(videoId: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const key = this.getCacheKey(videoId);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.emit({
        type: 'DELETE',
        key,
        reason: 'TTL_EXPIRED'
      });
      return false;
    }

    return true;
  }

  /**
   * 删除特定缓存条目（语言固定为英文）
   */
  delete(videoId: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const key = this.getCacheKey(videoId);
    const deleted = this.cache.delete(key);

    if (deleted) {
      this.emit({
        type: 'DELETE',
        key,
        reason: 'MANUAL'
      });

      log('subtitle-cache', LogType.DEBUG, `Deleted cache entry for video ${videoId}`);
    }

    return deleted;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.emit({ type: 'CLEAR', reason: 'MANUAL' });

    log('subtitle-cache', LogType.INFO, `Cache cleared - ${size} entries removed`);
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let oldestAge = 0;

    // 查找最老的条目
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
        oldestAge = Date.now() - entry.timestamp;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 10000) / 100, // 保留两位小数
      oldestEntry: oldestKey,
      oldestAge,
      totalAccess: this.stats.totalAccess,
      evictions: this.stats.evictions
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAccess: 0
    };

    log('subtitle-cache', LogType.INFO, 'Cache stats reset');
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: CacheEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: CacheEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 手动清理过期条目
   */
  cleanup(): void {
    this.cleanupExpired();
  }

  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 检查缓存是否启用
   */
  get enabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 动态更新配置
   */
  updateConfig(newConfig: Partial<SubtitleCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 如果禁用缓存，清空所有数据
    if (!this.config.enabled) {
      this.clear();
    }

    // 如果减小了最大容量，需要清理多余的条目
    while (this.cache.size > this.config.maxSize) {
      this.evictOldest();
    }

    log('subtitle-cache', LogType.INFO, `Cache config updated - TTL: ${this.config.ttl}ms, MaxSize: ${this.config.maxSize}, Enabled: ${this.config.enabled}`);
  }

  /**
   * 获取缓存条目详情（用于调试，语言固定为英文）
   */
  getEntryDetails(videoId: string): CacheEntry | null {
    const key = this.getCacheKey(videoId);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 返回条目的副本，避免外部修改
    return {
      ...entry,
      subtitle: entry.subtitle // 注意：这里是引用，如需深拷贝请自行处理
    };
  }

  /**
   * 预热缓存（批量设置，语言固定为英文）
   */
  warmup(entries: Array<{
    videoId: string;
    subtitle: SubtitleJson;
  }>): void {
    entries.forEach(({ videoId, subtitle }) => {
      this.set(videoId, subtitle);
    });

    log('subtitle-cache', LogType.INFO, `Cache warmed up with ${entries.length} entries`);
  }
}

/**
 * 默认的字幕缓存实例
 */
export const defaultSubtitleCache = new SubtitleCache();