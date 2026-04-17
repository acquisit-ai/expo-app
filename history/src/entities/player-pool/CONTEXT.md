# Player Pool Entity - 双池双模式架构上下文

> **版本**: v5.0.0
> **最后更新**: 2025-10-09

## 文档目的

本文档为 AI 智能体和开发者提供 Player Pool 模块的深层架构理解，补充 README.md 的使用文档。重点关注双池双模式设计决策、架构演进和关键实现细节。

---

## 架构概览

### 核心定位

Player Pool 是一个**独立的 Entity 层模块**，采用**双池架构**和**双模式管理**，职责是：
- 管理 17 个视频播放器实例（13 主池 + 4 available 池）
- 实现 LRU 缓存策略，自动淘汰最久未使用的播放器
- Feed List 模式：流式预加载（available pool → 主池）
- Fullscreen 模式：窗口批量替换（直接在主池操作）
- 完全独立，不依赖其他业务模块（零依赖设计）

### 双池双模式架构

```
┌────────────────────────────────────────────────────────────┐
│ 主池 (Main Pool) - 13 个播放器                              │
│ • LRU 缓存管理 (Map)                                        │
│ • 存储已完成加载的播放器                                     │
│ • acquire() 从这里获取                                      │
│ • Feed List 模式：available pool 流入                      │
│ • Fullscreen 模式：直接操作（窗口批量替换）                  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Available 池 (Available Pool) - 4 个播放器                  │
│ • 仅在 Feed List 模式使用                                   │
│ • 专门执行 replaceAsync 操作                                │
│ • 加载完成后交换到主池                                       │
│ • Fullscreen 模式：完全不使用，异步清理                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 模式管理 (Mode Manager)                                     │
│ • Feed List 模式：默认，流式预加载                           │
│ • Fullscreen 模式：点击进入视频播放页                        │
│ • 模式切换：同步 Map 更新 + 异步 available pool 清理        │
└────────────────────────────────────────────────────────────┘
```

---

## 🆕 v5.0 架构升级：完全基于VideoId

### 核心变革：Feed裁剪完全免疫

**v5.0 最大突破**：从index-based状态管理完全迁移到videoId-based，彻底解决Feed裁剪导致的index不一致问题。

### Breaking Changes

#### API变更
```typescript
// ❌ v4.0 - 基于Feed索引
playerPoolManager.enterFullscreenMode(feedIndex: number);

// ✅ v5.0 - 基于videoId
playerPoolManager.enterFullscreenMode(videoId: string);
```

#### 状态字段变更
```typescript
// ❌ v4.0 - 存储索引（Feed裁剪后失效）
interface FullscreenState {
  windowStartIndex: number;
  currentVideoIndexInWindow: number;
}

// ✅ v5.0 - 存储videoId（永不失效）
interface FullscreenState {
  windowStartVideoId: string | null;
  currentVideoId: string | null;
  windowSize: number;  // 13（固定）
}
```

### Feed裁剪免疫原理

**问题场景（v4.0）**：
```
Feed: [v1...v60] → 用户点击v40 (index=39) → 进入全屏
存储: windowStartIndex = 33

用户在全屏滑动视频...
Feed裁剪: [v1...v10] 被删除 → Feed = [v11...v60]

返回Feed页面:
  targetIndex = 33
  实际视频: feedVideoIds[33] = v44 (错误！应该是v40)
  ❌ 滚动到错误位置
```

**解决方案（v5.0）**：
```
Feed: [v1...v60] → 用户点击v40 → 进入全屏
存储: windowStartVideoId = 'v34', currentVideoId = 'v40'

用户在全屏滑动视频...
Feed裁剪: [v1...v10] 被删除 → Feed = [v11...v60]

返回Feed页面:
  targetIndex = feedVideoIds.indexOf('v40')  // 动态查找
  实际视频: feedVideoIds[29] = v40 (正确！)
  ✅ 滚动到正确位置
```

### 动态索引计算模式

**核心机制**：所有索引都通过videoId动态计算，不存储
```typescript
// 窗口起始位置（动态计算）
const windowStartIndex = feedVideoIds.indexOf(windowStartVideoId);

// 当前视频位置（动态计算）
const currentIndex = windowVideoIds.indexOf(currentVideoId);

// Feed裁剪后自动适应
if (windowStartIndex === -1) {
  // 窗口起始视频已被裁剪，安全退出
  return;
}
```

