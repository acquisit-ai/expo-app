# VideoFullscreenPage ScrollView 滑动架构文档

> **版本**: v1.0.0
> **最后更新**: 2025-10-08
> **架构类型**: 双模式滑动窗口（竖屏滑动/横屏单视频）

## 📋 目录

- [1. 架构概览](#1-架构概览)
- [2. 核心设计原则](#2-核心设计原则)
- [3. 数据流与交互](#3-数据流与交互)
- [4. 关键问题与解决方案](#4-关键问题与解决方案)
- [5. API 文档](#5-api-文档)
- [6. 实施指南](#6-实施指南)
- [7. 性能优化](#7-性能优化)
- [8. 对比分析](#8-对比分析)

---

## 1. 架构概览

### 1.1 设计目标

**核心需求**：
- ✅ 竖屏模式：ScrollView 滑动切换视频（TikTok 风格）
- ✅ 横屏模式：单视频显示，禁止滑动
- ✅ 复用已有的 player-pool 13 个主池窗口
- ✅ 无需预加载逻辑（主池已加载完成）
- ✅ 无需窗口管理（直接使用主池顺序）

### 1.2 架构层次

```
┌─────────────────────────────────────────────────────────────────┐
│ VideoFullscreenPage (Page 层)                                   │
│ • 双模式布局渲染                                                  │
│ • 竖屏：ScrollView + 13 个 FullscreenVideoPlayerSection         │
│ • 横屏：单个 FullscreenVideoPlayerSection                        │
└────────────┬────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────────────┐
│ useFullscreenScrollWindow (Custom Hook)                         │
│ • 从 player-pool 获取主池窗口数据                                 │
│ • 管理滚动状态和当前可见索引                                       │
│ • 同步 currentVideoId 到 video entity                            │
│ • 处理横竖屏切换时的滚动恢复                                       │
└────────────┬────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────────────┐
│ PlayerPoolManager (Entity 层)                                   │
│ • 提供 getPoolInfo() - 获取主池窗口                              │
│ • 提供 getPlayerInstance() - 同步获取 player 实例                │
│ • 主池 Map 顺序 = 窗口顺序 = 滑动顺序                            │
└────────────┬────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Video Entity Store                                              │
│ • 存储 currentPlayerMeta (videoId + playerInstance)             │
│ • 提供 setCurrentPlayerMeta() - 更新当前视频                     │
│ • FullscreenVideoPlayerSection 根据此判断 isActiveVideo         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 技术栈

| 技术 | 用途 |
|------|------|
| **ScrollView** | 竖屏滑动容器（paging 模式） |
| **player-pool 主池** | 13 个视频窗口数据源 |
| **useFullscreenScrollWindow** | 窗口管理和滚动逻辑 |
| **FullscreenVideoPlayerSection** | 视频播放组件（Widget 层） |
| **video entity** | 当前视频状态管理 |

---

## 2. 核心设计原则

### 2.1 零额外窗口管理

**设计理念**：复用 player-pool 主池，无需 reducer 或额外状态。

```typescript
// ❌ 不需要这些（video-scroll 有）
const [windowData, dispatch] = useReducer(videoWindowReducer, ...);
const isLoadingRef = useRef({ next: false, prev: false });
const hasTriggeredLoadRef = useRef({ next: false, prev: false });

// ✅ 直接使用主池
const poolInfo = playerPoolManager.getPoolInfo();
const windowVideoIds = poolInfo.mainPool.entries.map(entry => entry.videoId);
```

**原因**：
- Fullscreen 模式进入时，`enterFullscreenMode(feedIndex)` 已将主池批量替换为窗口视频
- 主池 Map 顺序 = 窗口顺序（LRU 算法保证）
- 13 个视频全部在主池，无需动态加载

### 2.2 零预加载逻辑

**设计理念**：主池视频已加载完成，滚动立即响应。

```typescript
// ❌ 不需要这些（video-scroll 有）
const load = async (direction: 'next' | 'prev') => {
  const preloadPromises = videosToLoad.map(async (video) => {
    const player = await playerPool.acquirePlayer(video.metaId, video.video_url);
    await waitForPlayerReady(player);
  });
  await Promise.all(preloadPromises);
  dispatch({ type: 'LOAD_NEXT' });
};

// ✅ 直接使用已加载的 player
const playerInstance = playerPoolManager.getPlayerInstance(videoId);
```

**原因**：
- `replaceMainPoolWithWindow()` 虽然是异步加载，但 Map 已同步更新
- `getPlayerInstance()` 立即返回 player 实例
- 即使 player.status = 'loading'，UI 也能显示（有 loading 状态）

### 2.3 同步 currentVideoId 到 video entity

**设计理念**：滚动时立即同步当前视频到 video store，保证 `isActiveVideo` 判断正确。

```typescript
const handleScroll = (event) => {
  const newIndex = Math.round(offsetY / itemHeight);
  const newVideoId = windowVideoIds[newIndex];

  // 🔑 关键：同步到 video entity
  const playerInstance = playerPoolManager.getPlayerInstance(newVideoId);
  if (playerInstance) {
    useVideoStore.getState().setCurrentPlayerMeta({
      videoId: newVideoId,
      playerInstance,
    });
  }
};
```

**原因**：
- `FullscreenVideoPlayerSection` 内部根据 `videoId === currentVideoId` 判断 `isActiveVideo`
- `isActiveVideo` 控制播放/暂停、字幕显示等
- 必须保证 video store 的 `currentVideoId` 与滚动位置同步

### 2.4 双模式布局隔离

**设计理念**：竖屏和横屏完全不同的渲染分支，互不干扰。

```typescript
// 🔑 竖屏：ScrollView 滑动
if (!isLandscape) {
  return (
    <ScrollView>
      {windowVideoIds.map((videoId, index) => (
        <FullscreenVideoPlayerSection key={videoId} {...} />
      ))}
    </ScrollView>
  );
}

// 🔑 横屏：单视频
return <FullscreenVideoPlayerSection playerMeta={currentPlayerMeta} {...} />;
```

**原因**：
- 横屏模式不需要 ScrollView
- 竖屏模式渲染 13 个视频组件
- 切换时组件卸载/重新挂载，逻辑清晰

---

## 3. 数据流与交互

### 3.1 进入 Fullscreen 数据流

```
用户点击 Feed 视频（index=5）
  ↓
video entity: enterVideoDetail(videoId)
  ↓
player-pool: enterFullscreenMode(5)
  ├─ 计算窗口 [5-6, 5+6] = [v-1, v0, v1, ..., v11]（13个）
  ├─ 批量替换主池（同步更新 Map，异步加载视频）
  └─ 主池 Map 顺序 = [v-1, v0, v1, ..., v11]
  ↓
navigation.navigate('VideoFullscreen', { videoId, autoPlay: true })
  ↓
VideoFullscreenPage 挂载
  ↓
useFullscreenScrollWindow 初始化
  ├─ poolInfo = playerPoolManager.getPoolInfo()
  ├─ windowVideoIds = poolInfo.mainPool.entries.map(e => e.videoId)
  ├─ clickedIndex = windowVideoIds.indexOf(videoId)
  ├─ setCurrentPlayerMeta({ videoId, playerInstance }) ← 同步到 video store
  └─ scrollTo({ y: clickedIndex * itemHeight, animated: false })
  ↓
渲染 13 个 FullscreenVideoPlayerSection
  ├─ videoId === currentVideoId → isActiveVideo = true（点击的视频）
  └─ 其他视频 → isActiveVideo = false
  ↓
点击的视频自动播放 ✅
```

### 3.2 滚动切换视频数据流

```
用户向上滑动 ScrollView
  ↓
handleScroll 触发
  ├─ offsetY = event.nativeEvent.contentOffset.y
  ├─ newIndex = Math.round(offsetY / itemHeight)
  └─ newVideoId = windowVideoIds[newIndex]
  ↓
setCurrentVisibleIndex(newIndex)
  ↓
getPlayerInstance(newVideoId) → playerInstance
  ↓
setCurrentPlayerMeta({ videoId: newVideoId, playerInstance })
  ↓ 同步到 video store
FullscreenVideoPlayerSection 重渲染
  ├─ 旧视频：isActiveVideo = false → pause()
  └─ 新视频：isActiveVideo = true → play()
  ↓
新视频开始播放 ✅
```

### 3.3 横竖屏切换数据流

#### 竖屏 → 横屏

```
用户旋转屏幕到横屏
  ↓
isLandscape = true
  ↓
VideoFullscreenPage 重渲染
  ├─ if (!isLandscape) 分支不执行
  └─ 渲染单视频分支
  ↓
ScrollView 卸载，13 个视频组件卸载
  ↓
渲染单个 FullscreenVideoPlayerSection（currentPlayerMeta）
  ↓
横屏全屏播放 ✅
```

#### 横屏 → 竖屏

```
用户旋转屏幕到竖屏
  ↓
isLandscape = false
  ↓
useEffect 检测到 wasLandscape.current = true
  ↓
requestAnimationFrame(() => {
  scrollTo({ y: currentVisibleIndex * itemHeight, animated: false })
})
  ↓
VideoFullscreenPage 重渲染
  ├─ if (!isLandscape) 分支执行
  └─ 渲染 ScrollView + 13 个视频
  ↓
ScrollView 滚动到 currentVisibleIndex 位置
  ↓
恢复竖屏滑动模式 ✅
```

---

## 4. 关键问题与解决方案

### 4.1 ❌ 问题：currentVideoId 不同步

**问题描述**：
```typescript
// Hook 中维护的当前视频
const currentVideoId = windowVideoIds[currentVisibleIndex];

// FullscreenVideoPlayerSection 内部从 video store 读取
const currentVideoId = useVideoStore(selectCurrentVideoId);
const isActiveVideo = videoId === currentVideoId;
```

如果不同步，`isActiveVideo` 判断错误 → 播放/暂停失效。

**解决方案**：
```typescript
const handleScroll = (event) => {
  const newVideoId = windowVideoIds[newIndex];

  // 🔑 同步到 video entity
  const playerInstance = playerPoolManager.getPlayerInstance(newVideoId);
  if (playerInstance) {
    useVideoStore.getState().setCurrentPlayerMeta({
      videoId: newVideoId,
      playerInstance,
    });
  }
};
```

### 4.2 ❌ 问题：初始滚动时机错误

**问题代码**：
```typescript
useEffect(() => {
  setWindowVideoIds(videoIds);  // 异步更新 state

  // windowVideoIds 还是旧值（[]）
  const clickedIndex = windowVideoIds.indexOf(clickedVideoId);  // -1 ❌
}, []);
```

**解决方案**：
```typescript
useEffect(() => {
  const poolInfo = playerPoolManager.getPoolInfo();
  const videoIds = poolInfo.mainPool.entries.map(entry => entry.videoId);
  setWindowVideoIds(videoIds);

  // ✅ 使用刚获取的 videoIds，不是 state
  const clickedIndex = videoIds.indexOf(clickedVideoId);
  if (clickedIndex !== -1) {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: clickedIndex * itemHeight });
    });
  }
}, []);
```

### 4.3 ❌ 问题：横屏切换未恢复滚动位置

**问题**：竖屏 → 横屏 → 竖屏，ScrollView 重新挂载，丢失滚动位置。

**解决方案**：
```typescript
const wasLandscape = useRef(isLandscape);

useEffect(() => {
  // 从横屏回到竖屏
  if (!isLandscape && wasLandscape.current && windowVideoIds.length > 0) {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: currentVisibleIndexRef.current * itemHeight,
        animated: false,
      });
    });
  }
  wasLandscape.current = isLandscape;
}, [isLandscape, windowVideoIds.length, itemHeight]);
```

### 4.4 ✅ PlayerInstance 可能处于 loading 状态

**问题**：`replaceMainPoolWithWindow` 是同步更新 Map，异步加载视频。

**分析**：
- `getPlayerInstance()` 返回的 player 可能 `status = 'loading'`
- `VideoView` 组件能正常处理 loading 状态
- UI 显示 loading 指示器

**结论**：✅ 不是问题，UI 已有 loading 状态处理。

---

## 5. API 文档

### 5.1 useFullscreenScrollWindow Hook

```typescript
/**
 * 全屏滑动窗口 Hook
 * @param isLandscape - 是否横屏模式
 */
