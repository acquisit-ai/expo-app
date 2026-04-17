# 方案A完整重构计划

## 重构目标

创建独立的 Video Meta Entity 作为 VideoMetaData 的 SSOT（Single Source of Truth），其他 Entity 只存储 videoId 引用。

### 核心原则
- ✅ 简单缓存：Map<videoId, VideoMetaData>，无淘汰策略
- ✅ 无持久化：纯内存缓存
- ✅ 完全重构：追求最佳结构，不考虑向后兼容
- ✅ 职责分离：数据管理 vs 列表管理

---

## 新架构设计

```
┌────────────────────────────────────────────────────────┐
│              Video Meta Entity (SSOT)                  │
│       Map<videoId, VideoMetaData>                      │
│                                                        │
│  - addVideo(video)                                     │
│  - addVideos(videos)                                   │
│  - updateVideo(id, updates)                            │
│  - getVideo(id)                                        │
│  - hasVideo(id)                                        │
│  - removeVideo(id)                                     │
│  - clear()                                             │
└────────────────────────────────────────────────────────┘
                           ↑
                           │ 写入/读取
         ┌─────────────────┼─────────────────┐
         ↓                 ↓                 ↓
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  Feed Entity   │  │ Video Entity   │  │ Player Pool    │
│                │  │                │  │                │
│ videoIds: []   │  │ currentVideoId │  │ Map<id, {      │
│ currentIndex   │  │ currentPlayer  │  │   player,      │
│ loading        │  │ playback       │  │   videoId      │
│ ...            │  │ session        │  │ }>             │
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## 文件清单

### 新建文件

```
src/entities/video-meta/
├── index.ts                    # 公共导出
├── model/
│   ├── store.ts               # Zustand store (简单 Map 缓存)
│   ├── types.ts               # 类型定义
│   └── selectors.ts           # 选择器
└── hooks/
    └── useVideoMetaActions.ts # 操作 Hook
```

### 需要重构的文件

#### Entity 层
- `src/entities/feed/model/types.ts` - 移除 VideoMetaData，改为 videoIds
- `src/entities/feed/model/store.ts` - 更新存储结构
- `src/entities/feed/hooks/useFeedActions.ts` - 移除 VideoMetaData 操作
- `src/entities/player-pool/model/types.ts` - PlayerMeta 只存 videoId
- `src/entities/player-pool/model/manager.ts` - 更新 acquire 逻辑
- `src/entities/video/model/types.ts` - 分离 videoId 和 player
- `src/entities/video/model/store.ts` - 更新状态结构
- `src/entities/video/model/selectors.ts` - 从 Video Meta 读取数据
- `src/entities/video/hooks/useVideoDataLogic.ts` - 更新数据流

#### Feature 层
- `src/features/feed-fetching/` - 存储到 Video Meta Entity
- `src/features/feed-list/` - 从 Video Meta 读取数据渲染
- `src/features/detail-interaction-bar/` - 更新 Video Meta
- `src/features/video-control-overlay/` - 从 Video Meta 读取
- `src/features/detail-info-display/` - 从 Video Meta 读取

#### Shared 层
- `src/shared/lib/video-utils.ts` - 移除 Feed 依赖，简化为纯工具函数

---

## 详细实施步骤

### Phase 1: 创建 Video Meta Entity（新）

#### 1.1 类型定义
**文件**: `src/entities/video-meta/model/types.ts`

```typescript
import type { VideoMetaData } from '@/shared/types';

/**
 * Video Meta Store
 * VideoMetaData 的 SSOT (Single Source of Truth)
 *
 * 设计原则：
 * - 简单缓存：使用 Map 结构，O(1) 查找
 * - 无淘汰策略：暂不实现 LRU
 * - 无持久化：纯内存缓存
 */
export interface VideoMetaStore {
  /** 视频缓存：Map<videoId, VideoMetaData> */
  videos: Map<string, VideoMetaData>;

  // === 基本操作 ===

  /** 添加单个视频 */
  addVideo: (video: VideoMetaData) => void;

  /** 批量添加视频 */
  addVideos: (videos: VideoMetaData[]) => void;

  /** 更新视频元数据（用于点赞、收藏等） */
  updateVideo: (videoId: string, updates: Partial<VideoMetaData>) => void;

  /** 获取视频元数据 */
  getVideo: (videoId: string) => VideoMetaData | null;

  /** 检查视频是否存在 */
  hasVideo: (videoId: string) => boolean;