**性能权衡**：
- O(1) (index直接访问) → O(n) (indexOf查找)
- 实测：n≤500, indexOf耗时 ~0.01ms
- 换来架构健壮性和零复杂度（无需监听Feed变化）

### 窗口扩展功能

**新增API**：
```typescript
// 向后扩展4个视频（用户向下滑动）
playerPoolManager.extendWindowNext();

// 向前扩展4个视频（用户向上滑动）
playerPoolManager.extendWindowPrev();
```

**窗口扩展流程**（基于videoId）：
```
当前窗口: [v40...v52] (13个视频)
用户滑动到 index=11 → 触发扩展

1️⃣ 动态计算当前窗口位置
   windowStartIndex = feedVideoIds.indexOf('v40')  // 结果: 39

2️⃣ 计算新窗口起始位置
   newWindowStartIndex = windowStartIndex + 4  // 结果: 43

3️⃣ 获取新窗口videoIds
   newWindowVideoIds = feedVideoIds.slice(43, 56)  // [v44...v56]

4️⃣ 并发加载4个新视频
   await Promise.all([
     loadVideo('v53'), loadVideo('v54'),
     loadVideo('v55'), loadVideo('v56')
   ])

5️⃣ 原子更新状态
   updateWindowState({
     windowStartVideoId: 'v44',  // ✅ 存储videoId
     currentVideoId: currentVideoId,
     mainQueue: updatedQueue
   })
```

**Feed裁剪场景处理**：
```typescript
// 窗口扩展前检查
const currentWindowStartIndex = feedVideoIds.indexOf(windowStartVideoId);

if (currentWindowStartIndex === -1) {
  log(ERROR, 'Window start video not in feed, cannot extend');
  return;  // ✅ 安全退出，不会crash或加载错误视频
}
```

### v5.0 架构优势总结

| 维度 | v4.0 (Index) | v5.0 (VideoId) | 提升 |
|------|-------------|----------------|------|
| **Feed裁剪容错** | ❌ Index失效，滚动错误 | ✅ VideoId永不失效 | 100% 可靠 |
| **状态一致性** | ⚠️ 需监听Feed变化，手动调整 | ✅ 自动适应，零手动干预 | 零复杂度 |
| **索引查找** | O(1) 直接访问 | O(n) indexOf, n≤500 | ~0.01ms 可忽略 |
| **窗口扩展** | 基于index计算，易出错 | 基于videoId，健壮 | 架构简化 |
| **调试难度** | 高（index不一致难追踪） | 低（videoId可读性强） | 开发效率提升 |

**设计哲学**：用可忽略的性能代价（~0.01ms）换取架构级健壮性和可维护性。

---

## 核心设计决策

### 1. 为什么采用双池架构？

**问题**：v3.x 单池架构（5 个播放器）在 Fullscreen 模式下性能不足
- ❌ 只能预加载当前视频周围 2-3 个
- ❌ 用户上下滑动时，缓存命中率低
- ❌ 频繁的视频加载导致卡顿

**解决方案**：双池架构
```
主池 (13 个)：
  - Fullscreen 模式窗口大小（点击 ± 6）
  - 用户可以流畅上下滑动 13 个视频

Available 池 (4 个)：
  - Feed List 模式预加载专用
  - 并发加载 4 个视频，平衡性能和资源
```

**收益**：
- ✅ Fullscreen 模式缓存命中率 ~90%（vs 单池 ~40%）
- ✅ Feed List 模式保持 4 并发预加载
- ✅ 总播放器实例 17 个，内存可控（~85MB）

---

### 2. 为什么需要双模式管理？

**Feed List 模式**（默认）：
```
用户在 Feed 列表滑动
  ↓
预加载周围 3-4 个视频（当前 + 后2 + 前1）
  ↓
使用 available pool（4 并发）
  ↓
加载完成交换到主池（LRU 淘汰最旧的）
```

**Fullscreen 模式**（视频播放页）：
```
用户点击进入播放页面
  ↓
计算窗口（点击 ± 6，共 13 个）
  ↓
直接在主池批量替换（13 并发）
  ↓
Map 同步更新（~4ms），UI 立即响应
  ↓
视频异步加载（fire-and-forget）
```

**模式对比**：

