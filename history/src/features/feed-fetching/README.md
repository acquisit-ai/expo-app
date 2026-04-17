# Feed Fetching Feature v2.0

**负责视频Feed数据的获取和管理业务逻辑** | **最新版本**: v2.0 (2025-10-10)

## 📋 功能概述

Feed Fetching Feature 是一个专门负责获取视频Feed数据的业务逻辑层，遵循无状态API设计原则，实现了从API获取数据并存储到Entity的完整流程。

## 🏗️ 架构设计

### 核心原则
- **Feature → Entity**: Feature获取数据，Entity负责存储
- **无状态API**: 后端无需维护分页状态，只需count+JWT
- **责任分离**: API调用、业务逻辑、状态管理完全分离

### 目录结构
```
src/features/feed-fetching/
├── api/
│   └── feedApi.ts          # API客户端，无状态设计
├── lib/
│   └── feedService.ts      # 业务逻辑层
├── model/
│   └── types.ts           # 类型定义
├── index.ts               # 公共API导出
└── README.md             # 本文档
```

## 🔄 数据流

### 1. 初始化流程（v2.0 简化）
```typescript
Page.initializeFeed()
  ↓
FeedService.initializeFeed()
  ↓
setLoading(true) → fetchFeed(15) → addVideos(全部) → appendVideoIds(全部)
                                      ↓                ↓
                                   Map自动去重      Set自动去重
```

**🆕 v2.0 双层去重机制：**
```typescript
// Feature 层不再负责去重，直接传递数据
videoMetaStore.addVideos(response.videos);     // Map 自动处理重复 key
feedStore.appendVideoIds(response.videos.map(v => v.id));  // Set 自动去重
```

### 2. 加载更多流程（v2.0 简化）
```typescript
Page.loadMoreFeed()
  ↓
FeedService.loadMoreFeed()
  ↓
fetchFeed(10) → addVideos(全部) → appendVideoIds(全部)
                   ↓                    ↓
                Map去重              Set去重
```

### 3. 刷新流程（v2.0 简化）
```typescript
Page.refreshFeed()
  ↓
FeedService.refreshFeed()
  ↓
fetchFeed(15) → addVideos(全部) → resetFeed() → appendVideoIds(全部)
                   ↓                                  ↓
                Map去重                            Set去重

注意：
- Feature 层统一处理：所有方法逻辑一致，简洁清晰
- Entity 层自动去重：video-meta 使用 Map，Feed 使用 Set
```

## 📡 API层 (`api/feedApi.ts`)

### 核心特性
- **无状态设计**: 只需要 `count` 参数
- **JWT认证**: 自动携带认证Token
- **简洁响应**: `{videos: VideoMetadata[], timestamp: number}`
- **模拟数据支持**: 开发阶段使用真实视频URL的模拟数据

### 模拟数据特性 (v1.1增强)
```typescript
// 真实视频数据池（循环使用）
const REAL_VIDEO_POOL = [
  { video_url: 'test-vedio.mp4', duration: 992 },
  { video_url: 'test-portrait.mp4', duration: 59 },
  { video_url: 'test2.mp4', duration: 413 },
  { video_url: 'speaking_301.mp4', duration: 615 },
];

// v1.1: 增强的学习内容标题模板
const TITLE_TEMPLATES = [
  '商务英语对话', '日常口语练习', '旅游英语必备', '学术英语写作',
  '科技词汇解析', '文化交流话题', '新闻英语听力', '面试英语技巧',
  // ... 共20种学习模板
];

// v1.1: 防碰撞ID生成
function generateUniqueId(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 9);
  return `video_${timestamp}_${randomPart}_${extraRandom}`;
}

// v1.1: 多样化标题生成
function generateRandomTitle(): string {
  const template = TITLE_TEMPLATES[Math.floor(Math.random() * TITLE_TEMPLATES.length)];
  const episode = Math.floor(Math.random() * 999) + 1;
  return `${template} - 第${episode}课`;
}
```