  /** 移除单个视频 */
  removeVideo: (videoId: string) => void;

  /** 清空所有缓存 */
  clear: () => void;
}
```

#### 1.2 Store 实现
**文件**: `src/entities/video-meta/model/store.ts`

```typescript
import { create } from 'zustand';
import { log, LogType } from '@/shared/lib/logger';
import type { VideoMetaData } from '@/shared/types';
import type { VideoMetaStore } from './types';

/**
 * Video Meta Entity Store
 *
 * VideoMetaData 的唯一数据源
 * 其他 Entity (Feed/History/Favorites) 只存 videoId，使用时从这里读取
 */
export const useVideoMetaStore = create<VideoMetaStore>((set, get) => ({
  videos: new Map(),

  addVideo: (video) => {
    set((state) => {
      const newVideos = new Map(state.videos);
      newVideos.set(video.id, video);

      log('video-meta', LogType.DEBUG, `Added video: ${video.id} - ${video.title}`);

      return { videos: newVideos };
    });
  },

  addVideos: (videos) => {
    if (videos.length === 0) return;

    set((state) => {
      const newVideos = new Map(state.videos);

      videos.forEach(video => {
        newVideos.set(video.id, video);
      });

      log('video-meta', LogType.INFO, `Added ${videos.length} videos to cache`);

      return { videos: newVideos };
    });
  },

  updateVideo: (videoId, updates) => {
    set((state) => {
      const existing = state.videos.get(videoId);

      if (!existing) {
        log('video-meta', LogType.WARNING, `Cannot update non-existent video: ${videoId}`);
        return state;
      }

      const newVideos = new Map(state.videos);
      newVideos.set(videoId, { ...existing, ...updates });

      log('video-meta', LogType.DEBUG,
        `Updated video ${videoId}: ${JSON.stringify(updates)}`
      );

      return { videos: newVideos };
    });
  },

  getVideo: (videoId) => {
    return get().videos.get(videoId) ?? null;
  },

  hasVideo: (videoId) => {
    return get().videos.has(videoId);
  },

  removeVideo: (videoId) => {
    set((state) => {
      const newVideos = new Map(state.videos);
      const deleted = newVideos.delete(videoId);

      if (deleted) {
        log('video-meta', LogType.DEBUG, `Removed video: ${videoId}`);
      }

      return { videos: newVideos };
    });
  },

  clear: () => {
    log('video-meta', LogType.INFO, 'Clearing all video cache');
    set({ videos: new Map() });
  },
}));

// 开发环境调试
if (__DEV__) {
  (globalThis as any).__videoMetaStore = useVideoMetaStore;
}
```

#### 1.3 选择器
**文件**: `src/entities/video-meta/model/selectors.ts`

```typescript
import type { VideoMetaStore } from './types';
import type { VideoMetaData } from '@/shared/types';

/**
 * 获取单个视频
 */
export const selectVideo = (videoId: string) => (state: VideoMetaStore): VideoMetaData | null => {
  return state.videos.get(videoId) ?? null;
};

/**
 * 检查视频是否存在
 */
export const selectHasVideo = (videoId: string) => (state: VideoMetaStore): boolean => {
  return state.videos.has(videoId);
};

/**
 * 获取缓存大小
 */
export const selectCacheSize = (state: VideoMetaStore): number => {
  return state.videos.size;
};
```

#### 1.4 Hooks
**文件**: `src/entities/video-meta/hooks/useVideoMetaActions.ts`

```typescript
import { useVideoMetaStore } from '../model/store';

/**
 * Video Meta 操作 Hook
 * 提供便捷的操作方法
 */
export function useVideoMetaActions() {
  const store = useVideoMetaStore();

  return {
    addVideo: store.addVideo,
    addVideos: store.addVideos,
    updateVideo: store.updateVideo,
    getVideo: store.getVideo,
    hasVideo: store.hasVideo,
    removeVideo: store.removeVideo,
    clear: store.clear,
  };
}
```

#### 1.5 公共导出
**文件**: `src/entities/video-meta/index.ts`

```typescript
// Store
export { useVideoMetaStore } from './model/store';

// Types
export type { VideoMetaStore } from './model/types';

// Selectors
export {
  selectVideo,
  selectHasVideo,
  selectCacheSize,
} from './model/selectors';

