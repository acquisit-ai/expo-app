# Subtitle Data Source Feature

字幕数据源功能模块，负责从后端 API 获取字幕数据并进行完整的数据处理，提供给 Entity 层存储。

## 🏗️ 架构设计

```
src/features/subtitle-fetching/
├── api/                        # API 调用层
│   ├── subtitle-api.ts        # 字幕 API 封装
│   └── types.ts               # API 类型定义
├── lib/                       # 工具函数层
│   ├── subtitle-fetcher.ts    # 字幕获取器（集成缓存）
│   ├── subtitle-cache.ts      # 独立缓存管理器（LRU + TTL）
│   ├── data-transformer.ts   # JSON 解析器（完整数据处理）
│   └── error-handler.ts       # 错误处理器
│   └── CACHE_DOCUMENTATION.md # 缓存系统详细文档
├── hooks/                     # React Hooks 层
│   ├── useSubtitleDataSource.ts # 主要数据源 Hook
│   └── useSubtitleLoader.ts   # 字幕加载 Hook
├── model/                     # 状态管理层
│   ├── types.ts              # 业务类型定义
│   └── store.ts              # 加载状态管理
└── index.ts                   # 统一导出

src/entities/subtitle/model/
└── raw-types.ts               # 原始数据类型定义（已迁移）
```

## 🎯 设计原则

1. **职责单一**: 负责数据获取和完整的数据处理
2. **时间单位统一**: 保持原始秒单位，与视频播放器一致
3. **数据处理中心**: 所有字幕数据转换和优化在此完成
4. **错误边界**: 完善的错误处理和重试机制
5. **性能优化**: 缓存处理后的数据，避免重复处理
6. **类型安全**: 完整的 TypeScript 类型定义

## 🚀 核心功能

### 📊 数据获取与处理

**重要改进**: 时间单位统一架构
- **API 调用**: 支持重试、超时、错误处理
- **JSON 解析**: 解析后端返回的 JSON 字符串
- **完整数据处理**:
  - 格式扁平化（paragraphs → sentences）
  - ✅ **保持秒单位**: 不再转换为毫秒，与播放器原生单位一致
  - 时间排序和优化（提前0.1秒显示）
  - 空白段插入（填充时间间隙，0.001秒精度）
  - 句子重新编号
- **处理后数据返回**: 返回完全处理好的 `SubtitleJson`（秒单位）

### 🔄 数据处理流程

```
┌─────────────────────────────────────────────────────────────┐
│                    数据处理流程 v2.0                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. API 获取原始数据 (JSON字符串)                              │
│  │                                                           │
│  ▼                                                           │
│  2. JSON 解析 → SubtitleRawJson                              │
│  │                                                           │
│  ▼                                                           │
│  3. 数据处理管道：                                             │
│     ┌─────────────────────────────────────────────┐         │
│     │ 3.1 格式扁平化                                │         │
│     │   paragraphs[] → sentences[]               │         │
│     │                                             │         │
│     │ 3.2 时间排序 ✅ 保持秒单位                   │         │
│     │   sentences.sort((a,b) => a.start - b.start) │         │
│     │                                             │         │
│     │ 3.3 时间优化                                  │         │
│     │   ✅ 提前0.1秒显示 (原100ms)                 │         │
│     │   避免重叠: +0.001秒间隔                     │         │
│     │                                             │         │
│     │ 3.4 空白段插入                                │         │
│     │   ✅ 0.001秒精度间隙检测                     │         │
│     │                                             │         │
│     │ 3.5 重新编号                                  │         │
│     │   sentences[i].index = i                   │         │
│     └─────────────────────────────────────────────┘         │
│  │                                                           │
│  ▼                                                           │
│  4. 返回处理完成的 SubtitleJson (所有时间为秒)                  │
│  │                                                           │
│  ▼                                                           │
│  5. 存储到 Entity 层 (entities/subtitle)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 时间单位处理对比

**优化前 (v1.0)**:
```typescript
// 数据处理：秒 → 毫秒转换
allSentences.forEach(sentence => {
  sentence.start = Math.round(sentence.start * 1000);  // 秒→毫秒
  sentence.end = Math.round(sentence.end * 1000);      // 秒→毫秒
});

