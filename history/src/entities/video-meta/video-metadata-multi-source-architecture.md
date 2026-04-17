# VideoMetaData 多来源架构设计

## 问题：Feed Entity 作为唯一源的局限性

### 用户场景分析

用户可以从多个入口观看视频：
1. **Feed 流**: 主推荐流
2. **历史记录**: 观看过的视频列表
3. **收藏夹**: 用户收藏的视频列表
4. **搜索结果**: 搜索到的视频
5. **专题列表**: 按标签/主题分组的视频

**问题**: 如果把 Feed Entity 作为 SSOT，那么从历史记录或收藏夹进入的视频怎么办？

---

## 架构方案对比

### 方案 A: **独立的 Video Meta Entity**（推荐）

#### 核心思想
创建专门的 `video-meta` Entity，作为所有 VideoMetaData 的 SSOT。
其他 Entity（feed/history/favorites）只存储 `videoId` 数组。

#### 架构设计

```
┌─────────────────────────────────────────────────┐
│            Video Meta Entity (SSOT)             │
│   videos: Map<videoId, VideoMetaData>          │
│   - updateVideo(id, updates)                    │
│   - getVideo(id)                                │
│   - addVideo(videoMetaData)                     │
└─────────────────────────────────────────────────┘
              ↑                    ↑
              │ 写入/读取           │ 写入/读取
              │                    │
    ┌─────────┴──────┐    ┌────────┴─────────┐
    │  Feed Entity   │    │ History Entity   │
    │  videoIds: []  │    │  videoIds: []    │
    └────────────────┘    └──────────────────┘
              ↑                    ↑
              │                    │
    ┌─────────┴──────┐    ┌────────┴─────────┐
    │ Favorites Ent. │    │  Search Entity   │
    │  videoIds: []  │    │  videoIds: []    │
    └────────────────┘    └──────────────────┘
```

#### 实现示例

**1. Video Meta Entity**
```typescript
// src/entities/video-meta/model/types.ts
export interface VideoMetaStore {
  // 使用 Map 实现 O(1) 查找
  videos: Map<string, VideoMetaData>;

  // 添加视频
  addVideo: (video: VideoMetaData) => void;

  // 批量添加
  addVideos: (videos: VideoMetaData[]) => void;

  // 更新视频（用于点赞、收藏等）
  updateVideo: (videoId: string, updates: Partial<VideoMetaData>) => void;

  // 获取视频
  getVideo: (videoId: string) => VideoMetaData | null;

  // 删除视频（可选，用于内存清理）
  removeVideo: (videoId: string) => void;
}

// src/entities/video-meta/model/store.ts
import { create } from 'zustand';

export const useVideoMetaStore = create<VideoMetaStore>((set, get) => ({
  videos: new Map(),

  addVideo: (video) => {
    set((state) => {
      const newVideos = new Map(state.videos);
      newVideos.set(video.id, video);
      return { videos: newVideos };
    });
  },

  addVideos: (videos) => {
    set((state) => {
      const newVideos = new Map(state.videos);
      videos.forEach(video => newVideos.set(video.id, video));
      return { videos: newVideos };
    });
  },

  updateVideo: (videoId, updates) => {
    set((state) => {
      const existing = state.videos.get(videoId);
      if (!existing) return state;

      const newVideos = new Map(state.videos);
      newVideos.set(videoId, { ...existing, ...updates });
      return { videos: newVideos };
    });
  },

  getVideo: (videoId) => {
    return get().videos.get(videoId) ?? null;
  },

  removeVideo: (videoId) => {
    set((state) => {
      const newVideos = new Map(state.videos);
      newVideos.delete(videoId);
      return { videos: newVideos };
    });
  },
}));
```

**2. Feed Entity（简化版）**
```typescript
// src/entities/feed/model/types.ts
export interface FeedStore {
  // ✅ 只存 ID，不存 VideoMetaData
  videoIds: string[];

  // Feed 特有的状态
  loading: FeedLoadingState;
  playback: FeedPlaybackState;

  // 添加视频到 Feed
  appendVideoIds: (ids: string[]) => void;

  // 其他 Feed 操作
  setCurrentFeedIndex: (index: number) => void;
  // ...
}
```

**3. History Entity（新）**
```typescript
// src/entities/history/model/types.ts
export interface HistoryStore {
  // ✅ 只存 ID，不存 VideoMetaData
  videoIds: string[];

  // 历史记录特有的状态
  lastWatchedAt: Map<string, Date>;

  // 添加到历史
  addToHistory: (videoId: string) => void;

  // 清除历史
  clearHistory: () => void;
}
```