function useFullscreenScrollWindow(isLandscape: boolean): {
  // ScrollView ref
  scrollViewRef: RefObject<ScrollView>;

  // 窗口视频 ID 列表（13个）
  windowVideoIds: string[];

  // 当前可见视频 ID
  currentVideoId: string | null;

  // 当前可见索引（在窗口中的位置）
  currentVisibleIndex: number;

  // 滚动事件处理
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

  // 视频项高度（屏幕高度）
  itemHeight: number;

  // 获取 PlayerMeta
  getPlayerMeta: (videoId: string) => PlayerMeta | null;
}
```

### 5.2 playerPoolManager 新增 API

```typescript
/**
 * 同步获取主池中已存在的 player 实例
 * @param videoId - 视频 ID
 * @returns player 实例或 null（如果不在主池）
 */
getPlayerInstance(videoId: string): VideoPlayer | null;
```

**实现**：
```typescript
getPlayerInstance(videoId: string): VideoPlayer | null {
  const meta = this.mainPool.get(videoId);
  return meta?.playerInstance || null;
}
```

### 5.3 VideoFullscreenPage Props

```typescript
// 通过 route.params 传递
interface VideoFullscreenPageParams {
  videoId: string;      // 点击的视频 ID
  autoPlay?: boolean;   // 是否自动播放
}
```

---

## 6. 实施指南

### 6.1 步骤 1：扩展 playerPoolManager API

**文件**：`src/entities/player-pool/model/manager.ts`

```typescript
/**
 * 同步获取主池中已存在的 player 实例
 */
