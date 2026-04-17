# Video Window Management Feature - 依赖注入架构上下文

> **版本**: v1.0
> **最后更新**: 2025-10-10

## 文档目的

本文档为 AI 智能体和开发者提供 Video Window Management Feature 的深层架构理解，聚焦于依赖注入模式、FSD架构合规性和与Player Pool Entity的协调机制。

---

## 架构概览

### 核心定位

Video Window Management 是一个**Feature层协调模块**，职责是：
- **依赖注入**：从多个Entities读取数据，注入到Player Pool Manager
- **架构隔离**：解决Player Pool Entity对其他Entities的依赖问题
- **FSD合规**：严格遵循Feature层可依赖多个Entities的架构原则
- **零业务逻辑**：纯粹的数据协调层，不包含业务逻辑

### 架构定位图

```
┌─────────────────────────────────────────────────────┐
│ Pages Layer (FeedPage, VideoFullscreenPage)         │
│   调用 video-window-management API                   │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ Features Layer: video-window-management (v1.0)       │
│   📦 依赖注入协调层                                   │
│   • 从 video-meta, feed, video entities 读取数据     │
│   • 将数据作为参数传递给 player-pool manager         │
│   • 符合 FSD 架构：Feature 可依赖多个 Entities       │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ Entities Layer: Multiple Entities                   │
│   ├─ player-pool   (v5.0: VideoId-Based + LRU)      │
│   ├─ video-meta    (SSOT: Map-based O(1) 存储)      │
│   ├─ feed          (ID-based: 50条滑动窗口)         │
│   └─ video         (单指针架构 + 状态机)             │
└─────────────────────────────────────────────────────┘
```

---

## 设计问题与解决方案

### 问题背景：Entity层依赖困境

**原始问题**：
```typescript
// ❌ v6.0 Player Pool - 直接依赖其他Entities（违反FSD）
class PlayerPoolManager {
  enterFullscreenMode(clickedVideoId: string) {
    // ❌ Entity层不应依赖其他Entity
    const feedVideoIds = useFeedStore.getState().videoIds;
    const getVideoUrl = (id) => useVideoMetaStore.getState().getVideo(id)?.video_url;

    // 业务逻辑...
  }
}
```

**FSD架构冲突**：
- **Entity层规则**：同层Entities之间禁止相互依赖
- **问题本质**：Player Pool需要Feed和Video Meta数据，但不能直接访问

---

### 解决方案：Feature层依赖注入

**架构原则**：Feature层可以依赖多个Entities，作为协调层注入数据。

```typescript
// ✅ v7.0 Player Pool - 参数化依赖
class PlayerPoolManager {
  enterFullscreenMode(
    clickedVideoId: string,
    feedVideoIds: string[],              // ✅ 参数注入
    getVideoUrl: (id: string) => string  // ✅ 回调注入
  ) {
    // 纯粹的业务逻辑，无外部依赖
  }
}

// ✅ v1.0 Video Window Management - 依赖注入协调
export function enterFullscreenMode(clickedVideoId: string): void {
  const feedVideoIds = useFeedStore.getState().videoIds;        // Feature读取Feed
  const getVideoUrl = createGetVideoUrl();                       // Feature读取Video Meta

  playerPoolManager.enterFullscreenMode(
    clickedVideoId,
    feedVideoIds,   // ✅ 注入依赖
    getVideoUrl     // ✅ 注入回调
  );
}
```

**架构优势**：
1. **Entity零依赖**：Player Pool不依赖任何其他Entity
2. **FSD合规**：Feature层合法依赖多个Entities
3. **可测试性**：Manager可独立测试，注入mock数据
4. **解耦性**：Manager不关心数据来源，只关心参数契约

---

## 核心API设计

### 1. 获取视频URL的回调工厂

```typescript
/**
 * 🔑 创建获取视频URL的回调函数
 *
 * 设计目的：
 * - 复用逻辑，避免重复代码
 * - 闭包捕获 useVideoMetaStore，确保访问最新状态
 */
function createGetVideoUrl() {
  return (videoId: string) =>
    useVideoMetaStore.getState().getVideo(videoId)?.video_url || null;
}
```

