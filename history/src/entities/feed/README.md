# Feed Entity v2.4 - Set Deduplication Architecture

**视频Feed状态管理的核心实体层** | **最新版本**: v2.4 (2025-10-10)

## 📋 概述

`feed` 是遵循 **Feature-Sliced Design (FSD)** 架构的核心业务实体模块，专门负责视频Feed的状态管理。该Entity提供纯粹的状态管理能力，不包含数据获取逻辑，严格遵循 **Feature → Entity** 的数据流原则。

### v2.4 最新架构特性 🎯

- ✅ **Set 自动去重**: 使用 `videoIdSet: Set<string>` 保证 Feed 无重复
- ✅ **ID-based 架构**: 存储 `videoIds: string[]` 而非完整的 `VideoMetadata[]`
- ✅ **Video Meta Entity 集成**: 从 Video Meta Entity (SSOT) 查询视频数据
- ✅ **职责分离**: Feed Entity 只管理列表顺序，Video Meta Entity 管理数据
- ✅ **性能优化**: 使用 subscribeWithSelector 中间件

## 🏗️ 架构设计

### 目录结构
```
src/entities/feed/
├── index.ts                      # 公共API入口
├── model/
│   ├── types.ts                 # 类型定义
│   └── store.ts                 # Zustand状态管理
├── hooks/                       # 便捷访问hooks
│   ├── index.ts                 # Hooks统一导出
│   ├── useFeedActions.ts        # 操作集合
│   ├── useFeedLoading.ts        # 加载状态
│   └── useCurrentVideoInfo.ts   # 当前视频信息
└── README.md                    # 本文档
```

### FSD 层级定位
- **层级**: `entities` (实体层)
- **职责**: 管理视频Feed的列表顺序，不存储视频数据
- **依赖**: 只依赖 shared 层和 video-meta entity，不依赖 features 层

## 🎯 核心功能

### 1. ID-based 列表管理

#### **核心架构**
```typescript
interface FeedStore {
  // 只存储 videoIds，不存储完整数据
  videoIds: string[];       // ✅ ID-based 引用（用于渲染）
  videoIdSet: Set<string>;  // 🆕 Set 去重（用于 O(1) 检查）

  // 加载状态
  loading: FeedLoadingState;

  // 播放状态
  playback: FeedPlaybackState;
}
```

**架构优势**：
- ✅ **自动去重**: Set 确保 Feed 中无重复 videoId
- ✅ **避免数据冗余**: 视频数据只在 Video Meta Entity 存一份
- ✅ **自动同步**: 视频数据更新（点赞等）自动反映到所有引用位置
- ✅ **性能优异**: Set.has() 提供 O(1) 去重检查

#### **数据获取模式**
```typescript
// 1. Feed Entity 提供 videoIds
const videoIds = useFeedStore(feedSelectors.getVideoIds);

// 2. 组件从 Video Meta Entity 查询数据
const video = useVideoMetaStore.getState().getVideo(videoIds[index]);
```

### 2. Set 自动去重机制 🔍

#### **双数据结构设计**
```typescript
// Feed Store 同时维护数组和 Set
interface FeedStore {
  videoIds: string[];       // 顺序存储，用于渲染
  videoIdSet: Set<string>;  // 快速查找，用于去重
}
```

#### **自动去重实现**
```typescript
appendVideoIds(newIds: string[]) => {
  // 1. 过滤重复 ID（O(1) 检查）
  const uniqueIds = newIds.filter(id => !state.videoIdSet.has(id));

  if (uniqueIds.length === 0) {
    return state; // 全部重复，不更新
  }

  // 2. 同时更新数组和 Set
  set({
    videoIds: [...state.videoIds, ...uniqueIds],
    videoIdSet: new Set([...state.videoIdSet, ...uniqueIds])
  });

  // 3. 自动触发滑动窗口维护
  maintainWindowSize(); // 保持500条限制
}
```