getPlayerInstance(videoId: string): VideoPlayer | null {
  const meta = this.mainPool.get(videoId);
  return meta?.playerInstance || null;
}
```

**导出**：`src/entities/player-pool/index.ts`

```typescript
export { playerPoolManager } from './model/manager';
```

### 6.2 步骤 2：实现 useFullscreenScrollWindow Hook

**文件**：`src/pages/video-fullscreen/hooks/useFullscreenScrollWindow.ts`

<details>
<summary>完整代码</summary>

```typescript
import { useState, useRef, useCallback, useEffect } from 'react';
import { ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { playerPoolManager } from '@/entities/player-pool';
import { useVideoStore } from '@/entities/video';
import type { VideoFullscreenScreenProps } from '@/shared/navigation/types';
import type { PlayerMeta } from '@/shared/types';

export function useFullscreenScrollWindow(isLandscape: boolean) {
  const route = useRoute<VideoFullscreenScreenProps['route']>();
  const { videoId: clickedVideoId } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  const itemHeight = Dimensions.get('window').height;
  const wasLandscape = useRef(isLandscape);

  const [windowVideoIds, setWindowVideoIds] = useState<string[]>([]);
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);

  const currentVisibleIndexRef = useRef(currentVisibleIndex);
  useEffect(() => {
    currentVisibleIndexRef.current = currentVisibleIndex;
  }, [currentVisibleIndex]);

  // 初始化
  useEffect(() => {
    const poolInfo = playerPoolManager.getPoolInfo();
    const videoIds = poolInfo.mainPool.entries.map(entry => entry.videoId);
    setWindowVideoIds(videoIds);

    const clickedIndex = videoIds.indexOf(clickedVideoId);
    if (clickedIndex !== -1) {
      setCurrentVisibleIndex(clickedIndex);

      const playerInstance = playerPoolManager.getPlayerInstance(clickedVideoId);
      if (playerInstance) {
        useVideoStore.getState().setCurrentPlayerMeta({
          videoId: clickedVideoId,
          playerInstance,
        });
      }

      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: clickedIndex * itemHeight,
          animated: false,
        });
      });
    }
  }, [clickedVideoId, itemHeight]);

  // 横屏 → 竖屏恢复
  useEffect(() => {
    if (!isLandscape && wasLandscape.current && windowVideoIds.length > 0) {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: currentVisibleIndexRef.current * itemHeight,
          animated: false,
        });
      });
    }
    wasLandscape.current = isLandscape;
  }, [isLandscape, windowVideoIds.length, itemHeight]);

  // 滚动处理
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newIndex = Math.round(offsetY / itemHeight);

    if (newIndex >= 0 && newIndex < windowVideoIds.length) {
      const newVideoId = windowVideoIds[newIndex];

      setCurrentVisibleIndex(newIndex);

      const playerInstance = playerPoolManager.getPlayerInstance(newVideoId);
      if (playerInstance) {
        useVideoStore.getState().setCurrentPlayerMeta({
          videoId: newVideoId,
          playerInstance,
        });
      }
    }
  }, [itemHeight, windowVideoIds]);

  const getPlayerMeta = useCallback((videoId: string): PlayerMeta | null => {
    const playerInstance = playerPoolManager.getPlayerInstance(videoId);
    return playerInstance ? { videoId, playerInstance } : null;
  }, []);

  return {
    scrollViewRef,
    windowVideoIds,
    currentVideoId: windowVideoIds[currentVisibleIndex] || null,
    currentVisibleIndex,
    handleScroll,
    itemHeight,
    getPlayerMeta,
  };
}
```

</details>

### 6.3 步骤 3：改造 VideoFullscreenPage

**文件**：`src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx`

<details>
<summary>完整代码</summary>

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';

import { FullscreenVideoPlayerSection } from '@/widgets/fullscreen-video-player-section';
import { VideoDisplayMode } from '@/shared/types';
import type { VideoFullscreenScreenProps } from '@/shared/navigation/types';

import { useVideoFullscreenLogic } from '../model/useVideoFullscreenLogic';
import { useFullscreenScrollWindow } from '../model/useFullscreenScrollWindow';

export function VideoFullscreenPage() {
  const route = useRoute<VideoFullscreenScreenProps['route']>();
  const { autoPlay } = route.params;

  const { exitFullscreen, isLandscape } = useVideoFullscreenLogic();

  const {
    scrollViewRef,
    windowVideoIds,
    currentVideoId,
    currentVisibleIndex,
    handleScroll,
    itemHeight,
    getPlayerMeta,
  } = useFullscreenScrollWindow(isLandscape);

  const displayMode = useMemo(() =>
    isLandscape ? VideoDisplayMode.FULLSCREEN_LANDSCAPE : VideoDisplayMode.FULLSCREEN_PORTRAIT,
    [isLandscape]
  );

  if (windowVideoIds.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="bodyLarge" style={{ color: '#fff' }}>
          窗口数据加载失败
        </Text>
      </View>
    );
  }

  // 竖屏：ScrollView 滑动
  if (!isLandscape) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <ScrollView
          ref={scrollViewRef}
          pagingEnabled
          scrollsToTop={false}
          decelerationRate="normal"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        >
          {windowVideoIds.map((videoId, index) => {
            const playerMeta = getPlayerMeta(videoId);
            const isVisible = index === currentVisibleIndex;

            if (!playerMeta) return null;

            return (
              <View key={videoId} style={{ height: itemHeight, backgroundColor: 'black' }}>
                <FullscreenVideoPlayerSection
                  playerMeta={playerMeta}
                  onExitFullscreen={exitFullscreen}
                  displayMode={displayMode}
                  autoPlay={autoPlay && isVisible}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // 横屏：单视频
  const currentPlayerMeta = getPlayerMeta(currentVideoId!);

  if (!currentPlayerMeta) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="bodyLarge" style={{ color: '#fff' }}>
          视频加载失败
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <FullscreenVideoPlayerSection
        playerMeta={currentPlayerMeta}
        onExitFullscreen={exitFullscreen}
        displayMode={displayMode}
        autoPlay={autoPlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
```

