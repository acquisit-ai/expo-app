# Subtitle Data Source 使用指南

## 📋 快速开始

### 基础使用场景

`features/subtitle-fetching` 提供了两个主要的 Hook 接口，适用于不同的使用场景：

- **`useSubtitleLoader`**: 简化的字幕加载器，适合大多数常见场景
- **`useSubtitleDataSource`**: 完整的数据源控制，适合复杂的自定义需求

## 🎯 使用场景矩阵

| 场景 | 推荐 Hook | 配置重点 | 特殊考虑 |
|------|----------|----------|----------|
| 视频播放器集成 | `useSubtitleLoader` | `autoLoad: true` | 自动跟随视频切换 |
| 字幕管理面板 | `useSubtitleDataSource` | 完整控制 | 支持批量操作 |
| 预加载优化 | `useSubtitleDataSource` | `enablePrefetch: true` | 性能优先 |
| 错误处理重点 | 两者皆可 | `maxRetries` 配置 | 用户体验优先 |
| 开发调试 | `useSubtitleDataSource` | 详细状态访问 | 问题诊断 |

## 🚀 典型集成模式

### 模式一：视频播放器自动集成

**适用场景**: 标准视频播放器，需要自动加载和切换字幕

**核心特点**:
- 视频切换时自动加载字幕
- 与 video entity 状态自动同步
- 错误处理用户友好
- 性能优化自动启用

**关键配置**:
- `autoLoad: true` - 启用自动加载
- `autoLoadOnVideoChange: true` - 视频切换响应
- `defaultLanguage` - 设置默认语言偏好
- `maxRetries` - 网络错误重试策略

**状态管理**:
- 自动存储到 subtitle entity
- 自动设置活跃字幕
- 加载状态实时更新
- 错误状态用户可见

### 模式二：字幕管理控制台

**适用场景**: 字幕管理界面，需要完整的加载控制和状态监控

**核心特点**:
- 完整的加载状态访问
- 支持批量预加载
- 详细的缓存管理
- 丰富的统计信息

**关键配置**:
- `enablePrefetch: true` - 启用预加载队列
- `autoRetry: true` - 自动重试机制
- 自定义 `onSuccess`/`onError` 回调
- 缓存策略配置

**功能扩展**:
- 加载历史记录访问
- 详细缓存统计：命中率、淘汰次数、访问次数
- 缓存事件监听：HIT、MISS、SET、DELETE、CLEAR
- 高级缓存操作：手动清理、预热、配置更新
- 性能指标监控和警告
- 错误报告和诊断

### 模式三：性能优化重点

**适用场景**: 对加载性能有极高要求的应用

**核心特点**:
- 激进的预加载策略
- 智能缓存管理
- 并发请求优化
- 最小化网络延迟

**关键配置**:
- 大容量缓存配置（maxSize: 100+）
- 长缓存过期时间（ttl: 30+ 分钟）
- 启用缓存统计和事件监听
- 批量预加载策略和预热机制
- 后台加载不阻塞用户交互

**性能监控**:
- 加载时间统计
- 缓存效率分析
- 网络请求优化
- 用户体验指标

### 模式四：离线优先应用

**适用场景**: 需要支持离线使用的应用

**核心特点**:
- 本地缓存优先
- 网络错误容错
- 离线状态感知
- 数据同步策略

**关键配置**:
- 长期缓存策略
- 网络状态监控
- 离线回退机制
- 数据一致性保证

## ⚙️ 配置最佳实践

### 开发环境配置

**调试友好设置**:
- 启用详细日志
- 降低缓存时间便于测试
- 启用错误详情展示
- 性能指标监控

**开发环境特殊处理**:
- 自动加载示例数据
- 网络错误模拟
- 状态变化可视化
- 实时配置调整

### 生产环境配置

**性能优化设置**:
- 启用长期缓存
- 优化网络请求参数
- 启用预加载策略
- 错误报告收集

