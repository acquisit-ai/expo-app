# Fullscreen 窗口扩展功能实现文档（修订版）

## 📋 文档概述

**功能名称**: Fullscreen 模式动态窗口扩展
**实现方式**: 纯扩展，零破坏性修改
**参考模板**: video-scroll 滑动窗口策略
**版本**: v2.0（修正播放器交换逻辑）
**日期**: 2025-01-09

---

## 🎯 功能目标

### 核心需求

在 **Fullscreen 模式** 下实现动态窗口扩展：

1. ✅ **保持现有行为**：进入时依然一次性加载 13 个视频
2. ✅ **动态扩展**：用户滑动时自动扩展窗口（前/后各 4 个）
3. ✅ **窗口恒定**：始终维护 13 个视频（扩展后裁剪多余的）
4. ✅ **无缝体验**：使用 useLayoutEffect 避免黑屏闪烁

### 触发机制

```
窗口结构 (13个视频):
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
 ↑  ↑                             ↑   ↑   ↑
前触发区                         后触发区

触发条件:
- 向前扩展: 用户滑到索引 0 或 1
- 向后扩展: 用户滑到索引 10、11 或 12
```

---

## 📊 架构对比分析

### 模板 vs 项目架构差异

| 特性 | 模板 (video-scroll) | 项目 (player-pool) |
|------|---------------------|-------------------|
| **播放器池结构** | 单池（17个） | 双池（13主+4可用） |
| **播放器管理** | `availablePlayers: Set<VideoPlayer>` | `mainQueue + availableQueue` |
| **播放器分配** | `availablePlayers.delete(player)` | 从 `availableQueue` 借用 |
| **播放器回收** | 组件卸载时自动 `releasePlayer` | **手动交换实例** |
| **视频窗口** | `windowData` (React state) | `mainPoolQueue` (Zustand store) |
| **依赖** | React 组件生命周期 | 完全独立于组件 |

### 关键差异说明

#### 模板的播放器回收机制

```typescript
// video-scroll/components/VideoPlayer.tsx:36-71
useEffect(() => {
  // 组件挂载：获取 player
  const player = await playerPool.acquirePlayer(item.metaId, item.video_url);
  setPlayer(player);

  return () => {
    // ✅ 关键：组件卸载时自动释放 player
    playerPool.releasePlayer(item.metaId);
  };
}, [item.metaId]);

// 当 windowData 变化，移除的视频对应的组件卸载
// → useEffect cleanup 触发
// → releasePlayer 自动清空播放器并放回 availablePlayers
```

**模板依赖**：React 组件生命周期自动管理播放器

#### 项目的播放器管理机制

```typescript
// 项目不依赖组件生命周期
// VideoPlayer 组件只是渲染器，不管理播放器生命周期

// 所有播放器操作由 playerPoolManager 统一管理：
- 分配：acquire()
- 预加载：preloadVideos()
- LRU更新：moveToMainQueue()
- 模式切换：enterFullscreenMode() / exitFullscreenMode()
```

**项目特点**：播放器生命周期完全由 `playerPoolManager` 控制

---

## 🔑 核心实现逻辑

### 参考：项目现有的 moveToMainQueue

```typescript
// src/entities/player-pool/model/manager.ts:306-347
private moveToMainQueue(availIndex: number, videoId: string): void {
  const mainQueue = [...state.mainPoolQueue];
  const availableQueue = [...state.availableQueue];

  // 1. 淘汰主池最旧的（索引0）
  const oldest = mainQueue.shift();

  // 2. 暂停被淘汰的播放器
  oldest.playerInstance.pause();

  // 3. 🔑 关键：交换播放器实例
  const oldPlayer = oldest.playerInstance;          // 主池淘汰的播放器
  const newPlayer = availableQueue[availIndex].playerInstance;  // available pool 的播放器

  // 将被淘汰的旧播放器给 available pool
  availableQueue[availIndex] = {
    playerInstance: oldPlayer,  // ← 交换
    isLocked: false,
    loadingVideoId: null,
  };

  // 新播放器加入主池末尾
  mainQueue.push({
    playerInstance: newPlayer,  // ← 交换
    videoId: videoId,
  });

  // 4. 更新 Store
  state.updateMainQueue(mainQueue);
  state.updateAvailableQueue(availableQueue);
}
```