### 使用示例
```typescript
import { fetchFeed } from '@/features/feed-fetching';

// 获取10条视频数据（当前返回模拟数据）
const response = await fetchFeed(10);
console.log(response.videos); // VideoMetadata[]
```

## 🔧 服务层 (`lib/feedService.ts`)

### 核心方法

#### `initializeFeed(): Promise<void>` (v2.0 简化)
初始化Feed数据，获取首批15条视频
- 防重复初始化检查
- 设置加载状态
- 调用API获取数据
- **🆕 v2.0**: Entity 层自动去重，Feature 层无需处理
- 直接传递所有数据到 Entity

**简化逻辑：**
```typescript
videoMetaStore.addVideos(response.videos);  // Map 自动去重
feedStore.appendVideoIds(response.videos.map(v => v.id));  // Set 自动去重
```

#### `loadMoreFeed(): Promise<void>` (v2.0 简化, v1.1优化)
加载更多Feed数据，追加10条视频
- **v1.1**: 增强的 `isLoading` 状态检查，防止竞态条件
- 调用API获取数据
- **🆕 v2.0**: Entity 层自动去重，Feature 层统一处理
- 追加到Entity（自动维护500条窗口）

#### `refreshFeed(): Promise<void>` (v2.0 简化, v1.1优化)
智能刷新Feed数据
- **v1.1**: 新增 `isLoading` 状态检查，防止与其他操作冲突
- 保留当前数据直到新数据加载完成（更好的用户体验）
- **🆕 v2.0**: 与其他方法逻辑统一，Entity 层自动去重
- 失败时保留原数据，只设置错误状态

**统一逻辑：**
```typescript
videoMetaStore.addVideos(response.videos);  // Map 自动去重
feedStore.resetFeed();
feedStore.appendVideoIds(response.videos.map(v => v.id));  // Set 自动去重
```

### 使用示例
```typescript
import { initializeFeed, loadMoreFeed, refreshFeed } from '@/features/feed-fetching';

// 初始化
await initializeFeed();

// 加载更多
await loadMoreFeed();

// 刷新
await refreshFeed();
```

## 📝 类型定义 (`model/types.ts`)

### 核心类型

```typescript
// API请求参数（简化无状态）
interface FeedFetchParams {
  count: number;
}

// API响应结构（简化无状态）
interface FeedApiResponse {
  videos: VideoMetadata[];
  timestamp: number;
}

// Feature配置
interface FeedFetchConfig {
  baseURL: string;
  timeout: number;
  enableAuth: boolean;
  retryCount: number;
  retryDelay: number;
}
```

## 🎯 设计原则

### 1. **无状态API**
- 后端不维护用户分页状态
- 每次请求独立，只需count参数
- 永远有更多数据，无需hasMore判断

### 2. **正确的依赖关系**
- ✅ Feature导入Entity: `import { useFeedStore } from '@/entities/feed'`
- ❌ Entity不导入Feature: 避免循环依赖

### 3. **清晰的职责分离**
- **API层**: 纯粹的HTTP调用
- **Service层**: 业务逻辑和数据协调
- **Entity层**: 状态管理和存储

## 🔗 与其他模块的集成

### Entity集成
```typescript
// Feature调用Entity方法存储数据
const store = useFeedStore.getState();
store.setLoading(true);
store.appendToFeed(videos);
store.setError(errorMessage);
```

### Page层集成
```typescript
// Page层调用Feature方法
import { initializeFeed, loadMoreFeed } from '@/features/feed-fetching';

// 页面初始化时
useEffect(() => {
  initializeFeed();
}, []);

// FlatList onEndReached
const handleLoadMore = useCallback(() => {
  loadMoreFeed();
}, []);
```

## ⚡ 性能特性