**稳定性保证**:
- 合理的重试策略
- 用户友好错误提示
- 降级策略启用
- 监控和告警配置

### 移动端优化配置

**网络环境适配**:
- 弱网络环境优化
- 流量消耗控制
- 电池使用优化
- 后台行为管理

**用户体验优化**:
- 加载进度展示
- 离线状态提示
- 网络切换响应
- 性能感知优化

## 🎛️ 高级配置选项

### 缓存策略自定义

**缓存时间策略 (TTL)**:
- 短期缓存：2-5分钟，适合频繁更新的内容
- 中期缓存：10-15分钟，适合一般使用场景
- 长期缓存：30-60分钟，适合稳定的字幕内容
- 持久缓存：数小时，适合离线优先场景

**缓存大小优化 (LRU)**:
- 小容量：5-10个条目，适合低内存设备
- 中容量：20-50个条目，适合一般应用
- 大容量：100+个条目，适合高性能需求
- 智能调整：基于内存压力动态调整容量

**缓存事件监听**:
```typescript
cache.addEventListener((event) => {
  switch (event.type) {
    case 'HIT':
      analytics.track('cache_hit', { key: event.key });
      break;
    case 'MISS':
      analytics.track('cache_miss', { key: event.key });
      break;
    case 'DELETE':
      if (event.reason === 'LRU_EVICTED') {
        console.warn('缓存容量不足，考虑扩容');
      }
      break;
  }
});
```

**高级缓存管理**:
```typescript
// 动态配置更新
cache.updateConfig({
  ttl: environment === 'offline' ? 60 * 60 * 1000 : 10 * 60 * 1000,
  maxSize: deviceMemory > 4 ? 100 : 50
});

// 性能监控和警告
setInterval(() => {
  const stats = cache.getStats();
  if (stats.hitRate < 60) {
    notificationService.warn('缓存效率低，建议调整配置');
  }
}, 300000); // 敐5分钟检查

// 智能预热策略
const popularVideos = await getPopularVideos();
cache.warmup(popularVideos.map(v => ({
  videoId: v.id,
  language: userPreferredLanguage,
  subtitle: v.preloadedSubtitle
})));
```

### 网络请求优化

**超时和重试配置**:
- 基于网络质量的动态超时
- 智能重试延迟策略
- 错误类型区分处理
- 最大重试次数限制

**并发控制策略**:
- 防重复请求保护
- 批量请求优化
- 优先级队列管理
- 资源使用限制

### 错误处理定制

**错误分类细化**:
- 网络错误细分
- 业务错误分类
- 用户错误处理
- 系统错误报告

**恢复策略配置**:
- 自动恢复机制
- 手动恢复选项
- 降级策略启用
- 用户引导支持

## 🔧 故障排除指南

### 常见问题诊断

**加载失败问题**:
1. 检查网络连接状态
2. 验证 API 端点配置
3. 查看错误日志详情
4. 测试 API 健康状态

**性能问题分析**:
1. 监控缓存命中率
2. 分析网络请求时间
3. 检查并发请求数量
4. 评估数据转换性能

**内存使用问题**:
1. 检查缓存大小配置
2. 监控内存使用增长
3. 验证资源清理机制
4. 分析数据结构大小

### 调试工具使用

**日志分析**:
- 启用详细日志级别
- 过滤关键错误信息
- 追踪请求生命周期
- 分析性能时间节点