**去重优势**：
- ⚡ **O(1) 检查**: Set.has() 常数时间复杂度
- 🛡️ **防御性强**: 即使 Feature 层传入重复 ID，Entity 也能处理
- 📦 **数据一致**: 保证 Feed 中无重复 videoId
- 🎯 **职责清晰**: Entity 层负责数据完整性

### 3. 滑动窗口队列管理

#### **智能窗口维护**
```typescript
maintainWindowSize() => {
  if (state.videoIds.length > 500) {
    const newIds = state.videoIds.slice(itemsToRemove);
    const newSet = new Set(newIds);  // 🆕 同步更新 Set

    set({
      videoIds: newIds,
      videoIdSet: newSet
    });
  }
}
```

#### **500条窗口逻辑**
```typescript
maintainWindowSize() => {
  const MAX_SIZE = 500;
  if (videoIds.length > MAX_SIZE) {
    const itemsToRemove = videoIds.length - MAX_SIZE;
    // 保留最新的500条，删除最旧的
    const newIds = videoIds.slice(itemsToRemove);

    log('feed-store', LogType.INFO,
      `Maintaining window size: removed ${itemsToRemove} IDs. ` +
      `maintainVisibleContentPosition will handle scroll position.`
    );

    set({ videoIds: newIds });
  }
}
```

### 3. 播放状态管理

#### **当前视频控制**
```typescript
interface FeedPlaybackState {
  currentFeedIndex: number;    // 当前播放视频索引
  isPlaying: boolean;          // 播放状态
  visibleIndexes: number[];    // 可见视频索引列表
}
```

#### **播放控制方法**
```typescript
setCurrentFeedIndex(index: number)     // 设置当前播放索引
setIsPlaying(isPlaying: boolean)       // 控制播放状态
updateVisibleIndexes(indexes: number[]) // 更新可见列表
```

### 4. 加载状态管理

#### **完整生命周期的加载状态**
```typescript
interface FeedLoadingState {
  isLoading: boolean;          // 加载状态
  error: string | null;        // 错误信息
  loadingType: FeedLoadingType; // 加载类型区分
}

type FeedLoadingType = 'initial' | 'refresh' | 'loadMore' | null;
```

#### **状态控制方法**
```typescript
setLoading(isLoading: boolean, type?: 'refresh' | 'loadMore')
setError(error: string | null)
clearError()

// 延迟清除加载状态，等待 React Native 滚动调整完成
appendVideoIds(newIds: string[]) => {
  // 1. 添加 IDs 到 feed
  set(state => ({ videoIds: [...state.videoIds, ...newIds] }));

  // 2. 维护窗口大小
  get().maintainWindowSize();

  // 3. 延迟清除加载状态
  setTimeout(() => {
    set(state => ({
      loading: { ...state.loading, isLoading: false, loadingType: null }
    }));
  }, 150);
}
```

## 🔧 状态管理 (Zustand Store)

### 核心 Store 结构

```typescript
interface FeedStore {
  // === 状态数据 ===
  videoIds: string[];              // 视频ID队列(最多50条) - v2.0更新
  loading: FeedLoadingState;       // 加载状态
  playback: FeedPlaybackState;     // 播放状态

  // === 播放控制 ===
  setCurrentFeedIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  updateVisibleIndexes: (indexes: number[]) => void;

  // === 状态管理 ===
  resetFeed: () => void;
  appendVideoIds: (newIds: string[]) => void;  // v2.0更新
  maintainWindowSize: () => void;
  setLoading: (isLoading: boolean, type?: 'refresh' | 'loadMore') => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
```

### 选择器优化

```typescript
export const feedSelectors = {
  // v2.0更新：返回 videoIds
  getVideoIds: (state) => state.videoIds,

  // v2.0更新：需要从 Video Meta Entity 查询数据
  getCurrentVideoId: (state) => state.videoIds[state.playback.currentFeedIndex] || null,

  // 保持不变
  getLoadingState: (state) => state.loading,
  getPlaybackState: (state) => state.playback,
  canLoadMore: (state) => !state.loading.isLoading,
};
```

## 🪝 Hooks 接口