</details>

### 6.4 步骤 4：测试检查清单

- [ ] 进入 Fullscreen 后初始滚动到点击视频位置
- [ ] 滚动切换视频，播放/暂停正常
- [ ] 横竖屏切换，滚动位置恢复正确
- [ ] 主池窗口顺序与滑动顺序一致
- [ ] 字幕只在活跃视频显示
- [ ] 性能流畅，无卡顿

---

## 7. 性能优化

### 7.1 ScrollView 优化

```typescript
<ScrollView
  pagingEnabled                      // 分页滚动，整屏切换
  scrollsToTop={false}              // 禁用点击状态栏滚动到顶部
  decelerationRate="normal"         // 正常减速率
  scrollEventThrottle={16}          // 60fps 滚动事件
  showsVerticalScrollIndicator={false}
  removeClippedSubviews={true}      // 移除屏幕外视图（性能优化）
  // windowSize={3}                 // 可选：渲染窗口大小
/>
```

### 7.2 FullscreenVideoPlayerSection 优化

```typescript
export const FullscreenVideoPlayerSection = React.memo(
  function FullscreenVideoPlayerSection({ playerMeta, displayMode, autoPlay, onExitFullscreen }) {
    // ...
  },
  (prevProps, nextProps) => {
    // 仅在 videoId 或 autoPlay 变化时重渲染
    return (
      prevProps.playerMeta.videoId === nextProps.playerMeta.videoId &&
      prevProps.autoPlay === nextProps.autoPlay
    );
  }
);
```