// Hooks
export { useVideoMetaActions } from './hooks/useVideoMetaActions';
```

---

### Phase 2: 重构 Feed Entity

#### 2.1 更新类型定义
**文件**: `src/entities/feed/model/types.ts`

```typescript
/**
 * Feed Entity 数据模型
 *
 * ⚠️ 重构说明：
 * - Feed 不再存储 VideoMetaData 对象
 * - 只存储 videoId 数组
 * - VideoMetaData 统一由 Video Meta Entity 管理
 */

// ❌ 移除
// import type { VideoMetaData } from '@/shared/types';

export type FeedLoadingType = 'initial' | 'refresh' | 'loadMore' | null;

export interface FeedLoadingState {
  isLoading: boolean;
  error: string | null;
  loadingType: FeedLoadingType;
}

export interface FeedPlaybackState {
  /** 当前播放的视频索引（在 videoIds 数组中的位置） */
  currentFeedIndex: number;
  /** 当前可见的视频索引列表 */
  visibleIndexes: number[];
}

/**
 * Feed Store 状态管理接口
 */
export interface FeedStore {
  // ===== 状态数据 =====

  /** 视频 ID 队列（最多50条）*/
  videoIds: string[]; // ✅ 改：只存 ID，不存对象

  loading: FeedLoadingState;
  playback: FeedPlaybackState;

  // ===== 播放控制方法 =====

  setCurrentFeedIndex: (index: number) => void;
  updateVisibleIndexes: (indexes: number[]) => void;

  // ===== 状态管理方法 =====

  resetFeed: () => void;

  /** 添加新的视频 ID 到队列尾部 */
  appendVideoIds: (ids: string[]) => void; // ✅ 改：接收 ID 数组

  /** 维护滑动窗口大小(50条限制) */
  maintainWindowSize: () => void;

  setLoading: (isLoading: boolean, type?: 'refresh' | 'loadMore') => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // ===== 辅助方法 =====

  /** 获取当前播放的视频 ID */
  getCurrentVideoId: () => string | null; // ✅ 新增
}

export const FEED_CONSTANTS = {
  MAX_FEED_SIZE: 500,
  DEFAULT_COUNT: 10,
} as const;
```

#### 2.2 更新 Store 实现
**文件**: `src/entities/feed/model/store.ts`（关键修改）

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { log, LogType } from '@/shared/lib/logger';
import type {
  FeedStore,
  FeedLoadingState,
  FeedPlaybackState
} from './types';

const initialLoadingState: FeedLoadingState = {
  isLoading: false,
  error: null,
  loadingType: null,
};

const initialPlaybackState: FeedPlaybackState = {
  currentFeedIndex: 0,
  visibleIndexes: [],
};

export const useFeedStore = create<FeedStore>()(
  subscribeWithSelector((set, get) => ({
    // ===== 初始状态 =====
    videoIds: [], // ✅ 改：存 ID 数组
    loading: initialLoadingState,
    playback: initialPlaybackState,

    // ===== 状态重置 =====
    resetFeed: () => {
      log('feed-store', LogType.INFO, 'Resetting feed');
      set({
        videoIds: [],
        loading: initialLoadingState,
        playback: initialPlaybackState,
      });
    },

    // ===== 播放控制方法 =====
    setCurrentFeedIndex: (index: number) => {
      const state = get();

      if (index === state.playback.currentFeedIndex) {
        return;
      }

      if (index < 0 || index >= state.videoIds.length) {
        log('feed-store', LogType.WARNING, `Invalid feed index: ${index}`);
        return;
      }

      log('feed-store', LogType.DEBUG, `Setting current feed index: ${index}`);

      set((state) => ({
        playback: {
          ...state.playback,
          currentFeedIndex: index,
        },
      }));
    },

    updateVisibleIndexes: (indexes: number[]) => {
      set((state) => ({
        playback: {
          ...state.playback,
          visibleIndexes: indexes,
        },
      }));
    },

    // ===== 滑动窗口方法 =====
    appendVideoIds: (ids: string[]) => { // ✅ 改：接收 ID 数组
      if (ids.length === 0) {
        set((state) => ({
          loading: { ...state.loading, isLoading: false, loadingType: null },
        }));
        return;
      }

      set((state) => {
        const updatedIds = [...state.videoIds, ...ids];

        log('feed-store', LogType.DEBUG,
          `Appending ${ids.length} video IDs, total: ${updatedIds.length}`
        );

        return { videoIds: updatedIds };
      });

      get().maintainWindowSize();

      setTimeout(() => {
        set((state) => ({
          loading: { ...state.loading, isLoading: false, loadingType: null },
        }));
      }, 150);
    },

    maintainWindowSize: () => {
      const state = get();
      const MAX_SIZE = 500;

      if (state.videoIds.length <= MAX_SIZE) {
        return;
      }

      const itemsToRemove = state.videoIds.length - MAX_SIZE;
      const newIds = state.videoIds.slice(itemsToRemove);

      log('feed-store', LogType.INFO,
        `Maintaining window size: removed ${itemsToRemove} items`
      );

      set({ videoIds: newIds });
    },

    // ===== 状态管理方法 =====
    setLoading: (isLoading: boolean, type?: 'refresh' | 'loadMore') => {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading,
          loadingType: isLoading ? (type || 'initial') : null,
        },
      }));
    },

    setError: (error: string | null) => {
      set((state) => ({
        loading: {
          ...state.loading,
          error,
          isLoading: false,
          loadingType: null,
        },
      }));
    },

    clearError: () => {
      set((state) => ({
        loading: {
          ...state.loading,
          error: null,
        },
      }));
    },

    // ===== 辅助方法 =====
    getCurrentVideoId: () => { // ✅ 新增
      const state = get();
      return state.videoIds[state.playback.currentFeedIndex] ?? null;
    },
  }))
);
```

