# 缓存和 TanStack Query 概念解释

## 1. 是的，Video Meta Entity 就是缓存！

### 什么是缓存？

**缓存（Cache）** = 临时存储的数据副本，用于快速访问

```
真实数据源（慢）         缓存（快）           应用
   数据库      →  →  →   内存中的副本  →  →  → UI 显示
  （在服务器）              （在客户端）
```

### 我们提出的 Video Meta Entity 就是缓存

```typescript
// Video Meta Entity = 客户端缓存
export const useVideoMetaStore = create<VideoMetaStore>((set, get) => ({
  videos: new Map<string, VideoMetaData>(), // ✅ 缓存：内存中的数据副本

  addVideo: (video) => {
    // 把数据加入缓存
  },

  getVideo: (id) => {
    // 从缓存快速读取
    return this.videos.get(id); // O(1) 速度
  },
}));
```

### 缓存的优点

| 场景 | 无缓存 | 有缓存 |
|------|--------|--------|
| 用户点击视频 | 请求服务器 → 等待 500ms | 从内存读取 → 瞬间显示 (<1ms) |
| 用户点赞 | 请求服务器 → 等待 → 更新UI | 立即更新UI → 后台同步服务器 |
| 离线使用 | ❌ 无法使用 | ✅ 可以查看已缓存的数据 |

---

## 2. TanStack Query 是什么？

### 简单理解

**TanStack Query** (原名 React Query) = 自动管理缓存的库

它帮你自动处理：
- ✅ 数据获取（Fetch）
- ✅ 数据缓存（Cache）
- ✅ 数据同步（Sync）
- ✅ 数据更新（Update）
- ✅ 离线支持（Offline）

### 类比：外卖 APP

**不用 TanStack Query（手动管理）：**
```typescript
// 你需要自己写所有逻辑
const [videos, setVideos] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setIsLoading(true);
  fetch('/api/videos')
    .then(res => res.json())
    .then(data => {
      setVideos(data);
      setIsLoading(false);
    })
    .catch(err => {
      setError(err);
      setIsLoading(false);
    });
}, []);

// 点赞需要手动同步
const handleLike = async (id) => {
  // 1. 乐观更新 UI
  setVideos(prev => prev.map(v =>
    v.id === id ? { ...v, isLiked: true } : v
  ));

  try {
    // 2. 请求服务器
    await fetch(`/api/videos/${id}/like`, { method: 'POST' });
  } catch (err) {
    // 3. 失败时回滚
    setVideos(prev => prev.map(v =>
      v.id === id ? { ...v, isLiked: false } : v
    ));
  }
};
```

**使用 TanStack Query（自动管理）：**
```typescript
// 读取数据 - 自动缓存、自动加载状态
const { data: videos, isLoading, error } = useQuery({
  queryKey: ['videos'],
  queryFn: () => fetch('/api/videos').then(res => res.json()),
  staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
});

// 点赞 - 自动乐观更新、自动回滚、自动同步
const likeMutation = useMutation({
  mutationFn: (id) => fetch(`/api/videos/${id}/like`, { method: 'POST' }),

  // ✅ 自动乐观更新
  onMutate: async (id) => {
    const previous = queryClient.getQueryData(['videos']);
    queryClient.setQueryData(['videos'], (old) =>
      old.map(v => v.id === id ? { ...v, isLiked: true } : v)
    );
    return { previous };
  },

  // ✅ 失败自动回滚
  onError: (err, id, context) => {
    queryClient.setQueryData(['videos'], context.previous);
  },

  // ✅ 成功自动同步
  onSuccess: () => {
    queryClient.invalidateQueries(['videos']);
  },
});

// 使用
const handleLike = (id) => likeMutation.mutate(id);
```

### TanStack Query 的核心功能

#### 1. **自动缓存管理**

```typescript
// 第一次访问 - 从服务器获取
const query1 = useQuery({
  queryKey: ['video', '123'],
  queryFn: () => fetchVideo('123'), // 请求服务器
});

// 5秒后再次访问 - 从缓存读取（不请求服务器）
const query2 = useQuery({
  queryKey: ['video', '123'],
  queryFn: () => fetchVideo('123'), // ✅ 不会执行，直接用缓存
  staleTime: 60000, // 1分钟内使用缓存
});
```

#### 2. **自动后台同步**

```typescript
const { data } = useQuery({
  queryKey: ['videos'],
  queryFn: fetchVideos,
  refetchInterval: 30000, // ✅ 每30秒自动同步最新数据
  refetchOnWindowFocus: true, // ✅ 窗口获得焦点时自动刷新
});
```

#### 3. **乐观更新（Optimistic Updates）**

用户点赞的例子：

```
传统方式:
用户点击 → 请求服务器 → 等待 500ms → UI 更新 ❌ 体验差

TanStack Query 方式:
用户点击 → UI 立即更新 ✅ → 后台请求服务器 → 成功/失败处理
```

#### 4. **离线支持**

```typescript
const mutation = useMutation({
  mutationFn: likeVideo,
  retry: 3, // ✅ 网络恢复后自动重试
});

// 离线时点赞
mutation.mutate('video-123'); // 请求失败
// ✅ TanStack Query 自动保存，网络恢复后自动重试
```

---

## 3. 两者的关系

### 方案对比

#### 当前讨论的方案 A（手动缓存）

```
Video Meta Entity (手动实现的缓存)
   ↓
Feed/History/Favorites (使用缓存)
```