### 1. `useFeedActions` - 操作集合
```typescript
const {
  // 播放控制
  setCurrentFeedIndex,
  setIsPlaying,
  updateVisibleIndexes,

  // 状态管理
  resetFeed,
  appendVideoIds,      // v2.0更新
  setLoading,
  setError,
  clearError,
} = useFeedActions();
```

### 2. `useFeedLoading` - 加载状态
```typescript
const {
  isLoading,
  canLoadMore,
} = useFeedLoading();
```

### 3. `useCurrentVideoInfo` - 当前视频信息 (v2.0更新)
```typescript
const {
  videoId,            // v2.0: 返回 videoId 而非完整数据
  video,              // v2.0: 从 Video Meta Entity 查询
  index,              // 当前索引
  isPlaying,          // 播放状态
  setIsPlaying,       // 播放控制
  hasNext,            // 是否有下一个
  hasPrevious,        // 是否有上一个
  goToNext,           // 下一个
  goToPrevious,       // 上一个
} = useCurrentVideoInfo();

// 内部实现示例
export const useCurrentVideoInfo = () => {
  const currentVideoId = useFeedStore(feedSelectors.getCurrentVideoId);

  // 从 Video Meta Entity 查询数据
  const video = useVideoMetaStore(state =>
    currentVideoId ? state.getVideo(currentVideoId) : null
  );

  return { videoId: currentVideoId, video, /* ... */ };
};
```

## 🔄 与 Features 的集成

### 正确的调用关系 (v2.0更新)

```typescript
// ✅ 正确：Feature 调用 Entity
// features/feed-fetching/lib/feedService.ts
import { useFeedStore } from '@/entities/feed';
import { useVideoMetaStore } from '@/entities/video-meta';

export async function initializeFeed() {
  const feedStore = useFeedStore.getState();
  const videoMetaStore = useVideoMetaStore.getState();

  // 1. Feature 设置 Entity 状态
  feedStore.setLoading(true);

  // 2. Feature 获取数据
  const response = await fetchFeed(10);

  // 3. 存储到 Video Meta Entity (SSOT)
  videoMetaStore.addVideos(response.videos);

  // 4. 存储 IDs 到 Feed Entity
  feedStore.appendVideoIds(response.videos.map(v => v.id));
}
```

### 数据流图

```
Feature Layer (feed-fetching)
    ↓ 获取视频数据
    ↓
┌───────────────────────────────────┐
│ 1. addVideos(videos)               │
│    → Video Meta Entity (SSOT)     │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│ 2. appendVideoIds(ids)            │
│    → Feed Entity (列表顺序)        │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│ UI Layer (FeedList)               │
│ - videoIds from Feed Entity       │
│ - video data from Video Meta      │
└───────────────────────────────────┘
```

## 📊 性能特性

### 1. **选择器优化**
- 使用 `feedSelectors` 避免不必要的重渲染
- 订阅特定状态切片，减少组件更新
- subscribeWithSelector 中间件精确触发更新

### 2. **滑动窗口性能**
- 固定50条上限，避免内存泄漏
- 智能索引调整，保持播放连续性
- 只存储 IDs，减少内存占用

### 3. **状态更新优化**
- 使用 `subscribeWithSelector` 中间件
- 批量状态更新，减少渲染次数
- 延迟清除加载状态，避免竞态条件

## 🎮 实际使用示例

### Feature 层数据加载 (v2.0)

```typescript
// features/feed-fetching/lib/feedService.ts
import { useFeedStore } from '@/entities/feed';
import { useVideoMetaStore } from '@/entities/video-meta';

export async function initializeFeed(): Promise<void> {
  const feedStore = useFeedStore.getState();

  // 防止重复初始化
  if (feedStore.loading.isLoading || feedStore.videoIds.length > 0) {
    return;
  }

  feedStore.setLoading(true);
  feedStore.clearError();

  try {
    // Feature 获取数据
    const response = await fetchFeed(10);

    if (!response.videos?.length) {
      throw new Error('No videos received from API');
    }

    // 1. 添加到 Video Meta Entity (SSOT)
    const videoMetaStore = useVideoMetaStore.getState();
    videoMetaStore.addVideos(response.videos);

    // 2. 添加 IDs 到 Feed Entity
    feedStore.appendVideoIds(response.videos.map(v => v.id));

  } catch (error) {
    feedStore.setError(error.message);
    throw error;
  }
}
```