### 7.3 避免闭包问题

```typescript
// ❌ 错误：handleScroll 依赖 windowVideoIds，频繁重新创建
const handleScroll = useCallback((event) => {
  const newIndex = Math.round(offsetY / itemHeight);
  const newVideoId = windowVideoIds[newIndex];  // 闭包
}, [windowVideoIds]);

// ✅ 正确：使用 ref 存储，减少依赖
const windowVideoIdsRef = useRef(windowVideoIds);
useEffect(() => {
  windowVideoIdsRef.current = windowVideoIds;
}, [windowVideoIds]);

const handleScroll = useCallback((event) => {
  const newVideoId = windowVideoIdsRef.current[newIndex];
}, [itemHeight]);
```

---

## 8. 对比分析

### 8.1 vs video-scroll 参考实现

| 维度 | video-scroll | VideoFullscreenPage |
|------|--------------|---------------------|
| **窗口管理** | useReducer + 动态加载/卸载 | 直接读取 player-pool 主池 |
| **窗口大小** | 13 个（可扩展到无限） | 13 个（固定） |
| **Player Pool** | 17 个独立管理 | 复用 player-pool 主池 13 个 |
| **预加载** | 位置触发 + 等待 ready | 无需预加载（主池已加载） |
| **PlayerMeta** | 组件内 useEffect 获取 | 从 pool API 同步获取 |
| **位置同步** | useLayoutEffect 维护 | 无需维护（无动态加载） |
| **扩展性** | 支持无限滚动 | 仅支持 13 个视频 |
| **复杂度** | 高（300+ 行） | 低（< 150 行） |