**核心思想**：**交换播放器实例**（而非依赖组件卸载）

---

## 🚨 修正的关键错误

### 错误方案（v1.0）

```typescript
// ❌ 错误：试图通过匹配找到对应的播放器
for (const removedMeta of removedMetas) {
  const loadedPlayer = loadedPlayers.find(lp => lp.player === removedMeta.playerInstance);
  //                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                                         这永远不会匹配！
  if (loadedPlayer) {
    currentAvailableQueue[loadedPlayer.availIndex] = {
      playerInstance: removedMeta.playerInstance,
      // ...
    };
  }
}
```

**为什么错误**：
- `removedMeta.playerInstance` 是从主池移除的播放器（旧视频）
- `loadedPlayer.player` 是从 available pool 获取的播放器（新视频）
- 它们是**完全不同的播放器实例**，永远不会相等！

### 正确方案（v2.0）

```typescript
// ✅ 正确：按索引对应交换
for (let i = 0; i < videosToLoad.length; i++) {
  // available pool 的播放器（已加载新视频）
  const newPlayer = availableQueue[availableIndices[i]].playerInstance;

  // 主池被移除的播放器（旧视频）
  const oldPlayer = removedMetas[i].playerInstance;

  // 新播放器加入主池尾部
  mainQueue.push({
    playerInstance: newPlayer,
    videoId: videosToLoad[i],
  });

  // 旧播放器放回 available pool
  availableQueue[availableIndices[i]] = {
    playerInstance: oldPlayer,  // ← 交换
    isLocked: false,
    loadingVideoId: null,
  };
}
```

---

## ✅ 修正后的完整实现

### 实现点 1: 添加辅助方法 - waitForPlayerReady

```typescript
/**
 * 等待播放器就绪（复制模板逻辑）
 * @param player - 播放器实例
 * @param timeout - 超时时间（默认10秒）
 */
private waitForPlayerReady(player: VideoPlayer, timeout = 10000): Promise<void> {
  return new Promise((resolve) => {
    // 如果已经 ready，立即 resolve
    if (player.status === 'readyToPlay' || player.status === 'error') {
      log('player-pool', LogType.DEBUG, `Player already ready: ${player.status}`);
      resolve();
      return;
    }

    log('player-pool', LogType.DEBUG,
      `Waiting for player ready, current status: ${player.status}`);

    let resolved = false;

    // 监听状态变化
    const listener = player.addListener('statusChange', ({ status }) => {
      log('player-pool', LogType.DEBUG, `Player status changed: ${status}`);

      if (status === 'readyToPlay' || status === 'error') {
        if (!resolved) {
          resolved = true;
          listener.remove();
          resolve();
        }
      }
    });

    // 超时保护
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        listener.remove();
        log('player-pool', LogType.WARNING,
          `Timeout waiting for player ready (status: ${player.status})`);
        resolve(); // 超时也继续
      }
    }, timeout);
  });
}
```

**添加位置**：`src/entities/player-pool/model/manager.ts`（在 `replaceMainQueueWithWindow` 之后）

---

### 实现点 2: 添加核心方法 - extendWindowNext