#### 2.3 更新选择器
**文件**: `src/entities/feed/model/selectors.ts`（新增）

```typescript
import type { FeedStore } from './types';

/** 获取当前播放的视频 ID */
export const selectCurrentVideoId = (state: FeedStore): string | null => {
  const { videoIds, playback } = state;
  return videoIds[playback.currentFeedIndex] ?? null;
};

/** 获取视频 ID 列表 */
export const selectVideoIds = (state: FeedStore): string[] => state.videoIds;

/** 获取加载状态 */
export const selectLoadingState = (state: FeedStore) => state.loading;

/** 获取播放状态 */
export const selectPlaybackState = (state: FeedStore) => state.playback;

/** 检查是否可以加载更多 */
export const selectCanLoadMore = (state: FeedStore): boolean => {
  return !state.loading.isLoading;
};
```

---

### Phase 3: 重构 Player Pool

#### 3.1 更新类型
**文件**: `src/entities/player-pool/model/types.ts`

```typescript
import type { VideoPlayer } from 'expo-video';

/**
 * Player Pool 中的播放器元数据
 *
 * ⚠️ 重构说明：
 * - 只存 videoId，不存 VideoMetaData 对象
 * - VideoMetaData 从 Video Meta Entity 获取
 */
export interface PlayerMeta {
  /** 播放器实例 */
  playerInstance: VideoPlayer;

  /** 视频 ID（null 表示空闲播放器）*/
  videoId: string | null; // ✅ 改：只存 ID
}

// ... 其他类型保持不变
```

#### 3.2 更新 Manager
**文件**: `src/entities/player-pool/model/manager.ts`（关键修改）