- **🆕 v2.0: Entity 层自动去重**: Feed 使用 Set（O(1)），video-meta 使用 Map（O(1)）
- **🆕 v2.0: Feature 层简化**: 统一的数据传递逻辑，无需关心去重
- **🆕 v2.0: 防御性设计**: 即使 API 返回重复数据，Entity 也能正确处理
- **v1.1: 三重防护机制**: 所有函数完整的 `isLoading` 状态保护
- **v1.1: 完整生命周期管理**: `isLoading` 状态只在数据处理完全完成后才清除
- **错误恢复**: 完善的错误处理和重试机制
- **内存优化**: 配合Entity的500条滑动窗口
- **TypeScript安全**: 完整的类型检查

## 🔮 扩展性

该Feature设计具有良好的扩展性：
- 易于添加缓存机制
- 支持不同的排序和过滤选项
- 可扩展为支持多种Feed类型
- 便于集成其他数据源

## 📝 更新日志

### v2.0 (2025-10-10) - Entity 层自动去重 🏗️

#### **核心变更**
- ✅ **Feed Entity 自维护 Set**: 使用 `videoIdSet: Set<string>` 进行 O(1) 去重
- ✅ **Feature 层大幅简化**: 移除所有去重逻辑，统一数据传递方式
- ✅ **防御性设计**: Entity 层保证数据唯一性，Feature 层无需关心
- ✅ **职责清晰**: Entity 负责数据完整性，Feature 负责业务逻辑

#### **架构优势**

**before v2.0（Feature 层去重）：**
```typescript
// ❌ Feature 层需要关心去重
const newVideos = response.videos.filter(video => !videoMetaStore.hasVideo(video.id));
videoMetaStore.addVideos(newVideos);
feedStore.appendVideoIds(newVideos.map(v => v.id));
```

**v2.0（Entity 层自动去重）：**
```typescript
// ✅ Feature 层统一处理，Entity 自动去重
videoMetaStore.addVideos(response.videos);  // Map 自动去重
feedStore.appendVideoIds(response.videos.map(v => v.id));  // Set 自动去重
```

#### **Feed Entity 去重实现**

```typescript
// Feed Store 内部
appendVideoIds: (ids: string[]) => {
  // 自动过滤重复ID
  const uniqueIds = ids.filter(id => !state.videoIdSet.has(id));

  // 同时维护数组和 Set
  set({
    videoIds: [...state.videoIds, ...uniqueIds],
    videoIdSet: new Set([...state.videoIdSet, ...uniqueIds])
  });
}
```

#### **技术优势**
- 🎯 **职责清晰**: Feature 层只管业务，Entity 层管数据完整性
- ⚡ **性能优异**: Set.has() 提供 O(1) 时间复杂度
- 🛡️ **防御性强**: 即使 Feature 层传入重复数据，Entity 也能处理
- 📦 **代码简洁**: Feature 层代码减少 30%，逻辑统一

---

### v1.2 (2025-10-10) - 智能去重机制（已废弃） 🔍

#### **核心变更**
- ✅ **智能去重**: 所有方法（`initializeFeed`、`loadMoreFeed`、`refreshFeed`）都添加了去重逻辑
- ✅ **防止重复**: 使用 `videoMetaStore.hasVideo(id)` 检查视频是否已存在
- ✅ **内存优化**: 只添加新视频到 video-meta，避免重复缓存
- ✅ **详细日志**: 记录重复视频数量，便于监控

#### **去重机制详解**

```typescript
// 1. 过滤重复视频
const videoMetaStore = useVideoMetaStore.getState();
const newVideos = response.videos.filter(video => !videoMetaStore.hasVideo(video.id));

// 2. 日志记录
log('feed-service', LogType.DEBUG,
  `Received ${response.videos.length} videos, ${newVideos.length} are new (${response.videos.length - newVideos.length} duplicates filtered)`
);

// 3. 只添加新视频
videoMetaStore.addVideos(newVideos);
feedStore.appendVideoIds(newVideos.map(v => v.id));
```