```typescript
/**
 * 🆕 向后扩展窗口（复制模板 LOAD_NEXT 逻辑）
 *
 * 流程：
 * 1. 从 feed 获取接下来 4 个视频 ID
 * 2. 从 available pool 借用 4 个空闲播放器
 * 3. 并发加载视频，等待全部 ready
 * 4. 交换播放器实例：
 *    - available pool 的播放器（已加载新视频）→ 主池尾部
 *    - 主池前 4 个播放器（旧视频）→ available pool
 * 5. 更新 windowStartIndex (+4)
 *
 * 🔑 关键设计：
 * - 先加载后显示（避免用户看到 loading）
 * - 交换实例而非依赖组件生命周期
 * - 维持窗口大小恒定（13个）
 */
async extendWindowNext(): Promise<void> {
  const state = usePlayerPoolStore.getState();

  if (state.currentMode !== PoolMode.FULLSCREEN) {
    log('player-pool', LogType.WARNING, 'Cannot extend: not in Fullscreen mode');
    return;
  }

  const batchSize = 4;
  const feedVideoIds = useFeedStore.getState().videoIds;
  const mainQueue = [...state.mainPoolQueue];

  // === 步骤1: 计算要加载的4个视频 ===
  const startIdx = state.windowStartIndex + mainQueue.length;
  const endIdx = Math.min(startIdx + batchSize, feedVideoIds.length);

  if (startIdx >= feedVideoIds.length) {
    log('player-pool', LogType.DEBUG, 'Already at the end of video source');
    return;
  }

  const videosToLoad = feedVideoIds.slice(startIdx, endIdx);
  log('player-pool', LogType.INFO,
    `⬇️ Extending window next: loading ${videosToLoad.length} videos [${videosToLoad.join(', ')}]`);

  // === 步骤2: 查找4个空闲的 available player ===
  const availableQueue = [...state.availableQueue];
  const availableIndices: number[] = [];

  for (let i = 0; i < availableQueue.length && availableIndices.length < videosToLoad.length; i++) {
    if (!availableQueue[i].isLocked) {
      availableIndices.push(i);
    }
  }

  if (availableIndices.length < videosToLoad.length) {
    log('player-pool', LogType.ERROR,
      `Not enough available players: need ${videosToLoad.length}, got ${availableIndices.length}`);
    return;
  }

  // === 步骤3: 上锁 available players ===
  for (let i = 0; i < videosToLoad.length; i++) {
    const idx = availableIndices[i];
    availableQueue[idx] = {
      ...availableQueue[idx],
      isLocked: true,
      loadingVideoId: videosToLoad[i],
    };
  }
  state.updateAvailableQueue(availableQueue);

  // === 步骤4: 并发加载所有视频，等待 ready ===
  try {
    const loadPromises = availableIndices.map(async (idx, i) => {
      const videoId = videosToLoad[i];
      const player = availableQueue[idx].playerInstance;

      try {
        const metadata = useVideoMetaStore.getState().getVideo(videoId);
        if (!metadata?.video_url) {
          throw new Error(`Video URL not found for: ${videoId}`);
        }

        const videoSource = {
          uri: metadata.video_url,
          contentType: 'hls' as const,
          useCaching: false,
        };

        log('player-pool', LogType.DEBUG, `Loading ${videoId} in available pool`);
        await player.replaceAsync(videoSource);
        await this.waitForPlayerReady(player);
        log('player-pool', LogType.INFO, `✅ ${videoId} ready`);
      } catch (error) {
        log('player-pool', LogType.ERROR, `Failed to load ${videoId}: ${error}`);
        throw error;
      }
    });

    await Promise.all(loadPromises);
    log('player-pool', LogType.INFO, '✅ All videos loaded and ready');

  } catch (error) {
    // 加载失败，解锁 available players
    for (let i = 0; i < availableIndices.length; i++) {
      const idx = availableIndices[i];
      availableQueue[idx] = {
        ...availableQueue[idx],
        isLocked: false,
        loadingVideoId: null,
      };
    }
    state.updateAvailableQueue(availableQueue);

    log('player-pool', LogType.ERROR, `extendWindowNext failed: ${error}`);
    return;
  }

  // === 步骤5: 交换播放器实例（关键！）===

  // 5.1 移除主池前4个
  const removedMetas = mainQueue.splice(0, videosToLoad.length);
  log('player-pool', LogType.INFO,
    `Removed ${removedMetas.length} videos from head: ${removedMetas.map(m => m.videoId).join(', ')}`);

  // 5.2 暂停被移除的播放器
  for (const removed of removedMetas) {
    removed.playerInstance.pause();
  }

  // 5.3 🔑 关键：按索引对应交换实例
  for (let i = 0; i < videosToLoad.length; i++) {
    const idx = availableIndices[i];
    const videoId = videosToLoad[i];

    // available pool 的播放器（已加载新视频）
    const newPlayer = availableQueue[idx].playerInstance;

    // 主池被移除的播放器（旧视频）
    const oldPlayer = removedMetas[i].playerInstance;

    // 新播放器加入主池尾部
    mainQueue.push({
      playerInstance: newPlayer,
      videoId: videoId,
    });

    // 旧播放器放回 available pool
    availableQueue[idx] = {
      playerInstance: oldPlayer,  // ← 交换
      isLocked: false,
      loadingVideoId: null,
    };
  }

  // 5.4 将旧播放器置空（异步，不阻塞）
  for (const removed of removedMetas) {
    removed.playerInstance.replaceAsync(null).catch((error) => {
      log('player-pool', LogType.WARNING,
        `Failed to clear player for ${removed.videoId}: ${error}`);
    });
  }

  // === 步骤6: 更新 store ===
  state.updateMainQueue(mainQueue);
  state.updateAvailableQueue(availableQueue);
  state.setWindowStartIndex(state.windowStartIndex + videosToLoad.length);

  log('player-pool', LogType.INFO,
    `✅ Window extended next: new window [${state.windowStartIndex}, ${state.windowStartIndex + mainQueue.length - 1}]`);
}
```