**使用场景**：
- `enterFullscreenMode`：窗口初始化时批量获取URL
- `extendWindowNext/Prev`：窗口扩展时获取新视频URL
- `loadPendingVideos`：异步加载待加载视频

---

### 2. 获取播放器（包装 acquire）

```typescript
/**
 * 获取播放器（包装 acquire）
 *
 * @param videoId - 视频ID
 * @returns VideoPlayer 实例
 * @throws 如果视频URL不存在
 */
export async function acquirePlayerForVideo(videoId: string): Promise<VideoPlayer> {
  const videoUrl = useVideoMetaStore.getState().getVideo(videoId)?.video_url;

  if (!videoUrl) {
    throw new Error(`Video URL not found for: ${videoId}`);
  }

  return playerPoolManager.acquire(videoId, videoUrl);
}
```

**设计优势**：
- **错误前置**：在调用Manager前验证URL存在性
- **类型安全**：返回明确的VideoPlayer类型
- **封装细节**：调用方不需要知道如何获取URL

---

### 3. 预加载视频

```typescript
/**
 * 预加载视频
 *
 * @param videoIds - 要预加载的视频ID数组
 */
export async function preloadVideos(videoIds: string[]): Promise<void> {
  // 1️⃣ 从 video-meta entity 获取URL
  const videos = videoIds
    .map(id => ({
      videoId: id,
      videoUrl: useVideoMetaStore.getState().getVideo(id)?.video_url || '',
    }))
    .filter(v => v.videoUrl);  // 2️⃣ 过滤无效URL

  // 3️⃣ 委托给 player-pool manager
  return playerPoolManager.preloadVideos(videos);
}
```

**设计模式**：
- **数据转换**：将Entity数据转换为Manager所需格式
- **防御性编程**：过滤无效数据，避免Manager处理错误
- **批量操作**：支持多视频并发预加载

---

### 4. 进入全屏模式

```typescript
/**
 * 进入全屏模式
 *
 * @param clickedVideoId - 用户点击的视频ID
 */
export function enterFullscreenMode(clickedVideoId: string): void {
  // 1️⃣ 从 feed entity 获取视频ID列表
  const feedVideoIds = useFeedStore.getState().videoIds;

  // 2️⃣ 创建URL获取回调
  const getVideoUrl = createGetVideoUrl();

  // 3️⃣ 注入依赖到 player-pool manager
  playerPoolManager.enterFullscreenMode(
    clickedVideoId,
    feedVideoIds,
    getVideoUrl
  );
}
```

**依赖注入流程**：
```
FeedPage.handleVideoPress
    ↓ 调用
video-window-management.enterFullscreenMode(videoId)
    ↓ 读取数据
feed entity (videoIds) + video-meta entity (getVideo)
    ↓ 注入
player-pool manager.enterFullscreenMode(videoId, feedVideoIds, getVideoUrl)
    ↓ 执行
窗口批量替换（13个播放器）
```

---

### 5. 窗口扩展

```typescript
/**
 * 窗口扩展（向后）
 */
export async function extendWindowNext(): Promise<void> {
  const feedVideoIds = useFeedStore.getState().videoIds;
  const getVideoUrl = createGetVideoUrl();
  const currentVideoId = useVideoStore.getState().currentPlayerMeta?.videoId || null;

  await playerPoolManager.extendWindowNext(
    feedVideoIds,
    getVideoUrl,
    currentVideoId
  );
}

/**
 * 窗口扩展（向前）
 */
export async function extendWindowPrev(): Promise<void> {
  const feedVideoIds = useFeedStore.getState().videoIds;
  const getVideoUrl = createGetVideoUrl();
  const currentVideoId = useVideoStore.getState().currentPlayerMeta?.videoId || null;

  await playerPoolManager.extendWindowPrev(
    feedVideoIds,
    getVideoUrl,
    currentVideoId
  );
}
```