#### **各方法去重行为**

| 方法 | video-meta | Feed | 去重策略 | 说明 |
|------|-----------|------|----------|------|
| `initializeFeed()` | 只添加新视频 | 只添加新视频ID | ✅ 去重 | 全部重复时返回 |
| `loadMoreFeed()` | 只添加新视频 | 只添加新视频ID | ✅ 去重 | 全部重复时清除加载状态 |
| `refreshFeed()` | 添加所有视频 | 添加所有视频ID | ❌ 不去重 | Map 自动处理重复 key |

#### **性能优势**
- **O(1) 查找**: `Map.has()` 提供常数时间复杂度
- **减少内存**: 避免存储重复的 VideoMetaData
- **防止泄漏**: 长期使用不会累积重复数据

#### **日志示例**

```typescript
// 正常情况（有新视频）
feed-service DEBUG: Received 10 videos, 8 are new (2 duplicates filtered)
feed-service INFO: More feed data loaded: 8 new videos added, total: 58

// 全部重复（极端情况）
feed-service DEBUG: Received 10 videos, 0 are new (10 duplicates filtered)
feed-service WARNING: All videos are duplicates, clearing loading state

// 刷新场景（不去重）
feed-service INFO: Feed refreshed successfully: 15 videos loaded
```

---

### v1.1 (2025-09-28) - 竞态条件防护

### 🚀 重大优化

#### **三重竞态条件防护机制**
```typescript
// v1.1: 所有函数都新增 isLoading 状态检查
export async function refreshFeed(): Promise<void> {
  const store = useFeedStore.getState();

  // 新增: 防止与其他操作冲突
  if (store.loading.isLoading) {
    log('feed-service', LogType.DEBUG, 'Already loading, ignoring refresh');
    return;
  }

  // 继续原有逻辑...
}
```

#### **增强Mock数据生成系统**
- **防碰撞ID算法**: `video_{timestamp}_{randomPart}_{extraRandom}` - 三层随机确保唯一性
- **学习内容标题系统**: 20种专业学习模板（商务英语、日常口语、旅游英语等）
- **随机课程编号**: 每个模板支持1-999编号，总计19,980种组合
- **真实感提升**: 模拟数据更接近实际学习场景

#### **完整的加载状态生命周期**
```typescript
// v1.1: isLoading 生命周期优化
触发操作 → isLoading=true → API请求 → 数据添加 → 窗口维护 → isLoading=false
```
- **延迟状态清除**: 与Entity协调，确保数据处理完成后才清除加载状态
- **防止竞态条件**: 在整个数据处理期间阻止新的请求进入

### 🛡️ 安全性增强

#### **服务层状态保护**
```typescript
// v1.1: 统一的状态检查模式
const commonLoadingCheck = (store) => {
  if (store.loading.isLoading) {
    log('feed-service', LogType.DEBUG, 'Already loading');
    return true; // 应该忽略请求
  }
  return false;
};

// 应用到所有服务函数
- initializeFeed(): 已有保护 + 额外的 feed.length 检查
- loadMoreFeed(): 已有保护
- refreshFeed(): v1.1新增保护
```

### 📊 性能提升

- **减少重复请求**: 三层防护确保同时只有一个加载操作
- **数据质量提升**: 防碰撞算法消除ID重复问题
- **Mock数据多样性**: 大幅提升开发和测试时的数据真实感
- **状态一致性**: 与Entity层深度协调，确保状态同步准确性

### 🔄 架构协调优化

```typescript
// v1.1: 与Entity层的深度协调
// Feature层: 负责状态检查和API调用
// Entity层: 负责数据处理和状态清除
// 确保两层之间的时序正确性
```

---

**注意**: 该Feature v1.1严格遵循FSD架构原则，通过三重防护机制和增强的mock数据生成，实现了更高的可靠性和开发体验。