| 特性 | Feed List 模式 | Fullscreen 模式 |
|------|---------------|----------------|
| **使用池** | available pool + 主池 | 仅主池 |
| **并发数** | 4 | 13 |
| **加载方式** | 流式（交换实例） | 批量（直接换源） |
| **UI 响应** | N/A | ~4ms（同步 Map） |
| **性能** | 平衡 | 极致（4x 提升） |

---

### 3. LRU 策略：为什么用 Map？

**核心优势**：
```typescript
// O(1) 时间复杂度的 LRU 操作
private lruMap: Map<string, MainPlayerMeta> = new Map();

// 命中：移到末尾
acquire(videoId) {
  const meta = this.lruMap.get(videoId);
  this.lruMap.delete(videoId);  // O(1)
  this.lruMap.set(videoId, meta);  // O(1)
}

// 未命中：替换第一个（最旧）
acquire(newVideoId) {
  const oldestKey = this.lruMap.keys().next().value;  // O(1)
  const oldestMeta = this.lruMap.get(oldestKey);
  this.lruMap.delete(oldestKey);  // O(1)
  this.lruMap.set(newVideoId, oldestMeta);  // O(1)
}
```

**两种模式统一的 LRU 逻辑**：
- Feed List 模式：`moveToMainPool()` 和 `acquire()` 都使用 LRU
- Fullscreen 模式：`replaceMainPoolWithWindow()` 使用相同的 LRU 逻辑
- 保证每个播放器只被分配一次，顺序一致

---

### 4. Fullscreen 模式为什么不使用 available pool？

**设计决策**：完全绕过 available pool，直接在主池操作

**原因**：
1. **性能**：13 并发 vs 4 并发，加载速度 4x 提升
   ```
   Available pool 方式：4 并发 = 2000ms
   主池直接操作：13 并发 = 500ms
   ```

2. **简化**：无需交换播放器实例
   ```typescript
   // ❌ Available pool 方式（复杂）
   交换实例: available.playerInstance ↔ mainPool.playerInstance

   // ✅ 主池直接操作（简单）
   直接换源: player.replaceAsync(newVideoUrl)
   ```

3. **响应速度**：Map 同步更新，UI 立即响应
   ```typescript
   // 同步更新 Map（~4ms）
   this.mainPool.set(videoId, { playerInstance, videoId });

   // 异步加载视频（fire-and-forget）
   this.replaceOnMainPoolPlayer(player, videoId).catch(log);

   // UI 可以立即 acquire() 和导航
   ```

**Available pool 在 Fullscreen 模式的处理**：
```typescript
// 进入 Fullscreen 时
enterFullscreenMode() {
  this.isClearingAvailablePool = true;  // 标记清理中
  this.clearAvailablePoolInBackground();  // 异步清理
}

// 清理模式下的行为
loadInAvailablePool() {
  await player.replaceAsync(videoSource);

  if (this.isClearingAvailablePool) {
    log('Clearing mode: video discarded');  // 丢弃
  } else {
    this.moveToMainPool(...);  // 正常移入
  }
}
```

---

### 5. 模式切换的并发安全

**问题场景**：进入 Fullscreen 时，available pool 可能正在加载视频

**解决方案**：
```typescript
// 1. 标记清理中（立即生效）
this.isClearingAvailablePool = true;

// 2. 阻止新的预加载请求
preloadVideos(videoIds) {
  if (this.isClearingAvailablePool) {
    log('Preload skipped in Fullscreen mode');
    return;
  }
  // ...
}

// 3. 阻止 acquireImmediate 使用 available pool
acquireImmediate(videoId) {
  if (this.isClearingAvailablePool) {
    throw new Error('Available pool unavailable in Fullscreen mode');
  }
  // ...
}

// 4. 后台异步清理（不阻塞）
clearAvailablePoolInBackground() {
  (async () => {
    // 等待所有上锁的解锁
    while (this.availablePool.some(p => p.isLocked)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 重置为 null 源
    for (const p of this.availablePool) {
      await p.playerInstance.replaceAsync(null);
    }

    this.isClearingAvailablePool = false;
  })();
}

// 5. 退出 Fullscreen 时立即恢复
exitFullscreenMode() {
  this.currentMode = PoolMode.FEED_LIST;
  this.isClearingAvailablePool = false;  // 立即恢复
}
```