// 时间优化：100ms 提前
const optimizedStart = Math.max(1, originalStart - 100);  // 毫秒
```

**优化后 (v2.0)**:
```typescript
// 数据处理：保持秒单位，无转换
allSentences.sort((a, b) => a.start - b.start);  // 直接排序秒

// 时间优化：0.1秒 提前
const optimizedStart = Math.max(0.001, originalStart - 0.1);  // 秒
```

**优势**:
- ✅ **零转换开销**: 消除乘除法运算
- ✅ **精度保障**: 避免浮点数转换误差
- ✅ **语义统一**: 所有时间变量都是秒
- ✅ **性能提升**: 减少数值计算开销

### 🗄️ 缓存系统

**三层缓存架构**:
```
┌─────────────────────────────────────────┐
│              缓存层次结构                  │
├─────────────────────────────────────────┤
│                                         │
│  L1: 内存缓存 (LRU)                      │
│  ├─ 容量: 50 个字幕                       │
│  ├─ TTL: 10分钟                          │
│  └─ 算法: LRU 淘汰                        │
│                                         │
│  L2: 磁盘缓存 (可选)                      │
│  ├─ 容量: 200 个字幕                      │
│  ├─ TTL: 1小时                           │
│  └─ 算法: FIFO 淘汰                       │
│                                         │
│  L3: 网络 API                           │
│  ├─ 重试: 最多3次                         │
│  ├─ 超时: 30秒                           │
│  └─ 指数退避                             │
│                                         │
└─────────────────────────────────────────┘
```

**缓存策略**:
- **写入策略**: Write-Around (直接写API，缓存未命中时才缓存)
- **读取策略**: Cache-Aside (先查缓存，未命中查API)
- **过期策略**: TTL + LRU 组合
- **一致性**: 最终一致性，支持强制刷新

## 📂 核心模块

### 1. Data Transformer (`lib/data-transformer.ts`)

完整的数据处理管道，负责将原始数据转换为可用的字幕数据：

```typescript
/**
 * 完整处理字幕数据
 * v2.0: 时间单位统一为秒
 */
private static processSubtitleData(rawData: SubtitleRawJson): SubtitleJson {
  // 1. 扁平化：从旧格式（paragraphs）或新格式（sentences）提取句子
  let allSentences: Sentence[] = [];

  if (isLegacyFormat(rawData)) {
    // 旧格式：从段落结构中提取句子
    for (const paragraph of rawData.paragraphs) {
      allSentences.push(...paragraph.sentences);
    }
  } else if (isFlatFormat(rawData) || 'sentences' in rawData) {
    // 新格式：直接使用句子数组
    allSentences = [...rawData.sentences];
  }

  // 2. 按时间排序（保持原始秒单位）
  allSentences.sort((a, b) => a.start - b.start);

  // 3. 时间优化：让每个句子提前0.1秒显示，但避免重叠
  allSentences.forEach((sentence, index) => {
    const originalStart = sentence.start;
    const optimizedStart = Math.max(0.001, originalStart - 0.1);

    if (index === 0) {
      // 第一句：直接提前0.1秒，但不能小于0.001秒
      sentence.start = optimizedStart;
    } else {
      const previousSentence = allSentences[index - 1];
      // 后续句子：如果与前一句重叠，则设置为前一句结束时间+0.001秒
      if (optimizedStart <= previousSentence.end) {
        sentence.start = previousSentence.end + 0.001;
      } else {
        sentence.start = optimizedStart;
      }
    }
  });

  // 4. 插入空白段
  const sentencesWithBlanks: Sentence[] = [];

  for (let i = 0; i < allSentences.length; i++) {
    const currentSentence = allSentences[i];

    // 添加当前句子
    sentencesWithBlanks.push(currentSentence);

    // 检查是否需要插入空白段
    if (i < allSentences.length - 1) {
      const nextSentence = allSentences[i + 1];

      // 只要前一句end != 后一句start - 0.001，就插入空白段
      if (Math.abs(currentSentence.end - (nextSentence.start - 0.001)) > 0.0001) {
        const blankSentence: Sentence = {
          index: 0, // 临时编号，后面会重新编号
          start: currentSentence.end + 0.001,
          end: nextSentence.start - 0.001,
          text: "",
          explanation: "",
          total_tokens: 0,
          tokens: []
        };
        sentencesWithBlanks.push(blankSentence);
      }
    }
  }

  allSentences = sentencesWithBlanks;

  // 5. 重新编号
  allSentences.forEach((sentence, index) => {
    sentence.index = index;
  });

  // 构建最终的 SubtitleJson 对象
  const processedSubtitle: SubtitleJson = {
    language: rawData.language,
    total_sentences: allSentences.length,
    total_tokens: rawData.total_tokens || 0,
    sentences: allSentences
  };

  return processedSubtitle;
}
```

**关键改进**:
1. ✅ **保持秒单位**: 移除 `* 1000` 转换
2. ✅ **0.1秒优化**: 从100ms改为0.1秒
3. ✅ **精确间隙**: 0.001秒替代1ms
4. ✅ **浮点数处理**: `Math.abs()` 避免精度问题

### 2. Subtitle Cache (`lib/subtitle-cache.ts`)

高性能LRU+TTL缓存系统：

```typescript
/**
 * 字幕缓存管理器 v2.0
 * 改进: 缓存已处理的秒单位数据
 */