**多Entity协调**：
- **feed entity**: 提供完整视频列表（feedVideoIds）
- **video-meta entity**: 提供视频URL获取回调（getVideoUrl）
- **video entity**: 提供当前播放视频ID（currentVideoId）

**窗口扩展流程**：
```
全屏页面滑动到边缘 (index=11)
    ↓
useFullscreenScrollWindow.handleScroll
    ↓ 调用
video-window-management.extendWindowNext()
    ↓ 读取数据
feed (videoIds) + video-meta (getVideo) + video (currentVideoId)
    ↓ 注入
player-pool manager.extendWindowNext(feedVideoIds, getVideoUrl, currentVideoId)
    ↓ 执行
动态计算窗口位置 → 并发加载4个新视频 → 原子更新状态
```

---

## 数据流架构

### 完整的三层数据流

```
┌─────────────────────────────────────────────────────┐
│ Pages Layer                                          │
│   FeedPage.handleVideoPress(video)                  │
│   VideoFullscreenPage.extendWindow()                │
└──────────────────┬──────────────────────────────────┘
                   ↓ 调用Feature API
┌─────────────────────────────────────────────────────┐
│ Features Layer: video-window-management              │
│   enterFullscreenMode(videoId)                       │
│   extendWindowNext()                                 │
└──────────────────┬──────────────────────────────────┘
                   ↓ 读取多个Entities
┌─────────────────────────────────────────────────────┐
│ Entities Layer                                       │
│   feed.videoIds       → feedVideoIds                │
│   video-meta.getVideo → getVideoUrl                 │
│   video.currentMeta   → currentVideoId              │
└──────────────────┬──────────────────────────────────┘
                   ↓ 注入到Manager
┌─────────────────────────────────────────────────────┐
│ player-pool Manager                                  │
│   enterFullscreenMode(videoId, feedVideoIds, getUrl)│
│   • 动态计算窗口位置                                 │
│   • 批量替换播放器                                   │
│   • 异步加载视频                                     │
└─────────────────────────────────────────────────────┘
```

---

## FSD架构合规性分析

### 依赖规则验证

```typescript
// ✅ 合法：Feature层依赖多个Entities
import { useFeedStore } from '@/entities/feed';
import { useVideoMetaStore } from '@/entities/video-meta';
import { useVideoStore } from '@/entities/video';
import { playerPoolManager } from '@/entities/player-pool';

// ✅ 合法：向下依赖（Feature → Entity）
export function enterFullscreenMode(clickedVideoId: string): void {
  const feedVideoIds = useFeedStore.getState().videoIds;  // OK
  const getVideoUrl = createGetVideoUrl();                 // OK
  playerPoolManager.enterFullscreenMode(...);              // OK
}

// ❌ 非法：Entity层相互依赖
// 在 player-pool/model/manager.ts 中：
import { useFeedStore } from '@/entities/feed';  // ❌ 违反FSD
```

### 架构层次检查

| 层级 | 可依赖 | 实际依赖 | 合规性 |
|------|--------|---------|--------|
| **Pages** | Features, Entities, Shared | video-window-management (Feature) | ✅ |
| **Features** | Entities, Shared | player-pool, feed, video-meta, video (Entities) | ✅ |
| **Entities** | Shared | 无（零依赖） | ✅ |

---

## 性能优化策略

### 1. 回调工厂模式

**避免重复创建函数**：
```typescript
// ❌ 每次调用都创建新函数
export function extendWindowNext() {
  const getVideoUrl = (id: string) =>
    useVideoMetaStore.getState().getVideo(id)?.video_url || null;
  // ...
}

// ✅ 使用工厂函数复用逻辑
function createGetVideoUrl() {
  return (videoId: string) =>
    useVideoMetaStore.getState().getVideo(videoId)?.video_url || null;
}

export function extendWindowNext() {
  const getVideoUrl = createGetVideoUrl();  // 复用工厂
  // ...
}
```

### 2. 批量数据转换