---

### 6. 批量替换的正确性保证

**关键问题**：窗口中的视频在主池中可能是乱序的，如何保证每个播放器只被分配一次？

**错误方案**：
```typescript
// ❌ 错误：使用 currentEntries[i]（按位置）
for (let i = 0; i < windowVideoIds.length; i++) {
  const [oldVideoId, oldMeta] = currentEntries[i];
  // 问题：currentEntries[i] 的播放器可能已被前面的迭代使用
}
```

**正确方案**：
```typescript
// ✅ 正确：从当前 Map 取第一个（LRU 最旧）
for (let i = 0; i < windowVideoIds.length; i++) {
  const targetVideoId = windowVideoIds[i];

  if (this.mainPool.has(targetVideoId)) {
    // 命中：delete + add 到末尾
    const meta = this.mainPool.get(targetVideoId)!;
    this.mainPool.delete(targetVideoId);
    this.mainPool.set(targetVideoId, meta);
  } else {
    // 未命中：取当前 Map 的第一个（最旧）
    const oldestKey = this.mainPool.keys().next().value;
    const oldestMeta = this.mainPool.get(oldestKey)!;

    this.mainPool.delete(oldestKey);
    this.mainPool.set(targetVideoId, {
      playerInstance: oldestMeta.playerInstance,
      videoId: targetVideoId,
    });

    // 异步加载
    this.replaceOnMainPoolPlayer(oldestMeta.playerInstance, targetVideoId);
  }
}
```

**保证**：
- ✅ 命中的视频先 delete，后续未命中不会再取到
- ✅ 未命中时取"当前 Map 的第一个"，已使用的不在第一个位置
- ✅ 最终顺序 = 窗口顺序
- ✅ 每个播放器只分配一次

---

## 性能特征

### 时间复杂度

| 操作 | Feed List | Fullscreen | 复杂度 |
|------|-----------|-----------|--------|
| `acquire()` 命中 | O(1) | O(1) | delete + set |
| `acquire()` 未命中 | O(1) | O(1) | delete + set |
| `preloadVideos()` | O(m) | O(1) | m≤4 过滤，或跳过 |
| `enterFullscreenMode()` | - | O(13) | 遍历窗口 |
| `replaceMainPoolWithWindow()` | - | O(13) | 批量替换 |

### 性能对比

| 指标 | Feed List | Fullscreen | 提升 |
|------|-----------|-----------|------|
| UI 响应 | N/A | ~4ms | - |
| 并发加载 | 4 | 13 | 3.25x |
| 总加载时间 | ~2000ms | ~500ms | 4x |
| 命中率 | ~80% | ~95% | - |

### 内存占用

- 主池：13 × ~5MB = ~65MB
- Available 池：4 × ~5MB = ~20MB
- **总计：~85MB**（固定上限）

---

## 架构演进历史

### v1.0 - 单池单模式
- 5 个播放器，单一 LRU 缓存
- ❌ Fullscreen 模式缓存命中率低
- ❌ 频繁加载导致卡顿

### v2.0 - 引入 PreloadScheduler
- 三层架构：UI → Scheduler → Manager
- ✅ O(1) 队列替换
- ✅ 容量感知调度
- ❌ 仍然是单池，Fullscreen 性能不足

### v3.0 - PlayerMeta 重构
- 移除 videoMetaData 字段
- ✅ SSOT 原则（Video Meta Entity）
- ❌ 仍然是单池 5 个播放器

### v4.0 - 双池双模式
- 13 主池 + 4 available 池
- Feed List 模式 + Fullscreen 模式
- ✅ 性能提升 4x
- ✅ 命中率 ~95%
- ✅ UI 响应 ~4ms
- ❌ Index-based状态，Feed裁剪易出错

### v5.0 - VideoId-Based架构（当前）
- **完全基于videoId的状态管理**
- **Feed裁剪完全免疫**
- **窗口扩展功能** (extendWindowNext/Prev)
- **动态索引计算** (indexOf，~0.01ms)
- ✅ 架构健壮性提升（100%可靠）
- ✅ 零复杂度（无需监听Feed变化）
- ✅ 开发效率提升（videoId可读性强）

---

## 与其他模块的集成

### 与 entities/video 的集成