### 8.2 架构优势

#### ✅ 复用现有架构
- player-pool 主池 = 滑动窗口
- 无需额外窗口管理逻辑
- LRU 顺序 = 滑动顺序

#### ✅ 零预加载开销
- 主池视频已加载完成
- 滚动瞬间响应
- 无白屏等待

#### ✅ 双模式自然切换
- 竖屏：ScrollView 滑动
- 横屏：单视频显示
- 组件完全复用

#### ✅ 实现简洁
- 核心逻辑 < 150 行
- 无复杂状态机
- 易于维护

### 8.3 架构限制

#### ❌ 不支持无限滚动
- 仅支持 13 个视频
- 无法动态加载更多
- 适合 Fullscreen 模式，不适合 Feed

**原因**：
- 主池固定 13 个
- 设计目标是 Fullscreen 模式滑动窗口
- Feed List 无限滚动由其他页面实现

#### ⚠️ 依赖 player-pool 架构
- 必须先进入 Fullscreen 模式（调用 `enterFullscreenMode`）
- 主池必须包含窗口视频
- 如果主池异常，滑动失败

**缓解措施**：
- 进入前验证主池状态
- 错误处理和降级方案

---

## 9. 故障排查

### 9.1 滚动位置不正确

**可能原因**：
1. 初始滚动时机太早，ScrollView 未挂载
2. `clickedVideoId` 不在 `windowVideoIds` 中