**缓存状态检查**:
```typescript
// 实时状态监控
const stats = cache.getStats();
console.log('缓存状态:', {
  使用率: `${stats.size}/${stats.maxSize}`,
  命中率: `${stats.hitRate}%`,
  淘汰次数: stats.evictions,
  最老条目: stats.oldestEntry,
  最老年龄: `${Math.round(stats.oldestAge / 1000)}秒`
});

// 缓存健康检查
function checkCacheHealth() {
  const stats = cache.getStats();
  const issues = [];

  if (stats.hitRate < 50) {
    issues.push('命中率过低');
  }
  if (stats.evictions > stats.hits * 0.1) {
    issues.push('淘汰频繁，建议扩容');
  }
  if (stats.oldestAge > 30 * 60 * 1000) {
    issues.push('有过期数据，建议清理');
  }

  return { healthy: issues.length === 0, issues };
}

// 缓存数据导出（调试用）
function exportCacheState() {
  return {
    keys: cache.keys(),
    stats: cache.getStats(),
    config: cache.config,
    entries: cache.keys().map(key => {
      const [videoId, language] = key.split(':');
      return {
        key,
        details: cache.getEntryDetails(videoId, language)
      };
    })
  };
}
```

- 历史记录分析和趋势监控
- 缓存预热效果评估
- 错误状态诊断和恢复建议

**性能分析**:
- 加载时间测量
- 缓存效率评估
- 网络请求分析
- 用户体验指标

## 📊 监控和分析

### 关键指标监控

**用户体验指标**:
- 字幕加载成功率
- 平均加载时间
- 错误恢复时间
- 用户重试频率

**系统性能指标**:
- API 响应时间
- 缓存命中率
- 内存使用效率
- 网络请求优化

**业务指标追踪**:
- 字幕使用频率
- 语言偏好分布
- 错误类型统计
- 用户行为模式

### 数据收集策略

**自动收集**:
```typescript
// 统一的数据收集服务
class CacheAnalyticsCollector {
  constructor(private cache: SubtitleCache) {
    this.setupEventTracking();
    this.startPeriodicCollection();
  }

  private setupEventTracking() {
    this.cache.addEventListener((event) => {
      this.collectEvent({
        type: event.type,
        key: event.key,
        timestamp: Date.now(),
        ...('entry' in event ? {
          accessCount: event.entry.accessCount,
          age: Date.now() - event.entry.timestamp
        } : {})
      });
    });
  }

  private startPeriodicCollection() {
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60000); // 每分钟收集
  }

  private collectPerformanceMetrics() {
    const stats = this.cache.getStats();
    this.sendMetrics({
      timestamp: Date.now(),
      cacheSize: stats.size,
      hitRate: stats.hitRate,
      memoryUsage: this.estimateMemoryUsage(),
      evictionRate: stats.evictions / stats.totalAccess
    });
  }

  private estimateMemoryUsage(): number {
    // 估算缓存内存使用量
    const stats = this.cache.getStats();
    const avgEntrySize = 15000; // 平均字幕大小 15KB
    return stats.size * avgEntrySize;
  }
}
```

- 性能时间戳和负载分析
- 错误详细信息和堆栈追踪
- 缓存命中模式和访问热点分析
- 网络请求时序和性能监控

**用户行为**:
- 加载请求模式
- 重试行为分析
- 语言切换频率
- 错误处理响应

**系统状态**:
- 资源使用情况
- 配置参数效果
- 环境因素影响
- 版本性能对比

## 🚀 性能优化建议

### 加载性能优化

**预加载策略**:
- 基于用户行为预测
- 视频列表预加载
- 相关视频预加载
- 智能预加载队列