**添加位置**：`src/entities/player-pool/model/manager.ts`（在 `waitForPlayerReady` 之后）

---

### 实现点 3: 添加核心方法 - extendWindowPrev

```typescript
/**
 * 🆕 向前扩展窗口（复制模板 LOAD_PREV 逻辑）
 *
 * 流程类似 extendWindowNext，但方向相反：
 * - 加载前4个视频
 * - 插入主池头部
 * - 移除主池后4个
 */
async extendWindowPrev(): Promise<void> {
  const state = usePlayerPoolStore.getState();

  if (state.currentMode !== PoolMode.FULLSCREEN) {
    log('player-pool', LogType.WARNING, 'Cannot extend: not in Fullscreen mode');
    return;
  }

  const batchSize = 4;
  const feedVideoIds = useFeedStore.getState().videoIds;
  const mainQueue = [...state.mainPoolQueue];

  // === 步骤1: 计算要加载的4个视频 ===
  const endIdx = state.windowStartIndex;
  if (endIdx <= 0) {
    log('player-pool', LogType.DEBUG, 'Already at the beginning of video source');
    return;
  }

  const startIdx = Math.max(0, endIdx - batchSize);
  const videosToLoad = feedVideoIds.slice(startIdx, endIdx);
  log('player-pool', LogType.INFO,
    `⬆️ Extending window prev: loading ${videosToLoad.length} videos [${videosToLoad.join(', ')}]`);

  // === 步骤2: 查找空闲 available players ===
  const availableQueue = [...state.availableQueue];
  const availableIndices: number[] = [];

  for (let i = 0; i < availableQueue.length && availableIndices.length < videosToLoad.length; i++) {
    if (!availableQueue[i].isLocked) {
      availableIndices.push(i);
    }
  }

  if (availableIndices.length < videosToLoad.length) {
    log('player-pool', LogType.ERROR,
      `Not enough available players: need ${videosToLoad.length}, got ${availableIndices.length}`);
    return;
  }

  // === 步骤3: 上锁 ===
  for (let i = 0; i < videosToLoad.length; i++) {
    const idx = availableIndices[i];
    availableQueue[idx] = {
      ...availableQueue[idx],
      isLocked: true,
      loadingVideoId: videosToLoad[i],
    };
  }
  state.updateAvailableQueue(availableQueue);

  // === 步骤4: 并发加载 ===
  try {
    const loadPromises = availableIndices.map(async (idx, i) => {
      const videoId = videosToLoad[i];
      const player = availableQueue[idx].playerInstance;

      try {
        const metadata = useVideoMetaStore.getState().getVideo(videoId);
        if (!metadata?.video_url) {
          throw new Error(`Video URL not found for: ${videoId}`);
        }

        const videoSource = {
          uri: metadata.video_url,
          contentType: 'hls' as const,
          useCaching: false,
        };

        await player.replaceAsync(videoSource);
        await this.waitForPlayerReady(player);
        log('player-pool', LogType.INFO, `✅ ${videoId} ready`);
      } catch (error) {
        log('player-pool', LogType.ERROR, `Failed to load ${videoId}: ${error}`);
        throw error;
      }
    });

    await Promise.all(loadPromises);
    log('player-pool', LogType.INFO, '✅ All videos loaded and ready');

  } catch (error) {
    // 解锁
    for (let i = 0; i < availableIndices.length; i++) {
      const idx = availableIndices[i];
      availableQueue[idx] = {
        ...availableQueue[idx],
        isLocked: false,
        loadingVideoId: null,
      };
    }
    state.updateAvailableQueue(availableQueue);

    log('player-pool', LogType.ERROR, `extendWindowPrev failed: ${error}`);
    return;
  }

  // === 步骤5: 交换播放器实例 ===

  // 5.1 移除主池后4个
  const removedMetas = mainQueue.splice(-videosToLoad.length, videosToLoad.length);
  log('player-pool', LogType.INFO,
    `Removed ${removedMetas.length} videos from tail: ${removedMetas.map(m => m.videoId).join(', ')}`);

  // 5.2 暂停
  for (const removed of removedMetas) {
    removed.playerInstance.pause();
  }

  // 5.3 交换（反向插入主池头部）
  for (let i = videosToLoad.length - 1; i >= 0; i--) {
    const idx = availableIndices[i];
    const videoId = videosToLoad[i];

    const newPlayer = availableQueue[idx].playerInstance;
    const oldPlayer = removedMetas[i].playerInstance;

    // 新播放器插入主池头部
    mainQueue.unshift({
      playerInstance: newPlayer,
      videoId: videoId,
    });

    // 旧播放器放回 available pool
    availableQueue[idx] = {
      playerInstance: oldPlayer,
      isLocked: false,
      loadingVideoId: null,
    };
  }

  // 5.4 置空
  for (const removed of removedMetas) {
    removed.playerInstance.replaceAsync(null).catch((error) => {
      log('player-pool', LogType.WARNING,
        `Failed to clear player for ${removed.videoId}: ${error}`);
    });
  }

  // === 步骤6: 更新 store ===
  state.updateMainQueue(mainQueue);
  state.updateAvailableQueue(availableQueue);
  state.setWindowStartIndex(startIdx);

  log('player-pool', LogType.INFO,
    `✅ Window extended prev: new window [${state.windowStartIndex}, ${state.windowStartIndex + mainQueue.length - 1}]`);
}
```