**解决方案**：
```typescript
// 使用 requestAnimationFrame 确保 ScrollView 已挂载
requestAnimationFrame(() => {
  scrollViewRef.current?.scrollTo({ y: clickedIndex * itemHeight });
});

// 检查 clickedIndex !== -1
if (clickedIndex === -1) {
  console.warn('Clicked video not in window:', clickedVideoId);
}
```

### 9.2 播放/暂停不正常

**可能原因**：
1. `currentVideoId` 未同步到 video store
2. `isActiveVideo` 判断错误

**解决方案**：
```typescript
// 确保滚动时同步
const handleScroll = (event) => {
  const newVideoId = windowVideoIds[newIndex];

  const playerInstance = playerPoolManager.getPlayerInstance(newVideoId);
  if (playerInstance) {
    useVideoStore.getState().setCurrentPlayerMeta({
      videoId: newVideoId,
      playerInstance,
    });
  }
};
```

### 9.3 横竖屏切换丢失位置

**可能原因**：
1. 未监听 `isLandscape` 变化
2. 未使用 ref 存储 `currentVisibleIndex`

**解决方案**：
```typescript
const wasLandscape = useRef(isLandscape);
const currentVisibleIndexRef = useRef(currentVisibleIndex);

useEffect(() => {
  if (!isLandscape && wasLandscape.current) {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: currentVisibleIndexRef.current * itemHeight,
        animated: false,
      });
    });
  }
  wasLandscape.current = isLandscape;
}, [isLandscape]);
```

---

## 10. 未来扩展

### 10.1 支持双指手势缩放

```typescript
// 可选：添加 PinchGestureHandler
import { PinchGestureHandler } from 'react-native-gesture-handler';

<PinchGestureHandler onGestureEvent={handlePinch}>
  <ScrollView>{/* ... */}</ScrollView>
</PinchGestureHandler>
```

### 10.2 支持上下滑动退出

```typescript
// 可选：监听垂直滑动速度
const handleScrollEnd = (event) => {
  if (event.nativeEvent.velocity.y < -1000) {
    exitFullscreen();
  }
};
```

### 10.3 支持循环滚动

**注意**：当前架构不支持，因为主池固定 13 个。

**如需支持**：
- 扩展 player-pool 支持循环窗口
- 使用 `FlatList` 替代 `ScrollView`
- 实现虚拟滚动

---

## 11. 总结

### 核心设计亮点

1. **零额外窗口管理** - 复用 player-pool 主池
2. **零预加载逻辑** - 主池已加载完成
3. **同步 currentVideoId** - 保证 isActiveVideo 正确
4. **双模式布局隔离** - 竖屏滑动/横屏单视频
5. **实现简洁高效** - 核心逻辑 < 150 行

### 关键修正点

1. **滚动时同步 currentVideoId** - 调用 `setCurrentPlayerMeta()`
2. **初始滚动使用刚获取的数据** - 不依赖 state
3. **横屏切换恢复滚动位置** - 监听 `isLandscape` 变化
4. **使用 ref 避免闭包问题** - 减少 useCallback 依赖

### 架构优势

- ✅ 性能优异（无预加载等待）
- ✅ 代码简洁（复用现有架构）
- ✅ 易于维护（逻辑清晰）
- ✅ 扩展性好（支持手势等）

---

**文档版本**: v1.0.0
**最后更新**: 2025-10-08
**维护者**: Video Fullscreen Team
