/**
 * ScrollView 滑动窗口管理 Hook
 * 用于全屏竖屏模式的视频滑动功能
 */

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollView, InteractionManager, useWindowDimensions } from 'react-native';
import { playerPoolManager, usePlayerPoolStore, playerPoolSelectors, PoolMode } from '@/entities/player-pool';
import { useVideoStore } from '@/entities/video';
import { useFeedStore } from '@/entities/feed';
import { loadMoreFeed } from '@/features/feed-fetching';
import * as VideoWindowManagement from '@/features/video-window-management';
import { log, LogType } from '@/shared/lib/logger';
import { useMultiTimer } from '@/shared/hooks';

const LOG_TAG = 'fullscreen-scroll-window';

export interface FullscreenScrollWindowState {
  /** ScrollView ref */
  scrollViewRef: React.RefObject<ScrollView | null>;
  /** 窗口中的视频 ID 列表（最多 13 个） */
  windowVideoIds: string[];
  /** 播放器元数据 Map（O(1) 查找） */
  allPlayerMetas: Map<string, { videoId: string; playerInstance: any }>;
  /** 当前视频在窗口中的索引（-1 表示不在窗口中） */
  currentIndex: number;
  /** 滚动事件处理函数（更新 currentVideoId + 窗口扩展检测） */
  handleScroll: (event: any) => void;
  /** 滚动结束事件处理函数（预留给未来扩展） */
  handleMomentumScrollEnd: (event: any) => void;
  /** 视频项高度（屏幕高度） */
  itemHeight: number;
  /** 是否是初始挂载（用于优化初始渲染） */
  isInitialMount: boolean;
  /** 重置窗口扩展触发标志（窗口扩展完成后调用） */
  resetExtendTriggers: () => void;
}

/**
 * 全屏滑动窗口 Hook
 *
 * 功能：
 * 1. 从 player-pool 主池获取 13 个视频作为滑动窗口
 * 2. 管理当前可见视频的索引
 * 3. 同步 currentVideoId 到 video entity store
 * 4. 处理横竖屏切换时的滚动位置恢复
 */