**特点：**
- ✅ 完全掌控缓存逻辑
- ✅ 离线优先
- ❌ 需要手动实现同步逻辑
- ❌ 需要手动处理乐观更新、回滚等

#### 方案 A + TanStack Query（自动缓存）

```
TanStack Query Cache (自动管理的缓存)
   ↓
Video Meta Entity (从 Query 读取)
   ↓
Feed/History/Favorites (使用数据)
```

**特点：**
- ✅ 自动缓存管理
- ✅ 自动同步服务器
- ✅ 自动乐观更新
- ✅ 自动离线支持
- ⚠️ 需要网络配合

### 实际代码对比

#### 方案 A（纯手动）

```typescript
// src/entities/video-meta/model/store.ts
export const useVideoMetaStore = create<VideoMetaStore>((set, get) => ({
  videos: new Map(),

  updateVideo: (id, updates) => {
    // 1. 更新本地缓存
    set((state) => {
      const newVideos = new Map(state.videos);
      newVideos.set(id, { ...state.videos.get(id), ...updates });
      return { videos: newVideos };
    });

    // 2. 手动同步到服务器（你需要自己写）
    fetch(`/api/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }).catch(err => {
      // 3. 失败时手动回滚（你需要自己写）
      // ...
    });
  },
}));
```

#### 方案 A + TanStack Query（自动）

```typescript
// src/entities/video-meta/hooks/useVideoMetaData.ts
export const useVideoMetaData = (videoId: string) => {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: () => fetchVideoFromServer(videoId),
    staleTime: 5 * 60 * 1000, // ✅ 自动缓存5分钟
  });
};

export const useUpdateVideoMeta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) =>
      fetch(`/api/videos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    // ✅ 自动乐观更新
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries(['video', id]);
      const previous = queryClient.getQueryData(['video', id]);

      queryClient.setQueryData(['video', id], (old) => ({
        ...old,
        ...updates,
      }));

      return { previous };
    },

    // ✅ 自动回滚
    onError: (err, { id }, context) => {
      queryClient.setQueryData(['video', id], context.previous);
    },

    // ✅ 自动同步
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries(['video', id]);
      queryClient.invalidateQueries(['feed']);
      queryClient.invalidateQueries(['history']);
    },
  });
};
```

---

## 4. 项目当前状态

### 你的项目已经在用 TanStack Query！

查看你的 `package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.64.2" // ✅ 已安装
  }
}
```

### 当前使用情况

查看 `src/features/feed-loader/`:

```typescript
// 你已经在用 TanStack Query 加载 Feed 数据
export const useFeedQuery = () => {
  return useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeedData,
  });
};
```

**但是**：你只用了 TanStack Query 来**获取数据**，没有用它来**管理缓存**。

---

## 5. 推荐方案演进路径

### 阶段 1：现在（MVP）- 方案 A（手动缓存）

```
优势：
- ✅ 快速实现
- ✅ 离线优先
- ✅ 完全掌控

劣势：
- ❌ 需要手动写同步逻辑
- ❌ 需要手动处理乐观更新
```

实现：
1. 创建 Video Meta Entity（手动缓存）
2. Feed/History 只存 videoIds
3. 手动实现点赞等同步逻辑

### 阶段 2：优化（6个月后）- 方案 A + TanStack Query

```
优势：
- ✅ 自动缓存管理
- ✅ 自动服务器同步
- ✅ 自动乐观更新
- ✅ 保留离线支持

实现：
1. Video Meta Entity 保持接口不变
2. 内部改为从 TanStack Query 读取
3. 利用 Query 的自动同步功能
```

实现示例：

```typescript
// src/entities/video-meta/model/store.ts (演进版)
export const useVideoMetaStore = create<VideoMetaStore>((set, get) => ({
  // 本地 Map 作为快速查找索引（可选）
  videos: new Map(),

  getVideo: (videoId) => {
    // 优先从 TanStack Query 缓存获取
    const queryClient = getQueryClient();
    const queryData = queryClient.getQueryData(['video', videoId]);

    if (queryData) return queryData;

    // 降级到本地 Map
    return get().videos.get(videoId) ?? null;
  },

  updateVideo: (videoId, updates) => {
    // ✅ 使用 TanStack Query Mutation（自动处理一切）
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: () => updateVideoOnServer(videoId, updates),
      // ... 自动乐观更新、回滚、同步
    });

    mutation.execute();
  },
}));
```

---

## 6. 总结

### 核心概念

| 概念 | 解释 | 例子 |
|------|------|------|
| **缓存** | 临时存储的数据副本 | Video Meta Entity 的 Map |
| **TanStack Query** | 自动管理缓存的库 | 自动同步、乐观更新、离线支持 |
| **方案 A** | 手动实现缓存层 | 当前推荐，快速实现 |
| **方案 A+C** | 使用 TanStack Query 管理缓存 | 未来优化，自动化 |

### 回答你的问题

**Q1: Video Meta Entity 相当于缓存吗？**
✅ 是的！它是一个手动实现的客户端缓存层。

**Q2: TanStack Query 是什么？**
✅ 自动管理缓存的库，帮你处理数据获取、缓存、同步、乐观更新等。

### 我的建议

**现在（MVP阶段）：**
- 实施方案 A（手动缓存）
- 原因：快速实现，离线优先，完全掌控

**未来（成熟后）：**
- 演进到方案 A + TanStack Query
- 原因：减少手动代码，自动化管理，更健壮

**立即行动：**
需要我开始实施方案 A（创建 Video Meta Entity）吗？