**4. Feature 层使用**
```typescript
// src/features/video-detail/hooks/useVideoDetail.ts
const VideoDetailPage = () => {
  const videoId = useVideoStore(state => state.currentVideoId);

  // ✅ 从 Video Meta Entity 获取数据（唯一 SSOT）
  const videoMetaData = useVideoMetaStore(state => state.getVideo(videoId));

  const handleLike = useCallback(() => {
    // ✅ 直接更新 Video Meta Entity
    const videoMetaActions = useVideoMetaActions();
    videoMetaActions.updateVideo(videoId, { isLiked: true });
  }, [videoId]);

  return <VideoPlayer video={videoMetaData} />;
};
```

**5. Feed Feature（加载数据）**
```typescript
// src/features/feed-loader/hooks/useFeedLoader.ts
const useFeedLoader = () => {
  const { data } = useFeedQuery(); // TanStack Query

  useEffect(() => {
    if (!data) return;

    // 1. 先添加到 Video Meta Entity（SSOT）
    const videoMetaActions = useVideoMetaActions();
    videoMetaActions.addVideos(data.videos);

    // 2. 再添加 ID 到 Feed Entity
    const feedActions = useFeedActions();
    feedActions.appendVideoIds(data.videos.map(v => v.id));
  }, [data]);
};
```

#### 优点
- ✅ **真正的 SSOT**: Video Meta Entity 是唯一数据源
- ✅ **扩展性强**: 轻松添加新的列表类型（Favorites/Search/Playlists）
- ✅ **职责清晰**:
  - Video Meta Entity: 管理视频元数据
  - Feed/History/Favorites: 管理列表顺序和业务逻辑
- ✅ **性能优化**: Map 结构实现 O(1) 查找
- ✅ **内存可控**: 可以实现 LRU 清理不常用的视频元数据

#### 缺点
- ⚠️ 需要重构现有代码
- ⚠️ 增加一个新的 Entity 层

---

### 方案 B: **Context-Aware 引用**

#### 核心思想
每个 Entity（Feed/History/Favorites）都维护自己的 VideoMetaData。
Video Entity 记录当前上下文，根据上下文从对应的 Entity 读取。

#### 架构设计

```typescript
type VideoContext = 'feed' | 'history' | 'favorites' | 'search';

type VideoStore = {
  currentVideoId: string | null;
  currentContext: VideoContext; // 记录视频来源
  currentPlayer: VideoPlayer | null;
}

// 根据上下文获取数据
const selectCurrentVideoMetaData = (state: VideoStore): VideoMetaData | null => {
  const { currentVideoId, currentContext } = state;
  if (!currentVideoId) return null;

  switch (currentContext) {
    case 'feed':
      return useFeedStore.getState().getVideoById(currentVideoId);
    case 'history':
      return useHistoryStore.getState().getVideoById(currentVideoId);
    case 'favorites':
      return useFavoritesStore.getState().getVideoById(currentVideoId);
    default:
      return null;
  }
};
```

#### 优点
- ✅ 不需要新增 Entity
- ✅ 每个 Entity 管理自己的数据

#### 缺点
- ❌ **数据冗余**: 同一视频可能在多个 Entity 中重复存储
- ❌ **同步复杂**: 用户点赞后需要同步到所有 Entity
- ❌ **难以扩展**: 新增列表类型需要修改 switch 逻辑
- ❌ **不是真正的 SSOT**: 多个数据副本并存

---

### 方案 C: **服务端 SSOT + TanStack Query**

#### 核心思想
服务端数据库是真正的 SSOT。
客户端各个 Entity 只是缓存。
使用 TanStack Query 管理缓存和同步。

#### 架构设计

```typescript
// 读取：TanStack Query 自动缓存
const useVideoMetaData = (videoId: string) => {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: () => fetchVideoFromServer(videoId),
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新请求
  });
};

// 写入：Mutation 自动同步所有缓存
const useUpdateVideoLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) =>
      updateVideoLikeOnServer(videoId, isLiked),

    onMutate: async ({ videoId, isLiked }) => {
      // 乐观更新：立即更新 UI
      await queryClient.cancelQueries(['video', videoId]);

      const previousData = queryClient.getQueryData(['video', videoId]);

      queryClient.setQueryData(['video', videoId], (old: VideoMetaData) => ({
        ...old,
        isLiked,
      }));

      return { previousData };
    },

    onError: (err, variables, context) => {
      // 失败时回滚
      queryClient.setQueryData(['video', variables.videoId], context.previousData);
    },

    onSuccess: (data, { videoId }) => {
      // 成功后同步到所有使用该 video 的地方
      queryClient.invalidateQueries(['video', videoId]);
      queryClient.invalidateQueries(['feed']);
      queryClient.invalidateQueries(['history']);
      queryClient.invalidateQueries(['favorites']);
    },
  });
};

// Feed 列表：服务端分页
const useFeedVideos = () => {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => fetchFeedPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
```