export function useFullscreenScrollWindow(isLandscape: boolean): FullscreenScrollWindowState {
  // ✅ 不再从 route.params 读取，直接使用全局状态
  // currentPlayerMeta 在导航前已由 enterVideoDetail 或页面逻辑设置好
  const currentPlayerMeta = useVideoStore(state => state.currentPlayerMeta);
  const playbackContext = useVideoStore(state => state.playbackContext);

  const scrollViewRef = useRef<ScrollView>(null);

  // 🆕 使用响应式的屏幕尺寸（横竖屏切换时自动更新）
  const { height: screenHeight } = useWindowDimensions();
  const itemHeight = screenHeight;

  const isInitialized = useRef(false);

  // ✅ 直接订阅 Store 的主池队列（完全响应式）
  const mainQueue = usePlayerPoolStore(state => state.mainPoolQueue);

  // ✅ 派生窗口数据（videoIds 和 playerMetas Map）
  const { windowVideoIds, allPlayerMetas } = useMemo(
    () => {
      const videoIds = mainQueue.map(m => m.videoId);

      // 构造播放器元数据 Map（O(1) 查找）
      const metasMap = new Map();
      for (const meta of mainQueue) {
        metasMap.set(meta.videoId, {
          videoId: meta.videoId,
          playerInstance: meta.playerInstance,
        });
      }

      log(LOG_TAG, LogType.DEBUG, `Window has ${videoIds.length} videos`);
      return { windowVideoIds: videoIds, allPlayerMetas: metasMap };
    },
    [mainQueue]
  );

  // 🆕 v6.0: 从 video entity 订阅 currentVideoId（单一信息来源）
  const currentVideoId = useVideoStore(state => state.currentPlayerMeta?.videoId);

  const currentIndex = useMemo(() => {
    if (!currentVideoId) {
      return -1;
    }
    return windowVideoIds.indexOf(currentVideoId);
  }, [currentVideoId, windowVideoIds]);

  const [isInitialMount, setIsInitialMount] = useState(true);

  // 🔑 关键：使用 ref 缓存最新值，handleScroll 总是读取最新的 itemHeight 和 windowVideoIds
  const itemHeightRef = useRef(itemHeight);
  const windowVideoIdsRef = useRef(windowVideoIds);

  // 🔑 每次渲染都更新 ref（保证 useCallback 中总是读取最新值）
  // 注意：在渲染期间修改 ref 是安全的（不触发重新渲染）
  itemHeightRef.current = itemHeight;
  windowVideoIdsRef.current = windowVideoIds;

  // 🔑 用于 handleScroll 中避免重复更新同一个 videoId
  const lastProcessedVideoIdRef = useRef<string | null>(null);

  // 🆕 窗口扩展触发防抖
  const hasTriggeredExtendRef = useRef({ next: false, prev: false });
  const { addTimer } = useMultiTimer();
  const EXTEND_COOLDOWN = 500;

  // 🆕 Feed 预加载防抖
  const hasTriggeredLoadMoreRef = useRef(false);
  const FEED_PRELOAD_THRESHOLD = 3;

  // === 初始化：设置初始索引和滚动位置 ===
  useEffect(() => {
    // 防止重复初始化
    if (playbackContext !== 'pool') {
      return;
    }

    if (isInitialized.current) {
      return;
    }

    // ✅ 从全局状态获取当前视频ID
    const targetVideoId = currentPlayerMeta?.videoId;
    if (!targetVideoId) {
      log(LOG_TAG, LogType.WARNING, 'Cannot initialize: no current video');
      return;
    }

    log(LOG_TAG, LogType.INFO, `Initializing scroll position for video: ${targetVideoId}`);

    // 🔑 使用 ref 获取最新值，避免 itemHeight/windowVideoIds 变化时重复初始化
    const currentWindowVideoIds = windowVideoIdsRef.current;
    const currentItemHeight = itemHeightRef.current;

    const clickedIndex = currentWindowVideoIds.indexOf(targetVideoId);

    if (clickedIndex === -1) {
      log(LOG_TAG, LogType.WARNING, `Video ${targetVideoId} not in main pool, using first video`);
      isInitialized.current = true;
      return;
    }

    log(LOG_TAG, LogType.INFO, `Found target video at index ${clickedIndex}: ${targetVideoId}`);

    // 🔑 关键：立即标记为已初始化，防止依赖变化时重复执行
    isInitialized.current = true;
    lastProcessedVideoIdRef.current = targetVideoId;

    // 🔑 关键：等待导航动画完成后再滚动，避免视觉跳动
    const scrollY = clickedIndex * currentItemHeight;
    log(LOG_TAG, LogType.DEBUG, `Scheduling scroll to index ${clickedIndex}, y=${scrollY}`);

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      // 第一帧：执行滚动
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollY,
          animated: false,
        });
        log(LOG_TAG, LogType.INFO, `✅ Scrolled to index ${clickedIndex} after navigation animation`);

        // 第二帧：启用预渲染（避免与滚动竞争）
        requestAnimationFrame(() => {
          setIsInitialMount(false);
          log(LOG_TAG, LogType.INFO, `🚀 Auto-triggering preload after scroll`);
        });
      });
    });

    // 清理函数：组件卸载时取消待处理的滚动
    return () => {
      interactionHandle.cancel();
    };
  }, [currentPlayerMeta?.videoId, playbackContext]);  // ✅ 只依赖 videoId，避免不必要的重新执行

  // === 横竖屏切换：调整滚动位置 ===
  // 🔑 使用 useLayoutEffect 同步执行，避免视觉闪烁
  const prevItemHeightRef = useRef(itemHeight);

  useLayoutEffect(() => {
    const itemHeightChanged = itemHeight !== prevItemHeightRef.current;

    if (playbackContext !== 'pool') {
      prevItemHeightRef.current = itemHeight;
      return;
    }

    // 🔑 关键：只在 itemHeight 变化时调整滚动位置
    if (itemHeightChanged && windowVideoIds.length > 0 && currentIndex >= 0) {
      const newScrollY = currentIndex * itemHeight;

      log(LOG_TAG, LogType.INFO,
        `itemHeight changed (${prevItemHeightRef.current}→${itemHeight}), adjusting scroll to index ${currentIndex}, y=${newScrollY}`);

      // ✅ 立即同步调整滚动位置（不会触发 onMomentumScrollEnd）
      scrollViewRef.current?.scrollTo({
        y: newScrollY,
        animated: false,
      });
    }

    // ✅ 总是更新 ref，避免下次重复检测
    prevItemHeightRef.current = itemHeight;
  }, [itemHeight, currentIndex, windowVideoIds.length, playbackContext]);

  // === 滚动事件处理 ===
  const handleScroll = useCallback((event: any) => {
    // 🔑 横屏时完全禁用滚动事件处理
    if (isLandscape || playbackContext !== 'pool') {
      return;
    }

    const offsetY = event.nativeEvent.contentOffset.y;
    // 🔑 使用 ref 获取最新的 itemHeight（处理横竖屏切换过渡期）
    const currentItemHeight = itemHeightRef.current;
    const newIndex = Math.round(offsetY / currentItemHeight);

    // 🔒 模式检查：只在 Fullscreen 模式下处理滚动事件
    const poolState = usePlayerPoolStore.getState();
    if (poolState.currentMode !== PoolMode.FULLSCREEN) {
      return;
    }

    // 使用 ref 获取最新的 windowVideoIds
    const currentWindowVideoIds = windowVideoIdsRef.current;

    // 边界检查
    if (newIndex < 0 || newIndex >= currentWindowVideoIds.length) {
      return;
    }

    const newVideoId = currentWindowVideoIds[newIndex];

    // 🔑 关键：更新 currentVideoId（使用 videoId 判断是否变化，避免重复更新）
    if (newVideoId !== lastProcessedVideoIdRef.current) {
      log(LOG_TAG, LogType.DEBUG, `Scroll to index ${newIndex}, video: ${newVideoId}`);
      lastProcessedVideoIdRef.current = newVideoId;

      // 立即同步 currentVideoId 到 video entity
      const playerInstance = playerPoolSelectors.getPlayer(poolState, newVideoId);
      if (playerInstance) {
        useVideoStore.getState().setCurrentPlayerMeta({
          videoId: newVideoId,
          playerInstance,
        }, 'pool');
        log(LOG_TAG, LogType.INFO, `Updated current player meta: ${newVideoId}`);
      } else {
        log(LOG_TAG, LogType.ERROR, `Player instance not found for: ${newVideoId}`);
      }
    }

    // === 窗口扩展触发检测 ===

    // 如果正在扩展中，跳过检测
    if (poolState.isExtendingWindow) {
      return;
    }

    const feedVideoIds = useFeedStore.getState().videoIds;

    // Feed 预加载检测
    const currentFeedIndex = feedVideoIds.indexOf(newVideoId);
    const distanceFromBottom = currentFeedIndex >= 0
      ? feedVideoIds.length - currentFeedIndex - 1
      : -1;

    // 离开底部区域时重置标志
    if (distanceFromBottom > 5) {
      hasTriggeredLoadMoreRef.current = false;
    }

    // 接近底部时触发加载
    if (distanceFromBottom <= FEED_PRELOAD_THRESHOLD &&
        !useFeedStore.getState().loading.isLoading &&
        !hasTriggeredLoadMoreRef.current) {
      log(LOG_TAG, LogType.INFO,
        `📥 Near feed bottom (distance: ${distanceFromBottom}), triggering loadMoreFeed`);
      hasTriggeredLoadMoreRef.current = true;
      loadMoreFeed().catch((error) => {
        log(LOG_TAG, LogType.ERROR, `Failed to load more feed: ${error.message}`);
      });
    }

    // 向后扩展：位置 11-12 触发
    if (newIndex >= 11 && !hasTriggeredExtendRef.current.next) {
      const windowStartVideoId = poolState.windowStartVideoId;
      if (windowStartVideoId) {
        const windowStartIndex = feedVideoIds.indexOf(windowStartVideoId);
        const canExtendNext = windowStartIndex >= 0 &&
          windowStartIndex + currentWindowVideoIds.length < feedVideoIds.length;

        if (canExtendNext) {
          log(LOG_TAG, LogType.INFO,
            `🔽 Near bottom (${newIndex}), triggering extendWindowNext`);
          hasTriggeredExtendRef.current.next = true;
          VideoWindowManagement.extendWindowNext();
        }
      }
    }

    // 向前扩展：位置 0-1 触发
    if (newIndex <= 1 && !hasTriggeredExtendRef.current.prev) {
      const windowStartVideoId = poolState.windowStartVideoId;
      if (windowStartVideoId) {
        const windowStartIndex = feedVideoIds.indexOf(windowStartVideoId);
        if (windowStartIndex > 0) {
          log(LOG_TAG, LogType.INFO,
            `🔼 Near top (${newIndex}), triggering extendWindowPrev`);
          hasTriggeredExtendRef.current.prev = true;
          VideoWindowManagement.extendWindowPrev();
        }
      }
    }
  }, [isLandscape, playbackContext]);  // ✅ 最小依赖

  // 🆕 滚动结束事件处理（用于未来扩展，当前主要逻辑在 handleScroll 中）
  const handleMomentumScrollEnd = useCallback((_event: any) => {
    // 预留给未来可能需要的滚动结束后的处理逻辑
    // 当前 currentVideoId 的更新已在 handleScroll 中处理
    if (isLandscape || playbackContext !== 'pool') {
      return;
    }

    log(LOG_TAG, LogType.DEBUG, 'Momentum scroll ended');
  }, [isLandscape, playbackContext]);

  // 🆕 扩展成功后启动 500ms 冷却期（防止连续扩展）
  const resetExtendTriggers = useCallback(() => {
    log(LOG_TAG, LogType.DEBUG, 'Window extended successfully, starting 500ms cooldown');

    addTimer(() => {
      hasTriggeredExtendRef.current.next = false;
      hasTriggeredExtendRef.current.prev = false;
      log(LOG_TAG, LogType.DEBUG, 'Cooldown expired, ready for next extend');
    }, EXTEND_COOLDOWN);
  }, [addTimer]);

  return {
    scrollViewRef,
    windowVideoIds,
    allPlayerMetas,
    currentIndex,
    handleScroll,
    handleMomentumScrollEnd,
    itemHeight,
    isInitialMount,
    resetExtendTriggers,
  };
}
