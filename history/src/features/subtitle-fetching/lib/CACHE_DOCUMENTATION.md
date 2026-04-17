# Subtitle Cache 字幕缓存系统文档

## 📋 概述

`SubtitleCache` 是 `subtitle-fetching` 模块的核心缓存管理器，专门负责字幕数据的内存缓存管理。采用 **LRU (Least Recently Used) 淘汰策略** 和 **TTL (Time To Live) 过期机制**，提供高性能的缓存读写操作。

## 🏗️ 架构设计

### 核心特性

- ✅ **内存缓存**: 基于 JavaScript Map 的高性能内存存储
- ✅ **LRU 淘汰**: 基于最后访问时间的智能淘汰策略
- ✅ **TTL 过期**: 基于时间戳的自动过期清理
- ✅ **事件系统**: 完整的缓存事件监听机制
- ✅ **统计监控**: 详细的缓存性能统计信息
- ✅ **类型安全**: 完整的 TypeScript 类型支持

### 数据结构

```typescript
interface CacheEntry {
  subtitle: SubtitleRawJson;  // 字幕原始数据
  timestamp: number;          // 缓存创建时间戳（毫秒）
  videoId: string;           // 视频ID
  language: string;          // 语言代码
  accessCount: number;       // 访问次数（用于统计）
  lastAccessed: number;      // 最后访问时间
}
```

## ⚙️ 配置选项

### SubtitleCacheConfig

```typescript
interface SubtitleCacheConfig {
  ttl?: number;          // 缓存过期时间（毫秒），默认 10 分钟
  maxSize?: number;      // 最大缓存条目数，默认 20
  enabled?: boolean;     // 是否启用缓存，默认 true
  enableStats?: boolean; // 是否启用访问统计，默认 true
}
```

### 默认配置

```typescript
const DEFAULT_CONFIG = {
  ttl: 10 * 60 * 1000,      // 10分钟过期
  maxSize: 20,              // 最多20个条目
  enabled: true,            // 启用缓存
  enableStats: true         // 启用统计
};
```

## 🚀 使用指南

### 1. 基础使用

```typescript
import { SubtitleCache } from './subtitle-cache';

// 创建缓存实例
const cache = new SubtitleCache({
  ttl: 15 * 60 * 1000,  // 15分钟过期
  maxSize: 30,          // 最多30个条目
  enabled: true
});

// 存储缓存
cache.set('video123', 'en', subtitleData);

// 读取缓存
const cached = cache.get('video123', 'en');

// 检查是否存在
const exists = cache.has('video123', 'en');

// 删除缓存
cache.delete('video123', 'en');   // 删除特定语言
cache.delete('video123');         // 删除该视频所有语言

// 清空所有缓存
cache.clear();
```

### 2. 使用默认实例

```typescript
import { defaultSubtitleCache } from './subtitle-cache';

// 直接使用默认实例
defaultSubtitleCache.set('video456', 'zh', subtitleData);
const cached = defaultSubtitleCache.get('video456', 'zh');
```

### 3. 与 SubtitleFetcher 集成

```typescript
import { SubtitleFetcher } from './subtitle-fetcher';

// 使用默认缓存实例
const fetcher = new SubtitleFetcher({
  useDefaultCache: true,
  cache: {
    ttl: 20 * 60 * 1000,  // 20分钟过期
    maxSize: 50
  }
});

// 或创建独立缓存实例
const independentFetcher = new SubtitleFetcher({
  useDefaultCache: false,
  cache: {
    ttl: 5 * 60 * 1000,   // 5分钟过期
    maxSize: 10
  }
});
```

## 📊 缓存统计

### 获取统计信息

```typescript
const stats = cache.getStats();
console.log('缓存统计:', stats);

// 输出示例:
{
  size: 15,              // 当前缓存条目数
  maxSize: 20,           // 最大缓存容量
  hits: 142,             // 缓存命中次数
  misses: 38,            // 缓存未命中次数
  hitRate: 78.89,        // 缓存命中率（%）
  oldestEntry: "video123:en",  // 最老条目的键
  oldestAge: 480000,     // 最老条目的年龄（毫秒）
  totalAccess: 180,      // 总访问次数
  evictions: 5           // 淘汰次数
}
```

### 重置统计

```typescript
cache.resetStats();
```

## 🎧 事件监听

### 事件类型

```typescript
type CacheEvent =
  | { type: 'HIT'; key: string; entry: CacheEntry }        // 缓存命中
  | { type: 'MISS'; key: string }                          // 缓存未命中
  | { type: 'SET'; key: string; entry: CacheEntry }       // 设置缓存
  | { type: 'DELETE'; key: string; reason: DeleteReason } // 删除缓存
  | { type: 'CLEAR'; reason: ClearReason };               // 清空缓存

type DeleteReason = 'TTL_EXPIRED' | 'LRU_EVICTED' | 'MANUAL';
type ClearReason = 'MANUAL' | 'FULL';
```