**reduce GC压力**：
```typescript
// 一次性转换所有数据，避免多次循环
const videos = videoIds
  .map(id => ({
    videoId: id,
    videoUrl: useVideoMetaStore.getState().getVideo(id)?.video_url || '',
  }))
  .filter(v => v.videoUrl);  // 链式调用，单次遍历
```

### 3. 状态读取优化

**直接访问 getState()**：
```typescript
// ✅ 直接读取，不触发组件重渲染
const feedVideoIds = useFeedStore.getState().videoIds;

// ❌ 不要在非组件中使用 Hook
// const feedVideoIds = useFeedStore(state => state.videoIds);
```

---

## 测试策略

### 单元测试模式

```typescript
import { enterFullscreenMode } from './index';
import { playerPoolManager } from '@/entities/player-pool';

// Mock所有Entity stores
jest.mock('@/entities/feed');
jest.mock('@/entities/video-meta');
jest.mock('@/entities/video');

test('enterFullscreenMode injects dependencies correctly', () => {
  const mockVideoIds = ['v1', 'v2', 'v3'];
  useFeedStore.getState = () => ({ videoIds: mockVideoIds });

  const managerSpy = jest.spyOn(playerPoolManager, 'enterFullscreenMode');

  enterFullscreenMode('v2');

  expect(managerSpy).toHaveBeenCalledWith(
    'v2',
    mockVideoIds,
    expect.any(Function)  // getVideoUrl 回调
  );
});
```

### 集成测试模式

```typescript
// 测试完整数据流
test('extendWindowNext reads from multiple entities', async () => {
  // 设置Feed状态
  useFeedStore.setState({ videoIds: ['v1', 'v2', 'v3'] });

  // 设置Video Meta状态
  useVideoMetaStore.setState({
    videos: new Map([
      ['v1', { id: 'v1', video_url: 'url1' }],
      ['v2', { id: 'v2', video_url: 'url2' }],
    ])
  });

  // 设置Video状态
  useVideoStore.setState({
    currentPlayerMeta: { videoId: 'v1', playerInstance: mockPlayer }
  });

  await extendWindowNext();

  // 验证Manager被正确调用
  expect(playerPoolManager.extendWindowNext).toHaveBeenCalledWith(
    ['v1', 'v2', 'v3'],
    expect.any(Function),
    'v1'
  );
});
```

---

## 常见问题

### Q: 为什么不在Manager内部直接读取Stores？

**A:**
- **FSD架构规则**：Entity层不能相互依赖
- **可测试性**：Manager可独立测试，注入mock数据
- **解耦性**：Manager不关心数据来源，只关心参数契约

### Q: Feature层会不会变成"上帝模块"？

**A:**
- **职责单一**：仅协调依赖注入，不包含业务逻辑
- **轻量级**：所有函数都是简单的数据读取+委托
- **FSD合规**：Feature层设计上就是多Entity协调层

### Q: 为什么 getVideoUrl 是回调而不是Map？

**A:**
- **延迟求值**：只在需要时获取URL，避免预加载所有URL
- **内存优化**：不需要预先构建完整的videoId→URL映射
- **实时性**：确保总是获取最新的URL（处理动态更新场景）

---

## 未来扩展

### 规划中的功能

1. **缓存管理**：缓存 getVideoUrl 结果，避免重复查询
2. **批量优化**：合并多次连续的窗口扩展请求
3. **预测预加载**：根据滑动速度预测用户方向，提前扩展
4. **性能监控**：统计依赖注入耗时，优化热路径

---

## 维护注意事项

1. **保持轻量**：不添加业务逻辑，只做数据协调
2. **类型安全**：所有API都有完整的TypeScript类型
3. **错误处理**：在Feature层处理，不传递到Manager
4. **文档更新**：API变更必须同步更新文档
5. **测试覆盖**：每个API都有单元测试和集成测试

---

**文档版本**: v1.0
**最后更新**: 2025-10-10
**维护者**: Video Window Management Team
**相关文档**: Player Pool v5.0 Entity, Feed Entity, Video Meta Entity, Video Entity, FSD Architecture Guide