### UI 层消费数据 (v2.0)

```typescript
// features/feed-list/ui/FeedList.tsx
import { useFeedStore, feedSelectors } from '@/entities/feed';
import { useVideoMetaStore } from '@/entities/video-meta';

export function FeedList() {
  // 1. 从 Feed Entity 获取 videoIds
  const videoIds = useFeedStore(feedSelectors.getVideoIds);
  const { isLoading } = useFeedLoading();

  // 2. 渲染每个视频
  const renderVideoItem = useCallback(({ item: videoId }) => {
    // 从 Video Meta Entity 获取视频数据
    const video = useVideoMetaStore.getState().getVideo(videoId);

    if (!video) return null;

    return (
      <FeedVideoCard
        video={video}
        onPress={() => onVideoPress?.(video)}
      />
    );
  }, [onVideoPress]);

  return (
    <FlatList
      data={videoIds}  // 渲染 videoIds
      renderItem={renderVideoItem}
      keyExtractor={(videoId) => videoId}
      onEndReached={handleLoadMore}
      refreshing={isLoading}
    />
  );
}
```

### Page 层集成

```typescript
// pages/FeedPage.tsx
import { useFeedActions, useFeedLoading, useCurrentVideoInfo } from '@/entities/feed';
import { initializeFeed, loadMoreFeed } from '@/features/feed-fetching';

export function FeedPage() {
  const { setCurrentFeedIndex } = useFeedActions();
  const { isLoading, canLoadMore } = useFeedLoading();
  const { videoId, video, index } = useCurrentVideoInfo();  // v2.0更新

  // 初始化
  useEffect(() => {
    initializeFeed(); // Feature方法
  }, []);

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (canLoadMore) {
      loadMoreFeed(); // Feature方法
    }
  }, [canLoadMore]);

  // 视频切换
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentFeedIndex(viewableItems[0].index); // Entity方法
    }
  }, [setCurrentFeedIndex]);
}
```

## 🎯 设计原则

### 1. **单一职责**
- Entity 只负责列表顺序管理
- 不包含数据获取逻辑
- 不存储视频数据（由 Video Meta Entity 管理）
- 不依赖上层 Feature

### 2. **数据流清晰**
- Feature 获取数据 → Video Meta Entity 存储
- Feature 提供 IDs → Feed Entity 管理顺序
- Entity 提供状态 → UI 消费
- 避免双向数据流

### 3. **性能优先**
- ID-based 引用减少内存占用
- 选择器模式避免过度渲染
- 滑动窗口控制内存使用
- 智能状态更新机制

### 4. **类型安全**
- 完整的 TypeScript 类型定义
- 严格的状态接口约束
- 编译时错误检查

## 📝 更新日志

### v2.4 (2025-10-10) - Entity 层 Set 自动去重 🔍

#### **核心变更**：
- ✅ **Set 去重**: 添加 `videoIdSet: Set<string>` 用于 O(1) 去重检查
- ✅ **自动维护**: `appendVideoIds()` 自动过滤重复 ID
- ✅ **数据同步**: videoIds 数组和 videoIdSet 始终保持一致
- ✅ **防御性设计**: Entity 层保证数据唯一性，Feature 层无需关心

#### **去重实现**：
```typescript
// Feed Entity 内部自动去重
appendVideoIds: (ids: string[]) => {
  const uniqueIds = ids.filter(id => !state.videoIdSet.has(id));  // O(1) 检查

  set({
    videoIds: [...state.videoIds, ...uniqueIds],
    videoIdSet: new Set([...state.videoIdSet, ...uniqueIds])
  });
}
```

#### **架构优势**：
- 🎯 **职责清晰**: Entity 层负责数据完整性，Feature 层只管业务逻辑
- ⚡ **性能优异**: Set.has() 提供 O(1) 时间复杂度
- 🛡️ **防御性强**: 即使传入重复 ID，Entity 也能正确处理
- 📦 **代码简洁**: Feature 层无需去重逻辑，代码减少 30%