```typescript
// ✅ 改：导入 Video Meta Entity
import { useVideoMetaStore } from '@/entities/video-meta';

// 在 acquire 方法中
async acquire(videoId: string): Promise<VideoPlayer> {
  // ✅ 改：接收 videoId 而不是 VideoMetaData
  // ✅ 从 Video Meta Entity 获取数据
  const videoMetaStore = useVideoMetaStore.getState();
  const videoMetadata = videoMetaStore.getVideo(videoId);

  if (!videoMetadata) {
    throw new Error(`Video ${videoId} not found in Video Meta Entity`);
  }

  log('player-pool', LogType.DEBUG, `Acquiring player for video: ${videoId}`);

  this.stats.totalAcquires++;

  // 检查是否已缓存
  if (this.lruMap.has(videoId)) {
    log('player-pool', LogType.DEBUG, `Cache hit for video: ${videoId}`);
    this.stats.cacheHits++;

    const meta = this.lruMap.get(videoId)!;
    this.lruMap.delete(videoId);
    this.lruMap.set(videoId, meta);

    // ... 状态检查逻辑

    return meta.playerInstance;
  }

  // 缓存未命中，使用 LRU 替换
  const oldestKey = this.lruMap.keys().next().value;
  const oldestMeta = this.lruMap.get(oldestKey)!;

  const oldVideoId = oldestMeta.videoId; // ✅ 改：保存旧的 videoId

  // 立即更新 Map
  this.lruMap.delete(oldestKey);
  this.lruMap.set(videoId, oldestMeta);

  try {
    oldestMeta.playerInstance.pause();

    const videoUrl = videoMetadata.video_url;
    if (!videoUrl) {
      throw new Error(`Invalid video URL for video: ${videoId}`);
    }

    await oldestMeta.playerInstance.replaceAsync({
      uri: videoUrl,
      contentType: 'hls' as const,
      useCaching: false,
    });

    oldestMeta.videoId = videoId; // ✅ 改：只保存 ID

    log('player-pool', LogType.INFO,
      `Player acquired for video: ${videoId}, replaced: ${oldestKey}`);

    this.updatePoolStats();
    return oldestMeta.playerInstance;

  } catch (error) {
    // 失败时回滚
    this.lruMap.delete(videoId);
    this.lruMap.set(oldestKey, oldestMeta);

    // 恢复旧的 videoId
    oldestMeta.videoId = oldVideoId; // ✅ 改

    throw error;
  }
}

// 类似地更新 preloadOne 方法
async preloadOne(videoId: string, protectedPlayer?: VideoPlayer): Promise<void> {
  // ✅ 改：接收 videoId
  // ✅ 从 Video Meta Entity 获取数据
  const videoMetaStore = useVideoMetaStore.getState();
  const videoMetadata = videoMetaStore.getVideo(videoId);

  if (!videoMetadata) {
    log('player-pool', LogType.WARNING, `Cannot preload: video ${videoId} not in cache`);
    return;
  }

  // ... 后续逻辑类似
}
```

---

### Phase 4: 重构 Video Entity

#### 4.1 更新类型
**文件**: `src/entities/video/model/types.ts`

```typescript
import type { VideoPlayer } from 'expo-video';

/**
 * Video Entity State
 *
 * ⚠️ 重构说明：
 * - 分离 currentVideoId 和 currentPlayer
 * - 移除 currentPlayerMeta 复合类型
 * - VideoMetaData 从 Video Meta Entity 获取
 */
export interface VideoEntityState {
  /** 当前视频 ID */
  currentVideoId: string | null; // ✅ 改：分离存储

  /** 当前播放器实例 */
  currentPlayer: VideoPlayer | null; // ✅ 改：分离存储

  playback: VideoPlaybackState;
  session: VideoSessionState;
}

export interface VideoStore extends VideoEntityState {
  // ===== Actions =====

  /** 设置当前视频和播放器 */
  setCurrentVideo: (videoId: string, player: VideoPlayer) => void; // ✅ 改

  /** 清除当前视频 */
  clearCurrentVideo: () => void;

  updatePlayback: (updates: Partial<VideoPlaybackState>) => void;
  updateSession: (updates: Partial<VideoSessionState>) => void;
}

// VideoPlaybackState 和 VideoSessionState 保持不变
```

#### 4.2 更新 Store
**文件**: `src/entities/video/model/store.ts`

```typescript
export const useVideoStore = create<VideoStore>((set, get) => ({
  // === 状态 ===
  currentVideoId: null, // ✅ 改
  currentPlayer: null, // ✅ 改
  playback: initialPlaybackState,
  session: initialSessionState,

  // === Actions ===

  setCurrentVideo: (videoId, player) => { // ✅ 改
    log('video-entity', LogType.INFO, `Setting current video: ${videoId}`);

    set({
      currentVideoId: videoId,
      currentPlayer: player,
      playback: initialPlaybackState,
      session: {
        ...initialSessionState,
        viewStartTime: new Date()
      },
    });
  },

  clearCurrentVideo: () => {
    const currentId = get().currentVideoId;

    if (currentId) {
      log('video-entity', LogType.INFO, `Clearing current video: ${currentId}`);
    }

    set({
      currentVideoId: null,
      currentPlayer: null,
      playback: initialPlaybackState,
      session: initialSessionState,
    });
  },

  // updatePlayback 和 updateSession 保持不变
}));
```

#### 4.3 更新选择器
**文件**: `src/entities/video/model/selectors.ts`