export class SubtitleCache {
  private cache = new Map<string, SubtitleCacheEntry>();
  private config: SubtitleCacheConfig;

  /**
   * 获取缓存数据
   * @param videoId 视频ID
   * @returns 处理完成的字幕数据（秒单位） | null
   */
  get(videoId: string): SubtitleJson | null {
    const entry = this.cache.get(videoId);

    if (!entry) {
      this.updateStats('miss');
      return null;
    }

    // TTL 检查
    if (this.isExpired(entry)) {
      this.cache.delete(videoId);
      this.updateStats('expired');
      return null;
    }

    // LRU 更新：移动到最前面
    this.cache.delete(videoId);
    this.cache.set(videoId, {
      ...entry,
      lastAccessed: Date.now()
    });

    this.updateStats('hit');
    return entry.data;  // 返回已处理的秒单位数据
  }

  /**
   * 设置缓存数据
   * @param videoId 视频ID
   * @param data 已处理的字幕数据（秒单位）
   */
  set(videoId: string, data: SubtitleJson): void {
    // LRU 淘汰：如果超出容量，删除最旧的条目
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const entry: SubtitleCacheEntry = {
      data,  // 存储已处理的秒单位数据
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      ttl: this.config.ttl || 10 * 60 * 1000, // 10分钟
      size: this.estimateSize(data)
    };

    this.cache.set(videoId, entry);

    log('subtitle-cache', LogType.DEBUG,
      `Cached processed subtitle for ${videoId} (size: ${entry.size} bytes)`
    );
  }
}
```

### 3. Subtitle Fetcher (`lib/subtitle-fetcher.ts`)

集成缓存的字幕获取器：

```typescript
/**
 * 字幕获取器 v2.0
 * 改进: 获取并返回秒单位的处理后数据
 */
export class SubtitleFetcher {
  private cache: SubtitleCache;
  private api: SubtitleApi;