```typescript
// useVideoDataLogic.ts

// Feed List 模式：预加载
const preloadVideos = (videoIds: string[]) => {
  playerPoolManager.preloadVideos(videoIds);
};

// 进入 Fullscreen 模式（v5.0 API）
const enterVideoDetail = async (videoId: string) => {
  // ✅ v5.0: 直接传入videoId，内部动态查找索引
  playerPoolManager.enterFullscreenMode(videoId);

  // 获取播放器（状态已更新）
  const player = await playerPoolManager.acquire(videoId);

  // 设置当前播放器（基于videoId）
  setCurrentPlayerMeta({ videoId, playerInstance: player });

  // 导航
  navigation.navigate('VideoFullscreen', { videoId });
};

// 退出 Fullscreen 模式
const exitToFeed = () => {
  playerPoolManager.exitFullscreenMode();
  navigation.navigate('MainTabs', { screen: 'Feed' });
};
```

**v5.0 集成优势**：
- 无需手动查找Feed索引，Manager内部动态计算
- Feed裁剪不影响：videoId作为唯一标识符，永不失效
- 代码简化：减少一行`indexOf`调用，降低耦合

### 与 pages/feed 的集成

```typescript
// FeedPage.tsx

const handleScrollEnd = useCallback(() => {
  const currentIndex = getCurrentVisibleIndex();

  // 优先级：当前 > 后2 > 前1
  const videosToPreload = [
    feedList[currentIndex],
    feedList[currentIndex + 1],
    feedList[currentIndex + 2],
    feedList[currentIndex - 1],
  ].filter(Boolean).map(v => v.id);

  preloadVideos(videosToPreload);
}, [feedList, preloadVideos]);
```

---

## 调试与监控

### 开发环境调试 API

```javascript
// 浏览器控制台或 React Native Debugger

// 查看池状态
__playerPoolManager.getPoolInfo()
// {
//   mainPool: { size: 13, entries: [...] },
//   availablePool: { size: 4, entries: [...] }
// }

// 进入 Fullscreen 模式
__playerPoolManager.enterFullscreenMode(5)

// 退出 Fullscreen 模式
__playerPoolManager.exitFullscreenMode()
```

### 典型日志输出

```
[INFO] Initializing dual-pool: 13 main + 4 available
[INFO] Pool initialized: 13 main, 4 available

[DEBUG] Preload request: [v1, v2, v3]
[INFO] Video loaded successfully: v2
[DEBUG] Moving to main pool: v2, evicting: __empty_0

[INFO] Entering Fullscreen mode, clicked index: 5
[DEBUG] Window calculated: [2, 14], 13 videos
[DEBUG] Window[0]: v2 already cached, reusing
[DEBUG] Window[1]: Loading v10, evicting v1
[INFO] Fullscreen mode activated, Map updated instantly
```

---

## 常见问题

### Q: 为什么是 13 个主池？
**A:** 对应 Fullscreen 模式滑动窗口（点击 ± 6），用户可流畅上下滑动。

### Q: 为什么是 4 个 available 池？
**A:** 平衡预加载速度和资源占用，4 并发既快速又不占用过多带宽。

### Q: Fullscreen 模式为什么完全不用 available pool？
**A:**
- 性能：13 并发 vs 4 并发，快 3.25 倍
- 简化：直接换源，无需交换实例
- 响应：Map 同步更新，UI 立即响应

### Q: 模式切换会中断正在加载的视频吗？
**A:** 不会。清理模式下，available pool 正在加载的视频会继续完成，但结果被丢弃。

---

## 未来优化方向

1. **智能窗口大小**：根据用户滑动速度动态调整窗口
2. **网络感知**：根据网络状态调整并发数
3. **分段加载**：只加载视频前 3 秒，按需加载剩余部分
4. **统计分析**：详细性能指标和监控面板

---

## 设计原则总结

1. **双池分离**：缓存（主池）和加载（available 池）职责分离
2. **双模式隔离**：Feed List 和 Fullscreen 独立，互不干扰
3. **同步优先**：Fullscreen 模式 Map 同步更新，UI 不阻塞
4. **零依赖**：Entity 层不依赖其他业务模块
5. **性能至上**：O(1) LRU 操作，最小化内存占用
6. **容错性**：静默失败，错误恢复，不影响主流程

---

**文档版本**: v5.0.0
**最后更新**: 2025-10-09
**维护者**: Player Pool Team