```typescript
import { useVideoMetaStore } from '@/entities/video-meta';
import type { VideoMetaData } from '@/shared/types';
import type { VideoStore } from './types';

/** 获取当前视频 ID */
export const selectCurrentVideoId = (state: VideoStore): string | null => {
  return state.currentVideoId;
};

/** 获取当前播放器 */
export const selectCurrentPlayer = (state: VideoStore) => {
  return state.currentPlayer;
};

/** 获取当前视频元数据（从 Video Meta Entity）*/
export const selectCurrentVideoMetaData = (state: VideoStore): VideoMetaData | null => {
  const videoId = state.currentVideoId;
  if (!videoId) return null;

  // ✅ 从 Video Meta Entity 获取
  const videoMetaStore = useVideoMetaStore.getState();
  return videoMetaStore.getVideo(videoId);
};

/** 获取点赞状态 */
export const selectIsLiked = (state: VideoStore): boolean => {
  const video = selectCurrentVideoMetaData(state);
  return video?.isLiked ?? false;
};

/** 获取收藏状态 */
export const selectIsFavorited = (state: VideoStore): boolean => {
  const video = selectCurrentVideoMetaData(state);
  return video?.isFavorited ?? false;
};

// 其他选择器保持不变
```

---

### Phase 5: 更新 Features

#### 5.1 Feed Fetching
**文件**: `src/features/feed-fetching/hooks/useFeedFetchingLogic.ts`（新增）

```typescript
import { useEffect } from 'react';
import { useFeedQuery } from '../api/feed-query';
import { useVideoMetaActions } from '@/entities/video-meta';
import { useFeedActions } from '@/entities/feed';

/**
 * Feed 数据获取逻辑
 *
 * 职责：
 * 1. 从服务器获取数据（TanStack Query）
 * 2. 存储到 Video Meta Entity（SSOT）
 * 3. 存储 ID 到 Feed Entity（列表管理）
 */
export function useFeedFetchingLogic() {
  const feedQuery = useFeedQuery();
  const videoMetaActions = useVideoMetaActions();
  const feedActions = useFeedActions();

  useEffect(() => {
    if (!feedQuery.data?.videos) return;

    const videos = feedQuery.data.videos;

    // ✅ Step 1: 存储完整数据到 Video Meta Entity
    videoMetaActions.addVideos(videos);

    // ✅ Step 2: 只存 ID 到 Feed Entity
    feedActions.appendVideoIds(videos.map(v => v.id));
  }, [feedQuery.data]);

  return {
    isLoading: feedQuery.isLoading,
    error: feedQuery.error,
    refetch: feedQuery.refetch,
  };
}
```

#### 5.2 Feed List
**文件**: `src/features/feed-list/ui/FeedList.tsx`（修改）

```typescript
import { useFeedStore } from '@/entities/feed';
import { useVideoMetaStore } from '@/entities/video-meta';
import { selectVideoIds } from '@/entities/feed/model/selectors';

export const FeedList = () => {
  // 从 Feed Entity 获取 ID 列表
  const videoIds = useFeedStore(selectVideoIds);

  const renderItem = ({ item: videoId }: { item: string }) => {
    // ✅ 从 Video Meta Entity 获取数据
    const videoData = useVideoMetaStore(state => state.getVideo(videoId));

    if (!videoData) {
      // ID 存在但数据不存在（理论上不应该发生）
      console.warn(`Video data not found for ID: ${videoId}`);
      return null;
    }

    return <VideoCard video={videoData} />;
  };

  return (
    <FlatList
      data={videoIds}
      renderItem={renderItem}
      keyExtractor={(videoId) => videoId}
    />
  );
};
```

#### 5.3 Detail Interaction Bar
**文件**: `src/features/detail-interaction-bar/hooks/VideoInteractionContext.tsx`

```typescript
import { useVideoStore } from '@/entities/video';
import { useVideoMetaActions } from '@/entities/video-meta';
import { selectCurrentVideoId, selectIsLiked, selectIsFavorited } from '@/entities/video/model/selectors';

export const VideoInteractionProvider = ({ children }) => {
  const currentVideoId = useVideoStore(selectCurrentVideoId);
  const isLiked = useVideoStore(selectIsLiked);
  const isFavorited = useVideoStore(selectIsFavorited);

  const videoMetaActions = useVideoMetaActions();

  const toggleLike = useCallback(() => {
    if (!currentVideoId) return;

    // ✅ 直接更新 Video Meta Entity（SSOT）
    videoMetaActions.updateVideo(currentVideoId, {
      isLiked: !isLiked
    });
  }, [currentVideoId, isLiked, videoMetaActions]);

  const toggleFavorite = useCallback(() => {
    if (!currentVideoId) return;

    videoMetaActions.updateVideo(currentVideoId, {
      isFavorited: !isFavorited
    });
  }, [currentVideoId, isFavorited, videoMetaActions]);

  // ... 其他逻辑
};
```