### 添加事件监听器

```typescript
// 监听所有缓存事件
cache.addEventListener((event) => {
  switch (event.type) {
    case 'HIT':
      console.log(`缓存命中: ${event.key}`, event.entry);
      break;
    case 'MISS':
      console.log(`缓存未命中: ${event.key}`);
      break;
    case 'SET':
      console.log(`缓存设置: ${event.key}`);
      break;
    case 'DELETE':
      console.log(`缓存删除: ${event.key}, 原因: ${event.reason}`);
      break;
    case 'CLEAR':
      console.log(`缓存清空, 原因: ${event.reason}`);
      break;
  }
});

// 移除事件监听器
const listener = (event) => { /* ... */ };
cache.addEventListener(listener);
cache.removeEventListener(listener);
```

## ⏰ 缓存时机详解

### 写入时机

1. **API 获取成功后**
   ```typescript
   // 位置: subtitle-fetcher.ts
   if (this.cache.enabled) {
     this.cache.set(videoId, language, parseResult.subtitle);
   }
   ```

2. **预加载完成后**
   ```typescript
   // 预加载内部调用 fetchSubtitle，成功后自动写入
   await this.fetchSubtitle(videoId, options);
   ```

3. **批量预热**
   ```typescript
   cache.warmup([
     { videoId: 'v1', language: 'en', subtitle: data1 },
     { videoId: 'v2', language: 'zh', subtitle: data2 }
   ]);
   ```

### 读取时机

1. **用户请求字幕时**
   ```typescript
   // 优先检查缓存
   const cached = this.cache.get(videoId, language);
   if (cached) {
     return { subtitle: cached, source: 'cache' };
   }
   ```

2. **状态查询时**
   ```typescript
   // Hook 层查询缓存状态
   const isCached = fetcher.isCached(videoId, language);
   ```

3. **事件发布时**
   ```typescript
   if (isCached) {
     store.publishEvent({ type: 'CACHE_HIT', videoId });
   }
   ```

### 清理时机

1. **自动清理 - TTL 过期**
   ```typescript
   // 每次访问时检查过期
   if (this.isExpired(entry)) {
     this.cache.delete(key);
     this.emit({ type: 'DELETE', key, reason: 'TTL_EXPIRED' });
   }
   ```

2. **自动清理 - LRU 淘汰**
   ```typescript
   // 容量超限时淘汰最老条目
   if (this.cache.size >= this.config.maxSize) {
     this.evictOldest();
   }
   ```

3. **手动清理**
   ```typescript
   // 用户主动清理
   cache.delete('video123');        // 清除特定视频
   cache.clear();                   // 清除所有缓存
   fetcher.clearCache('video123');  // 通过 fetcher 清理
   ```

## 🔧 高级功能

### 1. 动态配置更新

```typescript
// 运行时更新配置
cache.updateConfig({
  ttl: 30 * 60 * 1000,  // 更新为30分钟过期
  maxSize: 50           // 增加到50个条目
});

// 禁用缓存（会清空所有数据）
cache.updateConfig({ enabled: false });
```

### 2. 手动清理过期条目

```typescript
// 主动清理所有过期条目
cache.cleanup();
```

### 3. 获取缓存详情

```typescript
// 获取特定条目的详细信息（用于调试）
const details = cache.getEntryDetails('video123', 'en');
if (details) {
  console.log('访问次数:', details.accessCount);
  console.log('最后访问:', new Date(details.lastAccessed));
  console.log('缓存年龄:', Date.now() - details.timestamp);
}
```

### 4. 获取所有缓存键

```typescript
// 列出所有缓存键
const keys = cache.keys();
console.log('缓存键列表:', keys);
// 输出: ['video123:en', 'video456:zh', ...]
```

## 🧮 性能分析

### 时间复杂度

| 操作 | 平均时间复杂度 | 最坏情况 | 说明 |
|------|----------------|----------|------|
| get() | O(1) | O(n)* | Map 查询 + TTL 检查 |
| set() | O(1) - O(n) | O(n) | 可能触发 LRU 淘汰 |
| has() | O(1) | O(n)* | Map 查询 + TTL 检查 |
| delete() | O(1) - O(n) | O(n) | 单个删除 O(1)，批量删除 O(n) |
| clear() | O(1) | O(1) | Map.clear() 操作 |
| evictOldest() | O(n) | O(n) | 线性扫描查找最老条目 |

\* JavaScript Map 在极端情况下可能退化

### 空间复杂度

```
总内存使用 = 控制结构 + 索引结构 + 数据负载

控制结构: ~120 bytes (Map对象 + 配置 + 统计)
索引结构: ~(条目数 * 80) bytes (键 + CacheEntry对象)
数据负载: ~(条目数 * 平均字幕大小) bytes

示例计算:
- 20个条目，平均15KB字幕 = ~300KB 总内存
- 50个条目，平均10KB字幕 = ~500KB 总内存
```