#### 优点
- ✅ **真正的 SSOT**: 服务端数据库
- ✅ **自动同步**: TanStack Query 自动处理缓存失效
- ✅ **离线支持**: Query 可配置缓存策略
- ✅ **乐观更新**: 用户操作立即反馈，后台同步

#### 缺点
- ⚠️ 需要网络请求（性能影响）
- ⚠️ 需要服务端 API 支持
- ⚠️ 离线场景需要额外处理

---

## 推荐方案

### 短期推荐：**方案 A（独立 Video Meta Entity）**

**理由**:
1. **适合离线优先**: 学习应用可能需要离线使用
2. **性能最优**: 本地 Map 查找，无网络延迟
3. **架构清晰**: 符合 FSD，职责分离
4. **易于扩展**: 新增列表类型无需修改现有代码

**实施计划**:
1. 创建 `src/entities/video-meta/` (新 Entity)
2. 重构 `src/entities/feed/` (移除 VideoMetaData，只存 ID)
3. 更新 Player Pool 和 Video Entity (使用 Video Meta Entity)
4. 更新 Features (从 Video Meta Entity 读取)

---

### 长期演进：**方案 A + 方案 C 混合**

**阶段 1**: 使用方案 A（本地 SSOT）
- 快速迭代，离线支持

**阶段 2**: 引入 TanStack Query
- Video Meta Entity 的数据来源从本地改为 TanStack Query
- 保持接口不变，内部实现改为从 Query 缓存读取
- 实现服务端同步

```typescript
// src/entities/video-meta/model/store.ts (演进版)
export const useVideoMetaStore = create<VideoMetaStore>((set, get) => ({
  // 仍然保留本地 Map 作为快速查找索引
  videos: new Map(),

  getVideo: (videoId) => {
    // 优先从本地 Map 获取
    const local = get().videos.get(videoId);
    if (local) return local;

    // 如果没有，从 TanStack Query 缓存获取
    const queryClient = getQueryClient();
    return queryClient.getQueryData(['video', videoId]) ?? null;
  },

  updateVideo: (videoId, updates) => {
    // 1. 更新本地 Map（立即生效）
    set((state) => {
      const existing = state.videos.get(videoId);
      if (!existing) return state;
      const newVideos = new Map(state.videos);
      newVideos.set(videoId, { ...existing, ...updates });
      return { videos: newVideos };
    });

    // 2. 异步同步到服务端（通过 Mutation）
    updateVideoMutation.mutate({ videoId, updates });
  },
}));
```

---

## 决策建议

| 场景                     | 推荐方案   | 理由                           |
|------------------------|--------|------------------------------|
| 当前阶段（MVP）            | 方案 A   | 快速实现，架构清晰，离线支持             |
| 多设备同步需求             | 方案 C   | 服务端 SSOT，自动同步              |
| 复杂业务逻辑（推荐算法等）    | 方案 A+C | 本地快速查找 + 服务端数据源            |

**推荐**: 先实现方案 A，为方案 C 预留接口（保持 Entity API 稳定）。

---

## 实施路径（方案 A）

### Phase 1: 创建 Video Meta Entity
- [ ] 定义类型和接口
- [ ] 实现 Zustand store (Map-based)
- [ ] 单元测试

### Phase 2: 重构 Feed Entity
- [ ] 修改 FeedStore 只存 videoIds
- [ ] 更新 Feed 加载逻辑（先存 Video Meta，再存 ID）
- [ ] 更新 Feed 选择器

### Phase 3: 重构 Video Entity & Player Pool
- [ ] Video Store 改为存 currentVideoId
- [ ] Player Pool 的 PlayerMeta 改为存 videoId
- [ ] 更新相关选择器

### Phase 4: 更新 Features
- [ ] 从 Video Meta Entity 读取数据
- [ ] 更新到 Video Meta Entity
- [ ] 删除冗余的同步代码

### Phase 5: 类型检查和测试
- [ ] 运行 `npx tsc --noEmit`
- [ ] 集成测试
- [ ] 性能测试

需要我开始实施吗？