**缓存优化**:
```typescript
// 热点数据长期缓存策略
class HotDataCacheStrategy {
  constructor(private cache: SubtitleCache) {
    this.setupHotDataTracking();
  }

  private setupHotDataTracking() {
    this.cache.addEventListener((event) => {
      if (event.type === 'HIT') {
        this.trackHotData(event.key, event.entry);
      }
    });
  }

  private trackHotData(key: string, entry: CacheEntry) {
    // 访问次数超过阈值的数据标记为热点数据
    if (entry.accessCount > 10) {
      this.protectFromEviction(key);
    }
  }

  private protectFromEviction(key: string) {
    // 实现热点数据保护机制
    const [videoId, language] = key.split(':');
    const entry = this.cache.getEntryDetails(videoId, language);
    if (entry) {
      // 更新访问时间，防止 LRU 淘汰
      entry.lastAccessed = Date.now();
    }
  }
}

// 智能预热策略
class SmartPrefetchStrategy {
  async prefetchRelatedContent(currentVideoId: string) {
    // 基于用户习惯和内容关联性预测
    const relatedVideos = await this.predictNextVideos(currentVideoId);

    // 批量预加载，但不阻塞当前操作
    this.batchPrefetch(relatedVideos, {
      priority: 'background',
      maxConcurrency: 2
    });
  }

  private async predictNextVideos(videoId: string): Promise<string[]> {
    // 算法预测用户可能日问的视频
    return userBehaviorService.predictNextVideos(videoId);
  }
}
```

- 冷数据自动识别和清理
- 自适应缓存失效机制
- 基于使用模式的优化建议

### 网络性能优化

**请求优化**:
- 请求合并策略
- 并发请求控制
- 重试策略优化
- 超时时间调优

**数据传输优化**:
- 数据压缩启用
- 增量数据传输
- 协议版本选择
- CDN 加速利用

### 用户体验优化

**加载体验**:
- 进度反馈展示
- 预加载透明化
- 错误恢复引导
- 离线状态提示

**响应性优化**:
- 后台加载不阻塞
- 优先级队列管理
- 快速失败策略
- 用户操作响应

## 🔄 版本升级指南

### 向后兼容性

**缓存系统升级**:
```typescript
// 版本兼容性管理
class CacheVersionManager {
  private readonly CACHE_VERSION = '2.0.0';

  migrateCache(oldCache: any): SubtitleCache {
    const version = oldCache.version || '1.0.0';

    switch (version) {
      case '1.0.0':
        return this.migrateFromV1(oldCache);
      case '1.5.0':
        return this.migrateFromV15(oldCache);
      default:
        return new SubtitleCache(); // 创建新缓存
    }
  }

  private migrateFromV1(oldCache: any): SubtitleCache {
    const newCache = new SubtitleCache({
      ttl: oldCache.timeout || 10 * 60 * 1000,
      maxSize: oldCache.maxSize || 20,
      enabled: true,
      enableStats: true // V2 新增统计功能
    });

    // 迁移旧数据
    for (const [key, value] of Object.entries(oldCache.data || {})) {
      const [videoId, language] = key.split(':');
      newCache.set(videoId, language, value as SubtitleRawJson);
    }

    return newCache;
  }
}
```

**API 版本管理**:
- 版本号控制策略和自动协商
- 向后兼容保证和降级支持
- 渐进式升级和 A/B 测试
- 缓存数据格式迁移机制

**数据格式兼容**:
- 新旧缓存格式自动识别和转换
- 缓存版本检测和升级机制
- 数据一致性验证和修复
- 平滑迁移和回滚支持

### 功能升级策略

**新功能引入**:
- 功能开关控制
- 渐进式发布
- A/B 测试支持
- 用户反馈收集

**性能改进**:
- 基准测试对比
- 性能回归检测
- 优化效果验证
- 用户体验评估

---

**总结**: `features/subtitle-fetching` 提供了灵活而强大的字幕数据获取能力，特别是新的 `SubtitleCache` 类提供了企业级的缓存解决方案。通过合理的配置和使用模式，可以满足从简单到复杂的各种应用场景需求。

**核心亮点**:
- 🚀 **高性能**: LRU + TTL 策略，O(1) 访问时间
- 📊 **智能监控**: 完整的事件系统和统计分析
- ⚙️ **灵活配置**: 运行时动态调整和多实例支持
- 🔍 **全面诊断**: 丰富的调试工具和性能分析

建议根据具体的应用特点选择合适的集成模式，并结合缓存监控和优化策略持续改进用户体验。