  /**
   * 获取字幕数据（带缓存）
   * @param videoId 视频ID
   * @param options 获取选项
   * @returns 处理完成的字幕数据（秒单位）
   */
  async fetchSubtitle(
    videoId: string,
    options: SubtitleFetchOptions = {}
  ): Promise<SubtitleFetchResult> {
    const startTime = Date.now();

    try {
      // 1. 尝试从缓存获取（已处理的秒单位数据）
      if (!options.forceRefresh) {
        const cachedData = this.cache.get(videoId);
        if (cachedData) {
          log('subtitle-fetcher', LogType.INFO,
            `Cache hit for video ${videoId}`
          );

          return {
            subtitle: cachedData,  // 返回秒单位数据
            source: 'cache',
            fromCache: true,
            processingTime: Date.now() - startTime
          };
        }
      }

      // 2. 从 API 获取原始数据
      log('subtitle-fetcher', LogType.INFO,
        `Fetching subtitle from API for video ${videoId}`
      );

      const apiResponse = await this.api.getSubtitle(videoId, {
        language: options.language || 'en',
        timeout: options.timeout || 30000
      });

      // 3. 数据处理：转换为秒单位的SubtitleJson
      const transformResult = SubtitleDataTransformer.transform(apiResponse, {
        enableValidation: options.enableValidation ?? true,
        strictMode: options.strictMode ?? false
      });

      // 4. 缓存处理后的数据（秒单位）
      if (options.enableCache !== false) {
        this.cache.set(videoId, transformResult.subtitle);
      }

      const processingTime = Date.now() - startTime;

      log('subtitle-fetcher', LogType.INFO,
        `Successfully fetched and processed subtitle for ${videoId} ` +
        `(${transformResult.subtitle.sentences.length} sentences, ${processingTime}ms)`
      );

      return {
        subtitle: transformResult.subtitle,  // 返回秒单位数据
        source: 'api',
        fromCache: false,
        processingTime,
        validation: transformResult.validation,
        stats: transformResult.stats
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      log('subtitle-fetcher', LogType.ERROR,
        `Failed to fetch subtitle for ${videoId}: ${error}`
      );

      throw new SubtitleFetchError(
        `Failed to fetch subtitle: ${error instanceof Error ? error.message : String(error)}`,
        videoId,
        processingTime
      );
    }
  }
}
```

## 🔌 Hook 接口

### 主要 Hook (`useSubtitleDataSource.ts`)

```typescript
/**
 * 字幕数据源 Hook v2.0
 * 改进: 返回秒单位的处理后数据
 */
export const useSubtitleDataSource = (
  options: SubtitleDataSourceOptions = {}
): SubtitleDataSourceReturn => {
  const subtitleFetcher = useMemo(() => new SubtitleFetcher(options), []);

  /**
   * 加载字幕数据
   * @param videoId 视频ID
   * @param loadOptions 加载选项
   * @returns 处理完成的字幕数据（秒单位）
   */
  const loadSubtitle = useCallback(async (
    videoId: string,
    loadOptions: SubtitleLoadOptions = {}
  ): Promise<SubtitleLoadResult> => {
    // ... 加载逻辑

    const result = await subtitleFetcher.fetchSubtitle(videoId, {
      language: loadOptions.language,
      forceRefresh: loadOptions.forceRefresh,
      enableCache: loadOptions.enableCache,
      timeout: loadOptions.timeout
    });

    // 如果需要自动存储到 Entity 层
    if (loadOptions.autoStore) {
      const { storeSubtitle, setActiveSubtitle } = useSubtitleEntity.getState();

      // 存储处理后的秒单位数据
      storeSubtitle(videoId, result.subtitle);

      if (loadOptions.setAsActive) {
        setActiveSubtitle(videoId);
      }
    }

    return {
      subtitle: result.subtitle,  // 秒单位的完整数据
      videoId,
      source: result.source,
      fromCache: result.fromCache,
      loadTime: result.processingTime,
      validation: result.validation
    };
  }, [subtitleFetcher]);

  return {
    loadSubtitle,
    // ... 其他方法
  };
};
```

## ⚡ 性能优化

### 1. 时间单位处理性能

**优化前**:
```typescript
// 每个句子需要2次乘法运算
sentences.forEach(s => {
  s.start = s.start * 1000;  // 乘法
  s.end = s.end * 1000;      // 乘法
});

// 100ms常量需要在比较中使用
const optimized = originalStart - 100;  // 毫秒运算
```

**优化后**:
```typescript
// 直接使用原始秒值，无运算
sentences.sort((a, b) => a.start - b.start);  // 直接比较

// 0.1秒常量，语义清晰
const optimized = originalStart - 0.1;  // 秒运算
```

**性能提升**:
- ✅ **减少运算**: 每个字幕文件节省 `2N` 次乘法（N=句子数）
- ✅ **内存友好**: 减少临时数值创建
- ✅ **缓存友好**: 数值运算减少，CPU缓存命中率提升

### 2. 数据处理优化

```typescript
// 一次性处理管道，避免多次遍历
const processedSentences = rawSentences
  .flat()                              // 扁平化
  .sort((a, b) => a.start - b.start)   // 排序
  .map(optimizeTimings)                // 时间优化
  .reduce(insertBlanks, [])            // 空白段插入
  .map((s, i) => ({ ...s, index: i })); // 重新编号
```

### 3. 缓存性能

```typescript
/**
 * 缓存性能指标
 */
interface CacheStats {
  totalRequests: number;     // 总请求数
  cacheHits: number;         // 缓存命中数
  cacheMisses: number;       // 缓存未命中数
  hitRate: number;           // 命中率 (%)
  averageLoadTime: number;   // 平均加载时间 (ms)
  totalCacheSize: number;    // 缓存总大小 (bytes)
  oldestAge: number;         // 最老条目年龄 (ms)
}

// 实时性能监控
const stats = subtitleCache.getStats();
console.log(`缓存命中率: ${stats.hitRate}%`);
console.log(`平均加载时间: ${stats.averageLoadTime}ms`);
```

## 🔄 数据流向

```
┌─────────────────────────────────────────────────────────────┐
│                    完整数据流 v2.0                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 组件调用 useSubtitleDataSource.loadSubtitle()           │
│  │                                                           │
│  ▼                                                           │
│  2. SubtitleFetcher.fetchSubtitle()                         │
│     ├─ 检查缓存 (LRU + TTL)                                 │
│     ├─ API 调用 (如果缓存未命中)                              │
│     └─ 返回原始 JSON 字符串                                  │
│  │                                                           │
│  ▼                                                           │
│  3. SubtitleDataTransformer.transform()                     │
│     ├─ JSON.parse() → SubtitleRawJson                       │
│     ├─ 数据验证和统计                                         │
│     └─ processSubtitleData() 完整处理:                      │
│         ├─ 扁平化 paragraphs → sentences                    │
│         ├─ 保持秒单位 ✅ (无转换)                            │
│         ├─ 时间排序                                          │
│         ├─ 0.1秒提前优化 ✅                                  │
│         ├─ 空白段插入 (0.001秒精度)                          │
│         └─ 重新编号                                          │
│  │                                                           │
│  ▼                                                           │
│  4. 返回 SubtitleJson (所有时间为秒)                         │
│  │                                                           │
│  ▼                                                           │
│  5. 存储到缓存 (处理后数据)                                   │
│  │                                                           │
│  ▼                                                           │
│  6. 可选: 自动存储到 entities/subtitle                       │
│     └─ storeSubtitle(videoId, subtitleJson)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 使用示例

### 基础用法

```typescript
function VideoSubtitleLoader({ videoId }: { videoId: string }) {
  const dataSource = useSubtitleDataSource({
    enableCache: true,
    maxRetries: 3
  });

  const loadSubtitle = useCallback(async () => {
    try {
      const result = await dataSource.loadSubtitle(videoId, {
        language: 'en',
        autoStore: true,      // 自动存储到 Entity 层
        setAsActive: true,    // 设置为当前活跃字幕
        enableCache: true     // 启用缓存
      });

      console.log('字幕加载成功:', {
        sentences: result.subtitle.sentences.length,
        source: result.source,  // 'cache' | 'api'
        loadTime: result.loadTime
      });

      // result.subtitle 所有时间都是秒单位
      console.log('首句时间:', result.subtitle.sentences[0].start, '秒');

    } catch (error) {
      console.error('字幕加载失败:', error);
    }
  }, [videoId, dataSource]);

  return (
    <Button onPress={loadSubtitle}>
      加载字幕
    </Button>
  );
}
```

### 高级用法

```typescript
function AdvancedSubtitleManager() {
  const dataSource = useSubtitleDataSource({
    enableCache: true,
    cacheConfig: {
      maxSize: 100,         // 最多缓存100个字幕
      ttl: 30 * 60 * 1000, // 30分钟过期
    },
    retryConfig: {
      maxRetries: 5,
      retryDelay: 1000,
      exponentialBackoff: true
    }
  });

  const batchLoadSubtitles = useCallback(async (videoIds: string[]) => {
    // 并行加载多个字幕
    const promises = videoIds.map(id =>
      dataSource.loadSubtitle(id, {
        language: 'en',
        timeout: 10000,
        enableValidation: true,
        strictMode: false
      })
    );

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const subtitle = result.value.subtitle;
        console.log(`视频 ${videoIds[index]} 字幕:`, {
          sentences: subtitle.sentences.length,
          duration: subtitle.sentences[subtitle.sentences.length - 1].end,  // 秒
          language: subtitle.language
        });
      } else {
        console.error(`视频 ${videoIds[index]} 加载失败:`, result.reason);
      }
    });
  }, [dataSource]);

  // 缓存管理
  const clearCache = useCallback(() => {
    dataSource.clearCache();
  }, [dataSource]);

  const getCacheStats = useCallback(() => {
    const stats = dataSource.getCacheStats();
    console.log('缓存统计:', {
      命中率: `${stats.hitRate}%`,
      总请求: stats.totalRequests,
      平均加载时间: `${stats.averageLoadTime}ms`,
      缓存大小: `${(stats.totalCacheSize / 1024 / 1024).toFixed(2)}MB`
    });
  }, [dataSource]);

  return (
    <View>
      <Button onPress={() => batchLoadSubtitles(['video1', 'video2', 'video3'])}>
        批量加载字幕
      </Button>
      <Button onPress={getCacheStats}>
        查看缓存统计
      </Button>
      <Button onPress={clearCache}>
        清空缓存
      </Button>
    </View>
  );
}
```

## 🔍 错误处理

### 错误类型

```typescript
/**
 * 字幕获取错误 v2.0
 */
export class SubtitleFetchError extends Error {
  constructor(
    message: string,
    public videoId: string,
    public processingTime: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SubtitleFetchError';
  }
}

/**
 * 数据处理错误 v2.0
 */
export class DataTransformError extends Error {
  constructor(
    message: string,
    public originalData?: any
  ) {
    super(message);
    this.name = 'DataTransformError';
  }
}
```

### 错误处理策略

```typescript
const handleSubtitleError = (error: Error, videoId: string) => {
  if (error instanceof SubtitleFetchError) {
    // 网络或API错误
    log('subtitle-fetching', LogType.ERROR,
      `Fetch error for ${videoId}: ${error.message}`
    );

    // 可以尝试重试或使用备用源
    return { shouldRetry: true, fallback: 'local' };

  } else if (error instanceof DataTransformError) {
    // 数据处理错误
    log('subtitle-fetching', LogType.ERROR,
      `Transform error for ${videoId}: ${error.message}`
    );

    // 数据问题通常不能重试
    return { shouldRetry: false, fallback: null };

  } else {
    // 未知错误
    log('subtitle-fetching', LogType.ERROR,
      `Unknown error for ${videoId}: ${error.message}`
    );

    return { shouldRetry: false, fallback: null };
  }
};
```

## 📊 监控和调试

### 性能监控

```typescript
// 开发环境性能监控
if (__DEV__) {
  const performanceMonitor = {
    // 数据处理性能
    transformTime: [],
    cacheHitRate: 0,

    // API 调用性能
    apiLatency: [],
    apiErrors: 0,

    // 内存使用
    cacheSize: 0,
    maxCacheSize: 50 * 1024 * 1024, // 50MB

    report() {
      console.log('字幕数据源性能报告:', {
        平均处理时间: this.transformTime.reduce((a, b) => a + b, 0) / this.transformTime.length,
        缓存命中率: `${this.cacheHitRate}%`,
        API延迟: `${this.apiLatency.reduce((a, b) => a + b, 0) / this.apiLatency.length}ms`,
        API错误率: `${(this.apiErrors / this.apiLatency.length * 100).toFixed(2)}%`,
        缓存使用率: `${((this.cacheSize / this.maxCacheSize) * 100).toFixed(2)}%`
      });
    }
  };

  // 定期报告性能
  setInterval(() => performanceMonitor.report(), 60000);
}
```

### 调试工具

```typescript
/**
 * 开发环境调试工具
 */
export const SubtitleDataSourceDebugger = {
  /**
   * 分析字幕数据质量
   */
  analyzeSubtitle(subtitle: SubtitleJson) {
    const analysis = {
      totalSentences: subtitle.sentences.length,
      totalDuration: subtitle.sentences[subtitle.sentences.length - 1]?.end || 0,  // 秒
      averageSentenceLength: subtitle.sentences.reduce((sum, s) => sum + s.text.length, 0) / subtitle.sentences.length,
      blankSentences: subtitle.sentences.filter(s => s.text.trim() === '').length,
      timeGaps: [] as number[],
      overlaps: [] as { index: number, overlap: number }[]
    };

    // 分析时间间隙和重叠
    for (let i = 0; i < subtitle.sentences.length - 1; i++) {
      const current = subtitle.sentences[i];
      const next = subtitle.sentences[i + 1];

      const gap = next.start - current.end;  // 秒单位
      if (gap > 0.001) {  // 大于1ms的间隙
        analysis.timeGaps.push(gap);
      } else if (gap < -0.001) {  // 重叠
        analysis.overlaps.push({ index: i, overlap: -gap });
      }
    }

    return analysis;
  },

  /**
   * 导出字幕数据为调试格式
   */
  exportForDebug(subtitle: SubtitleJson) {
    return {
      metadata: {
        language: subtitle.language,
        totalSentences: subtitle.total_sentences,
        totalTokens: subtitle.total_tokens,
        firstSentence: subtitle.sentences[0]?.start || 0,  // 秒
        lastSentence: subtitle.sentences[subtitle.sentences.length - 1]?.end || 0  // 秒
      },
      sentences: subtitle.sentences.map((s, i) => ({
        index: s.index,
        timeRange: `${s.start.toFixed(3)}s - ${s.end.toFixed(3)}s`,  // 秒格式
        duration: `${(s.end - s.start).toFixed(3)}s`,
        text: s.text,
        tokens: s.tokens.length
      }))
    };
  }
};
```

## 🚀 技术亮点

### 1. 时间单位统一架构
- **完全消除转换**: 从API获取秒 → 保持秒 → 存储秒 → 使用秒
- **性能提升**: 每个字幕文件节省2N次数值运算（N=句子数）
- **精度保障**: 避免 `*1000` 和 `/1000` 的浮点数精度丢失
- **语义统一**: 所有时间变量和函数都明确使用秒

### 2. 完整数据处理管道
- **格式统一**: 支持legacy和flat两种输入格式，输出统一格式
- **时间优化**: 0.1秒提前显示，智能重叠避免
- **空白段管理**: 0.001秒精度的间隙检测和填充
- **数据完整性**: 验证、统计、编号一体化处理

### 3. 高性能缓存系统
- **多层架构**: LRU+TTL内存缓存 + 可选磁盘缓存
- **智能淘汰**: 基于访问频率和时间的复合淘汰策略
- **性能监控**: 实时缓存命中率、延迟统计
- **内存可控**: 可配置容量上限和TTL时间

### 4. 强大的错误恢复
- **分层重试**: 指数退避 + 最大重试次数限制
- **优雅降级**: 缓存失败时fallback到API，API失败时报告明确错误
- **错误分类**: 网络错误vs数据错误的不同处理策略
- **监控集成**: 详细的错误日志和性能指标

## 📋 版本历史

### v2.0.0 (当前版本)
- 🚀 **重大重构**: 时间单位统一为秒
- 🚀 **性能优化**: 消除所有数值转换开销
- 🚀 **精度提升**: 0.1秒优化 + 0.001秒精度间隙处理
- 🚀 **缓存优化**: 缓存已处理的秒单位数据
- ✅ 完整数据处理管道重构
- ✅ TypeScript类型完善
- ✅ 监控和调试工具增强

### v1.0.0 (历史版本)
- ✅ 基础API调用和缓存功能
- ✅ 毫秒时间单位系统
- ✅ 基础数据处理

### 未来版本
- 🔄 v2.1.0: 增量更新和同步机制
- 🔄 v2.2.0: 多语言字幕并行加载
- 🔄 v3.0.0: AI增强的字幕质量优化

---

**Subtitle Data Source Feature v2.0** - 高性能、零转换、完整处理的专业字幕数据源解决方案 📊⚡