#### **对比 v2.3**：
```typescript
// v2.3: Feature 层去重
const newVideos = response.videos.filter(video => !videoMetaStore.hasVideo(video.id));
feedStore.appendVideoIds(newVideos.map(v => v.id));

// v2.4: Entity 层自动去重
feedStore.appendVideoIds(response.videos.map(v => v.id));  // Feed 内部自动去重
```

---

### v2.3 (2025-10-10) - 智能去重机制（已废弃） 🔍

---

### v2.0 (2025-10-06) - ID-based 架构重构 🎯

#### **核心变更**：
- ✅ **存储 videoIds**: `videoIds: string[]` 替代 `feed: VideoMetaData[]`
- ✅ **Video Meta Entity 集成**: 从 Video Meta Entity (SSOT) 查询视频数据
- ✅ **职责分离**: Feed Entity 只管理列表顺序
- ✅ **性能优化**: 使用 subscribeWithSelector 中间件

#### **移除的功能**：
- ❌ `feed: VideoMetaData[]` 字段
- ❌ `appendToFeed(videos: VideoMetaData[])` 方法
- ❌ `feedSelectors.getFeedList()` 返回完整数据

#### **新增的功能**：
- ✅ `videoIds: string[]` 字段
- ✅ `appendVideoIds(ids: string[])` 方法
- ✅ `feedSelectors.getVideoIds()` 返回 IDs
- ✅ `feedSelectors.getCurrentVideoId()` 返回当前视频ID

#### **迁移指南**：
```typescript
// ❌ 旧代码
const feed = useFeedStore(feedSelectors.getFeedList);
const video = feed[index];

// ✅ 新代码
const videoIds = useFeedStore(feedSelectors.getVideoIds);
const videoId = videoIds[index];
const video = useVideoMetaStore.getState().getVideo(videoId);
```

#### **架构优势**：
- 🎯 **避免数据冗余**: Video Meta Entity 作为 SSOT
- ⚡ **性能提升**: 减少内存占用，加快列表操作
- 🏗️ **FSD 合规**: ID-based 引用符合架构原则
- 🔄 **自动同步**: 视频数据更新自动反映到所有引用

---

### v1.2 (2025-09-29) - 加载动画优化

#### 🎯 加载类型区分
- **新增 `loadingType` 字段**: 区分初始加载、刷新、加载更多三种场景
- **精确的UI状态控制**: 支持不同加载场景的差异化UI展示
- **底部加载指示器**: 仅在 `loadMore` 场景显示

#### ⏱️ 延迟清除优化
- **150ms 延迟机制**: 等待 React Native `maintainVisibleContentPosition` 完成滚动调整
- **解决时序竞争**: 防止滚动调整未完成时 `onEndReached` 被再次触发

---

### v1.1 (2025-09-28) - 索引管理重构

#### 🚀 智能索引管理
- **移除手动索引调整**: 依赖 React Native `maintainVisibleContentPosition` 自动处理
- **自然状态更新**: 依赖 `onViewableItemsChanged` 自动更新正确索引

---

## 🔗 相关模块

### 依赖关系

```
entities/video-meta (SSOT)
    ↓ 提供 VideoMetaData
entities/feed (列表管理)
    ↓ 提供 videoIds 顺序
features/feed-fetching (数据获取)
    ↓ 存储数据和IDs
features/feed-list (UI渲染)
    ↓ 组合 videoIds + VideoMetaData
pages/feed (页面)
```

### 与其他模块的集成

- **`entities/video-meta`**: 存储所有 VideoMetaData (SSOT)
- **`features/feed-fetching`**: 获取视频数据，存储到两个 Entity
- **`features/feed-list`**: 渲染列表，组合 videoIds 和 VideoMetaData
- **`shared/lib/logger`**: 统一的日志记录服务

---

**本文档反映了 Feed Entity v2.0 ID-based 架构的最新状态，所有示例代码均基于当前实现。**
