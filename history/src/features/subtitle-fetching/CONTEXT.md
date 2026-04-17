# Subtitle Data Source Feature Context

## 核心设计原则

**完整数据处理管道** - 承担所有字幕数据转换和优化工作：格式扁平化、时间单位保持、空白段插入、句子重编号，确保下游获得完全处理好的数据。

**时间单位统一架构** - 保持API原始秒单位，与视频播放器原生单位一致，消除所有数值转换开销和精度丢失。

**三层缓存架构** - L1内存缓存(LRU+TTL) + L2可选磁盘缓存 + L3网络API，实现高性能数据获取。

## 架构职责定位

**数据处理中心** - 唯一负责字幕数据获取和完整处理的层级：
- API调用和错误处理
- JSON解析和数据验证
- 格式转换（paragraphs → sentences扁平化）
- 时间优化（0.1秒提前显示，0.001秒精度间隙填充）
- 空白段智能插入
- 最终数据输出（SubtitleJson秒单位）

**依赖关系**:
```
组件调用 → DataSource.loadSubtitle() → 缓存检查 → API获取 → 完整处理 → Entity存储
```

## 数据处理流程

```
原始API数据(JSON字符串,秒)
    ↓
JSON.parse() → SubtitleRawJson
    ↓
数据处理管道:
├─ 格式扁平化 (paragraphs[] → sentences[])
├─ 时间排序保持 (保持原始秒单位)
├─ 时间优化 (提前0.1秒显示，避免重叠)
├─ 空白段插入 (0.001秒精度间隙检测)
└─ 重新编号 (sentences[i].index = i)
    ↓
完整SubtitleJson(所有时间为秒) → 缓存存储 → Entity层
```

## 核心模块架构

**SubtitleDataTransformer** - 数据处理核心：
```typescript
processSubtitleData(rawData: SubtitleRawJson): SubtitleJson
// 五步处理：扁平化→排序→时间优化→空白段插入→重编号
```

**SubtitleCache** - 高性能缓存：
```typescript
// LRU+TTL组合策略，缓存已处理的秒单位数据
get(videoId: string): SubtitleJson | null
set(videoId: string, data: SubtitleJson): void
```

**SubtitleFetcher** - 集成获取器：
```typescript
fetchSubtitle(videoId: string): Promise<SubtitleFetchResult>
// 缓存→API→处理→存储的完整流程
```

## 性能优化特征

**时间单位处理性能**:
- ✅ **零转换开销** - 移除所有`*1000`乘法运算（每字幕节省2N次运算）
- ✅ **精度保障** - 避免浮点数转换误差
- ✅ **语义统一** - 0.1秒替代100ms，语义更清晰

**缓存性能优化**:
- **Write-Around策略** - 直接写API，缓存未命中时才缓存
- **Cache-Aside模式** - 先查缓存，未命中查API
- **TTL+LRU组合** - 时间过期+访问频率的智能淘汰
- **实时统计** - 命中率、延迟、大小的性能监控

## 错误处理策略

**分层重试机制**:
- 指数退避重试（最多3-5次）
- 网络超时控制（30秒默认）
- 错误分类处理（网络错误vs数据错误）

**错误类型**:
- `SubtitleFetchError` - API调用和网络错误
- `DataTransformError` - 数据解析和处理错误

## Hook接口设计

**主要Hook** - `useSubtitleDataSource`:
```typescript
loadSubtitle(videoId: string, options: SubtitleLoadOptions): Promise<SubtitleLoadResult>
// 返回完全处理好的秒单位SubtitleJson数据
// 支持自动存储到Entity层 (autoStore: true)
```

**关键选项**:
- `autoStore: boolean` - 自动存储到entities/subtitle
- `setAsActive: boolean` - 设置为当前活跃字幕
- `enableCache: boolean` - 启用缓存功能
- `forceRefresh: boolean` - 强制从API刷新

## 技术亮点

**数据处理管道**:
- 支持legacy格式(paragraphs)和flat格式(sentences)的统一处理
- 0.001秒精度的时间间隙检测和空白段插入
- 智能重叠避免（前句end + 0.001秒）
- 连续编号保证（强制index = 0,1,2,3...）

**缓存架构创新**:
- 缓存已处理数据而非原始数据，避免重复处理开销
- 内存可控的大小估算和容量管理
- 统计驱动的性能监控和调试支持

**时间语义统一**:
- 所有函数参数明确标注"Seconds"
- 所有日志和调试信息使用秒单位
- 完全消除单位转换相关的bug风险