#### 5.4 Video Data Logic
**文件**: `src/entities/video/hooks/useVideoDataLogic.ts`

```typescript
export const useVideoDataLogic = (): VideoDataActions => {
  const navigation = useNavigation<NavigationProp>();
  const videoStore = useVideoStore();

  const enterVideoDetail = useCallback(async (videoId: string) => {
    try {
      log('video-data-logic', LogType.INFO, `Entering video detail: ${videoId}`);

      // ✅ 改：Player Pool 的 acquire 现在接收 videoId
      const player = await playerPoolManager.acquire(videoId);

      // ✅ 改：Video Store 现在分离存储
      videoStore.setCurrentVideo(videoId, player);

      navigation.navigate('VideoStack', {
        screen: 'VideoFullscreen',
        params: {
          videoId,
          autoPlay: true,
        },
      });

      log('video-data-logic', LogType.INFO, `Successfully entered video detail: ${videoId}`);
    } catch (error) {
      log('video-data-logic', LogType.ERROR, `Failed to enter video detail: ${error}`);
      videoStore.clearCurrentVideo();
      throw error;
    }
  }, [navigation, videoStore]);

  // ... exitToFeed 等方法
};
```

---

### Phase 6: 简化 Shared Layer

**文件**: `src/shared/lib/video-utils.ts`

```typescript
/**
 * 视频工具函数
 * 纯函数，不依赖 Entity
 */

import type { VideoMetaData } from '@/shared/types';
import { log, LogType } from './logger';

/**
 * 切换视频点赞状态
 */
export function toggleVideoLike(videoMetaData: VideoMetaData): VideoMetaData {
  const updated = {
    ...videoMetaData,
    isLiked: !videoMetaData.isLiked,
  };

  log('video-utils', LogType.INFO,
    `Toggled like for ${videoMetaData.id}: ${updated.isLiked}`
  );

  return updated;
}

/**
 * 切换视频收藏状态
 */
export function toggleVideoFavorite(videoMetaData: VideoMetaData): VideoMetaData {
  const updated = {
    ...videoMetaData,
    isFavorited: !videoMetaData.isFavorited,
  };

  log('video-utils', LogType.INFO,
    `Toggled favorite for ${videoMetaData.id}: ${updated.isFavorited}`
  );

  return updated;
}

// ❌ 删除 updatePlayerMetaVideo（不再需要）
// ❌ 删除 useFeedStore 依赖
```

---

## 迁移检查清单

### Entity 层
- [ ] 创建 `src/entities/video-meta/` 完整结构
- [ ] 重构 Feed Entity 类型和 Store
- [ ] 重构 Player Pool 的 PlayerMeta 和 Manager
- [ ] 重构 Video Entity 状态结构
- [ ] 更新所有 Entity 的选择器

### Feature 层
- [ ] 更新 Feed Fetching 存储逻辑
- [ ] 更新 Feed List 渲染逻辑
- [ ] 更新 Detail Interaction Bar 点赞/收藏逻辑
- [ ] 更新 Video Control Overlay
- [ ] 更新 Detail Info Display
- [ ] 更新 Video Data Logic

### Shared 层
- [ ] 简化 video-utils.ts

### 测试验证
- [ ] 运行 TypeScript 类型检查
- [ ] 测试 Feed 加载和显示
- [ ] 测试视频播放
- [ ] 测试点赞/收藏功能
- [ ] 测试数据一致性

---

## 预期收益

1. **真正的 SSOT**: Video Meta Entity 是 VideoMetaData 的唯一数据源
2. **架构清晰**: 数据管理和列表管理职责分离
3. **易于扩展**: 新增 History/Favorites 只需存 videoId 数组
4. **性能优化**: Map 查找 O(1)，无重复数据
5. **代码简化**: 移除复杂的同步逻辑

---

## 实施时间估计

- Phase 1: 创建 Video Meta Entity - **30分钟**
- Phase 2: 重构 Feed Entity - **20分钟**
- Phase 3: 重构 Player Pool - **30分钟**
- Phase 4: 重构 Video Entity - **30分钟**
- Phase 5: 更新 Features - **40分钟**
- Phase 6: 简化 Shared - **10分钟**
- 测试验证 - **30分钟**

**总计**: 约 3 小时

开始实施？