**添加位置**：`src/entities/player-pool/model/manager.ts`（在 `extendWindowNext` 之后）

---

### 实现点 4: 修改 enterFullscreenMode

```typescript
// src/entities/player-pool/model/manager.ts:738-771

enterFullscreenMode(clickedIndex: number): void {
  const state = usePlayerPoolStore.getState();

  log('player-pool', LogType.INFO,
    `Entering Fullscreen mode, clicked index: ${clickedIndex}`);

  // === 步骤1：🔧 修改：不停用 available pool ===
  // ❌ 删除这两行：
  // state.setIsClearingAvailablePool(true);
  // this.clearAvailableQueueInBackground();

  // ✅ 改为：保持 available pool 活跃状态
  state.setMode(PoolMode.TRANSITIONING);

  // === 步骤2：计算窗口（不变）===
  const feedVideoIds = useFeedStore.getState().videoIds;
  const window = this.calculateWindow(clickedIndex, feedVideoIds);

  log('player-pool', LogType.INFO,
    `Window calculated: [${window.start}, ${window.end}], ${window.videoIds.length} videos`);

  state.setWindowStartIndex(window.start);

  // === 步骤3：批量替换主池（不变）===
  const clickedVideoId = feedVideoIds[clickedIndex];
  this.replaceMainQueueWithWindow(window.videoIds, clickedVideoId);

  state.setMode(PoolMode.FULLSCREEN);
  log('player-pool', LogType.INFO,
    'Fullscreen mode activated, available pool kept active for window extension');
}
```

**修改说明**：
- ❌ 删除 2 行：`setIsClearingAvailablePool` 和 `clearAvailableQueueInBackground`
- ✅ 保留 available pool 活跃，用于窗口扩展

---

### 实现点 5: 修改 useFullscreenScrollWindow