### 性能优化建议

1. **合理设置 TTL**
   - 太短：频繁重新加载，失去缓存意义
   - 太长：内存占用过多，数据可能过时
   - 建议：5-30分钟，根据使用场景调整

2. **合理设置容量**
   - 太小：频繁淘汰，命中率低
   - 太大：内存占用过多
   - 建议：10-50个条目，根据设备内存调整

3. **监控缓存命中率**
   ```typescript
   const stats = cache.getStats();
   if (stats.hitRate < 50) {
     console.warn('缓存命中率过低，考虑调整配置');
   }
   ```

## 🛡️ 错误处理

### 事件监听器错误

```typescript
// 事件监听器错误不会影响缓存操作
cache.addEventListener((event) => {
  throw new Error('监听器错误');  // 错误会被捕获并记录
});

// 缓存操作依然正常
cache.set('video123', 'en', data);  // 正常执行
```

### 配置验证

```typescript
// 无效配置会使用默认值
const cache = new SubtitleCache({
  ttl: -1,        // 无效值，使用默认 10分钟
  maxSize: 0,     // 无效值，使用默认 20
  enabled: null   // 无效值，使用默认 true
});
```

## 🔮 扩展和自定义

### 1. 自定义事件处理

```typescript
class CustomCache extends SubtitleCache {
  constructor(config) {
    super(config);

    // 添加自定义监听器
    this.addEventListener((event) => {
      if (event.type === 'HIT') {
        // 发送缓存命中事件到分析服务
        analytics.track('cache_hit', { key: event.key });
      }
    });
  }
}
```

### 2. 持久化扩展

```typescript
class PersistentCache extends SubtitleCache {
  constructor(config) {
    super(config);
    this.loadFromStorage();
  }

  set(videoId, language, subtitle) {
    super.set(videoId, language, subtitle);
    this.saveToStorage();
  }

  private saveToStorage() {
    // 保存到 AsyncStorage 或其他持久化存储
  }

  private loadFromStorage() {
    // 从持久化存储恢复缓存
  }
}
```

### 3. 压缩存储

```typescript
class CompressedCache extends SubtitleCache {
  set(videoId, language, subtitle) {
    const compressed = this.compress(subtitle);
    super.set(videoId, language, compressed);
  }

  get(videoId, language) {
    const compressed = super.get(videoId, language);
    return compressed ? this.decompress(compressed) : null;
  }

  private compress(data) {
    // 实现数据压缩
  }

  private decompress(data) {
    // 实现数据解压缩
  }
}
```

## 📋 最佳实践

### 1. 生产环境配置

```typescript
const productionCache = new SubtitleCache({
  ttl: 15 * 60 * 1000,    // 15分钟过期
  maxSize: 30,            // 30个条目
  enabled: true,          // 启用缓存
  enableStats: true       // 启用统计用于监控
});
```

### 2. 开发环境配置

```typescript
const developmentCache = new SubtitleCache({
  ttl: 2 * 60 * 1000,     // 2分钟过期（快速测试）
  maxSize: 10,            // 较小容量
  enabled: true,
  enableStats: true
});
```

### 3. 测试环境配置

```typescript
const testCache = new SubtitleCache({
  ttl: 30 * 1000,         // 30秒过期（快速过期用于测试）
  maxSize: 5,             // 小容量便于测试淘汰逻辑
  enabled: true,
  enableStats: true
});
```

### 4. 监控和警报

```typescript
// 设置定期监控
setInterval(() => {
  const stats = cache.getStats();

  // 监控缓存命中率
  if (stats.hitRate < 60) {
    console.warn('缓存命中率过低:', stats.hitRate + '%');
  }

  // 监控内存使用
  if (stats.size > stats.maxSize * 0.9) {
    console.warn('缓存使用率过高:', stats.size + '/' + stats.maxSize);
  }

  // 发送监控数据
  analytics.track('cache_stats', stats);
}, 5 * 60 * 1000); // 每5分钟检查一次
```

## 🏁 总结

`SubtitleCache` 提供了一个完整、高效的字幕缓存解决方案：

✅ **功能完整**: 涵盖了缓存管理的所有核心功能
✅ **性能优异**: 基于高效的数据结构和算法
✅ **类型安全**: 完整的 TypeScript 类型支持
✅ **易于使用**: 简洁直观的 API 设计
✅ **高度可配置**: 灵活的配置选项
✅ **监控友好**: 详细的统计和事件系统
✅ **可扩展**: 支持自定义扩展和集成

这个缓存系统为字幕数据的高效管理提供了坚实的基础，显著提升了应用的性能和用户体验。