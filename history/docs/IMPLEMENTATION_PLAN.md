# TikTok 式全屏滑动视频实现方案

## 📋 目录
1. [架构设计](#架构设计)
2. [核心技术点](#核心技术点)
3. [实现步骤](#实现步骤)
4. [代码实现](#代码实现)
5. [性能优化](#性能优化)
6. [用户体验](#用户体验)

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        FeedPage                              │
│                     (卡片列表模式)                            │
│  ┌──────┐  ┌──────┐  ┌──────┐                               │
│  │Video1│  │Video2│  │Video3│                               │
│  └──────┘  └──────┘  └──────┘                               │
│      │                                                       │
│      │ 点击进入                                               │
│      ▼                                                       │
│  ┌─────────────────────────────────────┐                    │
│  │     选择进入模式（用户偏好）          │                    │
│  ├─────────────────────────────────────┤                    │
│  │  1. 详情模式 → VideoPlayerPage      │                    │
│  │  2. 滑动模式 → FullscreenFeedPage   │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              FullscreenFeedPage (新增)                       │
│              全屏滑动模式 (TikTok 风格)                       │
│  ┌───────────────────────────────────────────────────┐      │
│  │                    FlatList                        │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │         Video 1 (全屏播放中)                │  │      │
│  │  │                                             │  │      │
│  │  │          [播放控制层覆盖]                    │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  │                      ▲▼ 滑动切换                   │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │         Video 2 (预加载暂停)                │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  │                      ▲▼                           │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │         Video 3 (预加载暂停)                │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  └───────────────────────────────────────────────────┘      │
│                                                              │
│  特性：                                                       │
│  • 垂直分页滚动 (pagingEnabled)                              │
│  • 一次显示一个视频                                           │
│  • 当前视频自动播放，其他暂停                                  │
│  • 预加载前后视频                                             │
│  • 滑动窗口管理 (500 条)                                      │
│  • 接近底部自动加载更多                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心技术点

### 1. FlatList 分页配置

```typescript
{
  // ⭐ 核心配置：启用分页效果
  pagingEnabled: true,                    // iOS/Android 原生分页
  snapToInterval: screenHeight,           // 每页高度 = 屏幕高度
  snapToAlignment: 'start',               // 对齐到顶部
  decelerationRate: 'fast',               // 快速减速，更流畅

  // 性能优化
  removeClippedSubviews: true,            // 移除屏幕外视图
  maxToRenderPerBatch: 3,                 // 每批最多渲染 3 个（当前+前1+后1）
  windowSize: 5,                          // 虚拟窗口：当前+前2+后2
  initialNumToRender: 3,                  // 首次渲染 3 个

  // 固定高度优化（关键！）
  getItemLayout: (data, index) => ({
    length: screenHeight,                 // 每个 item 高度固定
    offset: screenHeight * index,         // 偏移量 = 高度 * 索引
    index,
  }),

  // 滚动锚点：删除头部数据时保持位置
  maintainVisibleContentPosition: {
    minIndexForVisible: 0,
  },

  // 事件回调
  onViewableItemsChanged: handleViewableItemsChanged,
  onMomentumScrollEnd: handleScrollEnd,
  onEndReached: handleLoadMore,
  onEndReachedThreshold: 0.5,             // 距离底部 50% 触发加载
}
```

### 2. 可见项检测配置

```typescript
viewabilityConfig = {
  // ⭐ 关键：确保一次只有一个视频被认为"可见"
  itemVisiblePercentThreshold: 80,        // 80% 可见才算可见
  minimumViewTime: 300,                   // 最小可见时间 300ms
  waitForInteraction: false,              // 不等待交互
}
```

### 3. 播放状态管理

```typescript
// 每个视频 item 根据 isActive 控制播放
const FullscreenFeedItem = ({ video, isActive, index }) => {
  const player = usePlayerFromPool(video);

  useEffect(() => {
    if (isActive) {
      player?.play();    // 当前视频：播放
    } else {
      player?.pause();   // 其他视频：暂停
    }
  }, [isActive, player]);

  return (
    <View style={{ height: screenHeight }}>
      <FullscreenVideoPlayer
        playerInstance={player}
        videoMeta={video.meta}
      />
    </View>
  );
};
```

### 4. 预加载策略

```typescript
// 当前视频切换时，预加载前后视频
useEffect(() => {
  if (!isActive) return;

  const videosToPreload = [
    feed[currentIndex + 1],  // 下一个
    feed[currentIndex - 1],  // 上一个
  ].filter(Boolean);

  // 使用 InteractionManager 延迟到空闲时执行
  InteractionManager.runAfterInteractions(() => {
    preloadVideos(videosToPreload);
  });
}, [isActive, currentIndex]);
```

### 5. 与 Feed Store 集成

```typescript
// 同步 currentFeedIndex
const handleViewableItemsChanged = useCallback(
  ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;

      // 同步到 feed store
      setCurrentFeedIndex(newIndex);

      // 更新本地状态
      setActiveIndex(newIndex);
    }
  },
  [setCurrentFeedIndex]
);

// 滚动停止时触发预加载
const handleScrollEnd = useCallback(() => {
  // 预加载逻辑（参考上面的预加载策略）
}, []);

// 接近底部时加载更多
const handleLoadMore = useCallback(() => {
  if (canLoadMore) {
    loadMoreFeed();
  }
}, [canLoadMore]);
```

---

## 实现步骤

### 阶段 1：基础结构搭建

**1.1 创建 Feature: fullscreen-feed-list**

```
src/features/fullscreen-feed-list/
├── index.ts
├── ui/
│   └── FullscreenFeedList.tsx       # FlatList 组件
├── lib/
│   └── constants.ts                 # 配置常量
└── model/
    └── types.ts                     # 类型定义
```

**1.2 创建 Widget: fullscreen-feed-item**

```
src/widgets/fullscreen-feed-item/
├── index.ts
└── ui/
    └── FullscreenFeedItem.tsx       # 单个视频 item
```

**1.3 创建 Page: fullscreen-feed**

```
src/pages/fullscreen-feed/
├── index.ts
├── ui/
│   └── FullscreenFeedPage.tsx       # 页面容器
└── model/
    └── types.ts
```

---

### 阶段 2：核心功能实现

**2.1 FullscreenFeedList.tsx (Feature 层)**

```typescript
// src/features/fullscreen-feed-list/ui/FullscreenFeedList.tsx

import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, Dimensions, StyleSheet, ViewToken } from 'react-native';
import { useFeedStore, feedSelectors } from '@/entities/feed';
import type { VideoMetadata } from '@/shared/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullscreenFeedListProps {
  /** 初始滚动索引 */
  initialIndex?: number;
  /** 视频 item 渲染函数 */
  renderItem: (props: {
    item: VideoMetadata;
    index: number;
    isActive: boolean;
  }) => React.ReactElement;
  /** 可见项变化回调 */
  onViewableItemsChanged?: (index: number) => void;
  /** 滚动停止回调 */
  onScrollEnd?: (index: number) => void;
  /** 加载更多回调 */
  onEndReached?: () => void;
}

export function FullscreenFeedList({
  initialIndex = 0,
  renderItem,
  onViewableItemsChanged,
  onScrollEnd,
  onEndReached,
}: FullscreenFeedListProps) {
  const flatListRef = useRef<FlatList<VideoMetadata>>(null);
  const feed = useFeedStore(feedSelectors.getFeedList);
  const { isLoading } = useFeedStore(feedSelectors.getLoadingState);
  const currentIndexRef = useRef(initialIndex);

  // ⭐ 可见项变化处理
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index ?? 0;
        currentIndexRef.current = newIndex;
        onViewableItemsChanged?.(newIndex);
      }
    },
    [onViewableItemsChanged]
  );

  // ⭐ 滚动停止处理
  const handleMomentumScrollEnd = useCallback(() => {
    const currentIndex = currentIndexRef.current;
    onScrollEnd?.(currentIndex);
  }, [onScrollEnd]);

  // ⭐ 可见项配置
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 80, // 80% 可见
      minimumViewTime: 300,            // 300ms
      waitForInteraction: false,
    }),
    []
  );

  // ⭐ Item Layout 优化
  const getItemLayout = useCallback(
    (_data: ArrayLike<VideoMetadata> | null | undefined, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  // ⭐ Key 提取器
  const keyExtractor = useCallback(
    (item: VideoMetadata) => item.meta.id,
    []
  );

  // ⭐ 渲染 Item
  const renderItemWrapper = useCallback(
    ({ item, index }: { item: VideoMetadata; index: number }) => {
      const isActive = index === currentIndexRef.current;
      return renderItem({ item, index, isActive });
    },
    [renderItem]
  );

  return (
    <FlatList
      ref={flatListRef}
      data={feed}
      renderItem={renderItemWrapper}
      keyExtractor={keyExtractor}

      // ⭐ 分页配置
      pagingEnabled
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}

      // ⭐ 性能优化
      removeClippedSubviews
      maxToRenderPerBatch={3}
      windowSize={5}
      initialNumToRender={3}
      getItemLayout={getItemLayout}

      // ⭐ 初始位置
      initialScrollIndex={initialIndex}

      // ⭐ 滚动锚点（滑动窗口删除头部数据时保持位置）
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}

      // ⭐ 事件回调
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}

      // ⭐ 样式
      style={styles.list}
      contentContainerStyle={styles.contentContainer}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    // 不设置 padding，让每个 item 占满屏幕
  },
});
```

**2.2 FullscreenFeedItem.tsx (Widget 层)**

```typescript
// src/widgets/fullscreen-feed-item/ui/FullscreenFeedItem.tsx

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FullscreenVideoPlayer, VideoDisplayMode } from '@/features/video-player';
import { VideoControlsOverlay } from '@/features/video-control-overlay';
import { IntegratedSubtitleView, useSubtitleDisplay } from '@/features/subtitle-display';
import { useVideoStore, selectPlayerInstance } from '@/entities/video';
import { playerPoolManager } from '@/entities/player-pool';
import { log, LogType } from '@/shared/lib/logger';
import type { VideoMetadata } from '@/shared/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullscreenFeedItemProps {
  video: VideoMetadata;
  isActive: boolean;
  index: number;
}

export function FullscreenFeedItem({
  video,
  isActive,
  index,
}: FullscreenFeedItemProps) {
  // 🎯 从 Player Pool 获取播放器实例
  const [player, setPlayer] = React.useState<any>(null);

  // 初始化播放器
  useEffect(() => {
    let mounted = true;

    async function initPlayer() {
      try {
        const playerInstance = await playerPoolManager.acquire({
          meta: video.meta,
        });

        if (mounted) {
          setPlayer(playerInstance);
          log('fullscreen-feed-item', LogType.DEBUG,
            `Player acquired for video ${video.meta.id} at index ${index}`);
        }
      } catch (error) {
        log('fullscreen-feed-item', LogType.ERROR,
          `Failed to acquire player: ${error}`);
      }
    }

    initPlayer();

    return () => {
      mounted = false;
    };
  }, [video.meta.id]);

  // ⭐ 根据 isActive 控制播放/暂停
  useEffect(() => {
    if (!player) return;

    if (isActive) {
      player.play();
      log('fullscreen-feed-item', LogType.INFO,
        `Playing video ${video.meta.id} at index ${index}`);
    } else {
      player.pause();
      log('fullscreen-feed-item', LogType.DEBUG,
        `Paused video ${video.meta.id} at index ${index}`);
    }
  }, [isActive, player, video.meta.id, index]);

  // 字幕导航
  const subtitleNavigation = useSubtitleDisplay();

  if (!player) {
    return (
      <View style={styles.container}>
        {/* 加载占位 */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FullscreenVideoPlayer
        displayMode={VideoDisplayMode.FULLSCREEN_PORTRAIT}
        videoMeta={video.meta}
        playerInstance={player}
        onExitFullscreen={() => {
          // 退出全屏逻辑（返回到 FeedPage）
        }}
      >
        {/* 控制层覆盖 */}
        <VideoControlsOverlay
          displayMode={VideoDisplayMode.FULLSCREEN_PORTRAIT}
          playbackMode="fullscreen-portrait"
          onToggleFullscreen={() => {
            // 退出全屏
          }}
          subtitleNavigation={{
            goToPrevious: subtitleNavigation.actions.goToPrevious,
            goToNext: subtitleNavigation.actions.goToNext,
          }}
        />

        {/* 字幕显示 */}
        <IntegratedSubtitleView
          config={{
            enabled: true,
            position: 'bottom',
            fontSize: 18,
            fontColor: '#FFFFFF',
            backgroundColor: 'transparent',
            backgroundOpacity: 0,
            showNavigationControls: true,
            autoScroll: true,
            enableClickToSeek: true,
          }}
        />
      </FullscreenVideoPlayer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT,
    width: '100%',
    backgroundColor: '#000000',
  },
});
```

**2.3 FullscreenFeedPage.tsx (Page 层)**

```typescript
// src/pages/fullscreen-feed/ui/FullscreenFeedPage.tsx

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { InteractionManager, BackHandler } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FullscreenFeedList } from '@/features/fullscreen-feed-list';
import { FullscreenFeedItem } from '@/widgets/fullscreen-feed-item';
import { useFeedActions, useFeedStore } from '@/entities/feed';
import { useVideoDataLogic } from '@/entities/video';
import { loadMoreFeed } from '@/features/feed-fetching';
import { log, LogType } from '@/shared/lib/logger';
import { toast } from '@/shared/lib/toast';
import type { VideoMetadata } from '@/shared/types';

export function FullscreenFeedPage() {
  const params = useLocalSearchParams();
  const initialIndex = parseInt(params.initialIndex as string) || 0;

  const { setCurrentFeedIndex } = useFeedActions();
  const { preloadVideos } = useVideoDataLogic();
  const feed = useFeedStore((state) => state.feed);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const preloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ⭐ 初始化：设置当前索引
  useEffect(() => {
    setCurrentFeedIndex(initialIndex);
    log('fullscreen-feed-page', LogType.INFO,
      `Initialized at index ${initialIndex}`);
  }, [initialIndex, setCurrentFeedIndex]);

  // ⭐ 可见项变化：更新当前索引
  const handleViewableItemsChanged = useCallback(
    (newIndex: number) => {
      setCurrentIndex(newIndex);
      setCurrentFeedIndex(newIndex);
      log('fullscreen-feed-page', LogType.DEBUG,
        `Current video changed to index ${newIndex}`);
    },
    [setCurrentFeedIndex]
  );

  // ⭐ 滚动停止：预加载前后视频
  const handleScrollEnd = useCallback(
    (index: number) => {
      // 清除之前的预加载定时器
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
        preloadTimeoutRef.current = null;
      }

      // 延迟 300ms 执行预加载
      preloadTimeoutRef.current = setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          const currentVideo = feed[index];
          const prevVideo = index > 0 ? feed[index - 1] : null;
          const nextVideo = index < feed.length - 1 ? feed[index + 1] : null;

          const videosToPreload = [
            currentVideo,
            nextVideo,
            prevVideo,
          ].filter((v): v is VideoMetadata => Boolean(v));

          if (videosToPreload.length > 0) {
            log('fullscreen-feed-page', LogType.DEBUG,
              `Preloading ${videosToPreload.length} videos around index ${index}`);

            preloadVideos(videosToPreload).catch((error) => {
              log('fullscreen-feed-page', LogType.DEBUG,
                `Preload failed: ${error}`);
            });
          }
        });
      }, 300);
    },
    [feed, preloadVideos]
  );

  // ⭐ 加载更多
  const handleLoadMore = useCallback(() => {
    log('fullscreen-feed-page', LogType.INFO, 'Loading more videos...');

    loadMoreFeed().catch((error) => {
      log('fullscreen-feed-page', LogType.ERROR,
        `Failed to load more: ${error}`);
      toast.show({
        type: 'error',
        title: '加载失败',
        message: '请稍后重试',
      });
    });
  }, []);

  // ⭐ 渲染 Item
  const renderItem = useCallback(
    ({
      item,
      index,
      isActive,
    }: {
      item: VideoMetadata;
      index: number;
      isActive: boolean;
    }) => {
      return (
        <FullscreenFeedItem
          video={item}
          isActive={isActive}
          index={index}
        />
      );
    },
    []
  );

  // ⭐ 返回键处理：返回到 FeedPage
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        router.back();
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  return (
    <FullscreenFeedList
      initialIndex={initialIndex}
      renderItem={renderItem}
      onViewableItemsChanged={handleViewableItemsChanged}
      onScrollEnd={handleScrollEnd}
      onEndReached={handleLoadMore}
    />
  );
}
```

---

### 阶段 3：路由集成

**3.1 添加路由配置**

```typescript
// app/(tabs)/fullscreen-feed.tsx

import { FullscreenFeedPage } from '@/pages/fullscreen-feed';

export default FullscreenFeedPage;
```

**3.2 从 FeedPage 进入**

```typescript
// src/pages/feed/ui/FeedPage.tsx

// 修改 handleVideoPress
const handleVideoPress = useCallback(async (video: VideoMetadata) => {
  if (!isPageFocused) return;

  try {
    const currentIndex = feed.findIndex(v => v.meta.id === video.meta.id);

    // 🆕 方式1：进入全屏滑动模式（推荐）
    router.push({
      pathname: '/fullscreen-feed',
      params: { initialIndex: currentIndex }
    });

    // 或者保留原有方式：进入单视频详情页
    // await enterVideoDetail(video.meta);

  } catch (error) {
    log('feed-page', LogType.ERROR, `Failed to enter video: ${error}`);
  }
}, [feed, isPageFocused]);
```

---

## 性能优化

### 1. FlatList 优化清单

```typescript
✅ pagingEnabled          // 原生分页，性能最优
✅ getItemLayout          // 固定高度，跳过测量
✅ removeClippedSubviews  // 移除屏幕外视图
✅ maxToRenderPerBatch: 3 // 限制批量渲染
✅ windowSize: 5          // 虚拟窗口大小
✅ initialNumToRender: 3  // 首屏最小渲染
✅ keyExtractor           // 稳定的 key
```

### 2. Player Pool 配合

```typescript
// 播放器池容量：3 个实例
// 预加载范围：当前 + 前1 + 后1 = 3 个
// 完美匹配，充分利用池资源
```

### 3. 滑动窗口集成

```typescript
// feed store 维护 500 条窗口
// FlatList 自动虚拟化
// maintainVisibleContentPosition 保持位置
// 无感知删除旧数据
```

### 4. 预加载防抖

```typescript
// 300ms 延迟 + InteractionManager
// 避免快速滑动时频繁预加载
// 等待动画完成后再执行
```

---

## 用户体验优化

### 1. 滚动体验

```typescript
✅ decelerationRate: 'fast'  // 快速减速，更流畅
✅ snapToInterval             // 精确对齐到每页
✅ pagingEnabled              // 原生分页手势
```

### 2. 手势控制

```typescript
// 上滑 → 下一个视频
// 下滑 → 上一个视频
// 点击/左滑 → 退出全屏（返回 FeedPage）
```

### 3. 状态保持

```typescript
// 进入：从 feed 的 currentFeedIndex 开始
// 退出：同步 currentFeedIndex 回 feed store
// 返回 FeedPage 时滚动到对应位置
```

### 4. 加载指示

```typescript
// 顶部：无加载指示（无限向上）
// 底部：自动加载更多，无明显指示器
// 模仿 TikTok 的无缝体验
```

---

## 与现有架构的集成

### 数据流

```typescript
1️⃣ Feed Store (Entity)
   ├─ feed: VideoMetadata[]        // 500 条滑动窗口
   ├─ currentFeedIndex: number     // 当前播放索引
   └─ 提供：appendToFeed, loadMore

2️⃣ Player Pool (Entity)
   ├─ 3 个播放器实例
   ├─ LRU 缓存策略
   └─ 提供：acquire, preloadOne

3️⃣ FullscreenFeedPage (Page)
   ├─ 从 feed store 读取数据
   ├─ 同步 currentFeedIndex
   └─ 调用 loadMoreFeed

4️⃣ FullscreenFeedList (Feature)
   ├─ FlatList 渲染
   ├─ 可见项检测
   └─ 事件回调

5️⃣ FullscreenFeedItem (Widget)
   ├─ 从 player pool 获取播放器
   ├─ 根据 isActive 控制播放
   └─ 渲染视频和控制层
```

### 优势总结

```
✅ 复用现有架构：feed store, player pool, 预加载机制
✅ 向后兼容：保留单视频详情页
✅ 性能优秀：FlatList 虚拟化 + 滑动窗口
✅ 体验流畅：分页滚动 + 自动播放/暂停
✅ 扩展性强：易于添加新功能（评论、点赞等）
```

---

## 后续增强功能

### 1. 双击点赞

```typescript
// 在 FullscreenFeedItem 中添加 TapGestureHandler
import { TapGestureHandler } from 'react-native-gesture-handler';

<TapGestureHandler
  numberOfTaps={2}
  onActivated={handleDoubleTap}
>
  {/* 视频内容 */}
</TapGestureHandler>
```

### 2. 侧边栏交互

```typescript
// 右侧悬浮按钮栏
<View style={styles.sideBar}>
  <LikeButton />
  <CommentButton />
  <ShareButton />
  <AuthorAvatar />
</View>
```

### 3. 进度指示器

```typescript
// 顶部视频进度条
<View style={styles.progressBar}>
  {feed.map((_, index) => (
    <View
      key={index}
      style={[
        styles.progressSegment,
        index === currentIndex && styles.activeSegment,
      ]}
    />
  ))}
</View>
```

### 4. 字幕交互

```typescript
// 点击字幕跳转
<IntegratedSubtitleView
  config={{
    enableClickToSeek: true,  // 已实现
    showNavigationControls: true,
  }}
/>
```

---

## 总结

这套方案：

1. **架构清晰**：遵循 FSD 分层，职责明确
2. **性能优秀**：FlatList 优化 + Player Pool + 滑动窗口
3. **体验流畅**：原生分页 + 自动播放控制
4. **易于维护**：复用现有组件和逻辑
5. **可扩展性**：易于添加新功能

完全满足 TikTok 式全屏滑动视频的需求！🎉