```typescript
// src/pages/video-fullscreen/hooks/useFullscreenScrollWindow.ts

// 在文件顶部添加 ref
const hasTriggeredExtendRef = useRef({ next: false, prev: false });

// 修改 handleScroll 函数（在末尾追加）
const handleScroll = useCallback((event: any) => {
  const offsetY = event.nativeEvent.contentOffset.y;
  const newIndex = Math.round(offsetY / itemHeight);

  // 边界检查
  if (newIndex < 0 || newIndex >= windowVideoIds.length) {
    return;
  }

  // 索引未变化，跳过
  if (newIndex === currentVisibleIndexRef.current) {
    return;
  }

  const newVideoId = windowVideoIds[newIndex];
  log(LOG_TAG, LogType.DEBUG, `Scroll to index ${newIndex}, video: ${newVideoId}`);

  setCurrentVisibleIndex(newIndex);

  // 🔑 关键：立即同步 currentVideoId 到 video entity（事件驱动，非响应式）
  const playerInstance = playerPoolSelectors.getPlayer(usePlayerPoolStore.getState(), newVideoId);
  if (playerInstance) {
    useVideoStore.getState().setCurrentPlayerMeta({
      videoId: newVideoId,
      playerInstance,
    });
    log(LOG_TAG, LogType.INFO, `Updated current player meta: ${newVideoId}`);
  } else {
    log(LOG_TAG, LogType.ERROR, `Player instance not found for: ${newVideoId}`);
  }

  // === 🆕 新增：窗口扩展触发检测 ===
  if (!isLandscape) {
    // 🔽 向后扩展逻辑：位置 10-12 触发
    if (newIndex >= 10) {
      if (!hasTriggeredExtendRef.current.next) {
        const feedVideoIds = useFeedStore.getState().videoIds;
        const canExtendNext =
          state.windowStartIndex + windowVideoIds.length < feedVideoIds.length;

        if (canExtendNext) {
          log(LOG_TAG, LogType.INFO,
            `🔽 Near bottom (${newIndex}/${windowVideoIds.length}), triggering extendWindowNext`);
          hasTriggeredExtendRef.current.next = true;
          playerPoolManager.extendWindowNext();
        }
      }
    } else {
      hasTriggeredExtendRef.current.next = false;
    }

    // 🔼 向前扩展逻辑：位置 0-1 触发
    if (newIndex <= 1) {
      if (!hasTriggeredExtendRef.current.prev) {
        const canExtendPrev = state.windowStartIndex > 0;

        if (canExtendPrev) {
          log(LOG_TAG, LogType.INFO,
            `🔼 Near top (${newIndex}/${windowVideoIds.length}), triggering extendWindowPrev`);
          hasTriggeredExtendRef.current.prev = true;
          playerPoolManager.extendWindowPrev();
        }
      }
    } else {
      hasTriggeredExtendRef.current.prev = false;
    }
  }
}, [itemHeight, windowVideoIds, isLandscape]);
```

**修改说明**：
- ✅ 在 `handleScroll` 末尾追加扩展检测逻辑
- ✅ 使用独立的 `hasTriggeredExtendRef` 防抖
- ✅ 仅在 portrait 模式和触发区域内启用

---

### 实现点 6: 修改 VideoFullscreenPage

```typescript
// src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx

export function VideoFullscreenPage() {
  // ... 现有代码 ...

  // ScrollView 滑动窗口逻辑
  const {
    scrollViewRef,
    windowVideoIds,
    currentVideoId,
    currentVisibleIndex,
    handleScroll,
    itemHeight,
    isInitialMount,
  } = useFullscreenScrollWindow(isLandscape);

  // === 🆕 新增：窗口扩展时的滚动位置同步 ===
  const windowStartIndex = usePlayerPoolStore(state => state.windowStartIndex);
  const prevWindowStartIndexRef = useRef(windowStartIndex);

  useLayoutEffect(() => {
    const delta = windowStartIndex - prevWindowStartIndexRef.current;

    // windowStartIndex 发生变化，需要调整滚动位置
    if (delta !== 0 && windowVideoIds.length > 0 && !isLandscape) {
      // 找到当前播放视频在新窗口中的位置
      const currentVideoId = useVideoStore.getState().currentPlayerMeta?.videoId;
      const currentVideo = windowVideoIds.find(id => id === currentVideoId);

      if (currentVideo) {
        const newIndex = windowVideoIds.indexOf(currentVideo);
        const newOffset = newIndex * itemHeight;

        log('video-fullscreen-page', LogType.INFO,
          `🔧 windowStartIndex changed: ${prevWindowStartIndexRef.current} → ${windowStartIndex} (delta: ${delta})`);
        log('video-fullscreen-page', LogType.INFO,
          `   Current video ${currentVideoId} is now at index ${newIndex}, scrollTo ${newOffset}`);

        // ✅ 立即调整滚动位置（在浏览器绘制前同步执行，避免闪烁）
        scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
      } else {
        log('video-fullscreen-page', LogType.WARNING,
          `⚠️ Current video ${currentVideoId} not found in new window`);
      }
    }

    // 更新 ref
    prevWindowStartIndexRef.current = windowStartIndex;
  }, [windowStartIndex, windowVideoIds, itemHeight, isLandscape]);

  // ... 其他代码不变 ...
}
```

**修改说明**：
- ✅ 订阅 `windowStartIndex`
- ✅ 使用 `useLayoutEffect` 同步执行（避免闪烁）
- ✅ 只在 portrait 模式下启用

---

## 📊 数据流验证

### 完整的扩展流程

```
Before 扩展 (主池13个):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
mainQueue (13个):
  [video_10(pA), video_11(pB), video_12(pC), video_13(pD),
   video_14(pE), video_15(pF), video_16(pG), video_17(pH),
   video_18(pI), video_19(pJ), video_20(pK), video_21(pL), video_22(pM)]

availableQueue (4个):
  [p0🔓, p1🔓, p2🔓, p3🔓] (4个空闲播放器)

windowStartIndex: 10
currentVideoId: video_22 (用户滑到索引12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

用户滑到索引 12 → 触发 extendWindowNext()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: 从 available pool 借4个播放器
availableQueue: [p0🔒, p1🔒, p2🔒, p3🔒] (上锁)

Step 2: 在这4个播放器上加载 [video_23, video_24, video_25, video_26]
  p0.replaceAsync(video_23) → waitForPlayerReady ✅
  p1.replaceAsync(video_24) → waitForPlayerReady ✅
  p2.replaceAsync(video_25) → waitForPlayerReady ✅
  p3.replaceAsync(video_26) → waitForPlayerReady ✅

Step 3: 移除主池前4个
  removedMetas = [video_10(pA), video_11(pB), video_12(pC), video_13(pD)]
  mainQueue = [video_14(pE), ..., video_22(pM)]  (9个)

Step 4: 交换播放器实例
  i=0: newPlayer=p0(video_23), oldPlayer=pA(video_10)
       mainQueue.push(video_23(p0))
       availableQueue[0] = pA (解锁，置空)

  i=1: newPlayer=p1(video_24), oldPlayer=pB(video_11)
       mainQueue.push(video_24(p1))
       availableQueue[1] = pB (解锁，置空)

  i=2: newPlayer=p2(video_25), oldPlayer=pC(video_12)
       mainQueue.push(video_25(p2))
       availableQueue[2] = pC (解锁，置空)

  i=3: newPlayer=p3(video_26), oldPlayer=pD(video_13)
       mainQueue.push(video_26(p3))
       availableQueue[3] = pD (解锁，置空)

Step 5: 异步置空旧播放器（不阻塞）
  pA.replaceAsync(null)
  pB.replaceAsync(null)
  pC.replaceAsync(null)
  pD.replaceAsync(null)

Step 6: 更新 store
  windowStartIndex: 10 → 14
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After 扩展 (主池依然13个):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
mainQueue (13个):
  [video_14(pE), video_15(pF), video_16(pG), video_17(pH),
   video_18(pI), video_19(pJ), video_20(pK), video_21(pL),
   video_22(pM), video_23(p0), video_24(p1), video_25(p2), video_26(p3)]

availableQueue (4个):
  [pA🔓, pB🔓, pC🔓, pD🔓] (4个空闲播放器，已置空)

windowStartIndex: 14
currentVideoId: video_22 (依然是这个视频)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useLayoutEffect 触发:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
delta = 14 - 10 = 4
currentVideoId = video_22
newIndex = windowVideoIds.indexOf(video_22) = 8 (之前是12)
newOffset = 8 × itemHeight

scrollViewRef.scrollTo({ y: newOffset, animated: false })

用户看到的依然是 video_22，无感知！✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**验证结果**：
- ✅ 窗口大小不变（13个）
- ✅ 播放器总数不变（17个）
- ✅ 用户看到的视频不变（video_22）
- ✅ 播放器实例正确交换
- ✅ 滚动位置自动同步

---

## 🎯 与模板逻辑一致性对比

| 步骤 | 模板 | 项目方案 | 一致性 |
|------|------|----------|--------|
| **1. 获取空闲播放器** | `availablePlayers` 取4个 | `availableQueue` 找4个空闲 | ✅ 一致 |
| **2. 加载视频** | `acquirePlayer` + `replaceAsync` | `replaceAsync` + `waitForPlayerReady` | ✅ 一致 |
| **3. 等待 ready** | `waitForPlayerReady` | `waitForPlayerReady` | ✅ 一致 |
| **4. 更新窗口** | `windowData` 添加新的 | `mainQueue` 添加新的 | ✅ 一致 |
| **5. 移除旧视频** | `windowData` 移除前4个 | `mainQueue` 移除前4个 | ✅ 一致 |
| **6. 回收播放器** | 组件卸载自动 `releasePlayer` | **手动交换实例** | ⚠️ 实现不同，效果一致 |
| **7. 更新索引** | `windowStartIndex` +4 | `windowStartIndex` +4 | ✅ 一致 |
| **8. 滚动同步** | `useLayoutEffect` | `useLayoutEffect` | ✅ 一致 |

**核心思想 100% 一致**：
- ✅ 先加载后显示（避免 loading）
- ✅ 批量处理（4个）
- ✅ 维持窗口大小（13个）
- ✅ 播放器复用（不创建/销毁）
- ✅ 滚动位置同步（无闪烁）

**实现差异仅在于**：
- 模板：依赖 React 组件生命周期自动回收播放器
- 项目：手动交换播放器实例（因为播放器生命周期独立于组件）

---

## ✅ 影响范围评估

### 不会修改的部分（现有功能 100% 保留）

- ✅ **数据结构**：0 个字段修改
- ✅ **Feed 模式**：0 行代码修改
- ✅ **预加载逻辑**：完全不变
- ✅ **进入全屏**：仅删除 2 行停用逻辑
- ✅ **退出全屏**：完全不变
- ✅ **播放器获取**：完全不变
- ✅ **组件渲染**：完全不变

### 会修改的部分（最小化修改）

| 文件 | 修改内容 | 行数 |
|------|---------|------|
| `manager.ts` | 删除 2 行 + 新增 3 个方法 | +~180 行 |
| `useFullscreenScrollWindow.ts` | 追加扩展检测逻辑 | +~30 行 |
| `VideoFullscreenPage.tsx` | 新增 useLayoutEffect | +~30 行 |
| **总计** | | **+~240 行** |

---

## 🚨 风险评估

### 低风险

- **Feed 模式**：🟢 零风险（0 行修改）
- **现有全屏**：🟢 零风险（逻辑保留）
- **性能**：🟢 零风险（复用现有机制）

### 中风险

- **扩展加载失败**：🟡 日志记录，不影响现有窗口
- **滚动位置错误**：🟡 useLayoutEffect 同步执行，风险低

---

## 📝 实现清单

- [ ] 修改 `enterFullscreenMode`（删除 2 行）
- [ ] 添加 `waitForPlayerReady` 方法
- [ ] 添加 `extendWindowNext` 方法
- [ ] 添加 `extendWindowPrev` 方法
- [ ] 修改 `useFullscreenScrollWindow`
- [ ] 修改 `VideoFullscreenPage`
- [ ] 测试验证

---

## ✅ 最终确认

- ✅ **纯扩展**：不修改任何现有核心逻辑
- ✅ **最小化**：仅 3 个文件，~240 行新增代码
- ✅ **向后兼容**：现有功能 100% 保留
- ✅ **逻辑正确**：播放器交换按索引对应
- ✅ **与模板一致**：核心思想完全相同

---

**文档版本**: v2.0（修正播放器交换逻辑）
**最后更新**: 2025-01-09
**审查状态**: ⏳ 待审查
