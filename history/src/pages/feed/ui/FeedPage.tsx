import React, { useCallback, useState, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FeedList, FeedListRef, FEED_CONSTANTS } from '@/features/feed-list';
import { initializeFeed, loadMoreFeed, refreshFeed } from '@/features/feed-fetching';
import { useFeedActions, useFeedStore, feedSelectors } from '@/entities/feed';
import { useVideoStore } from '@/entities/video';
import { playerPoolManager } from '@/entities/player-pool';
import * as VideoWindowManagement from '@/features/video-window-management';
import { useVideoNavigation } from '@/features/video-window-management';
import { log, LogType } from '@/shared/lib/logger';
import { toast } from '@/shared/lib/toast';
import { useForceStatusBarStyle } from '@/shared/hooks/useForceStatusBarStyle';
import { useSingleTimer, useDebounce, useAfterInteractions, useFocusState } from '@/shared/hooks';
import type { VideoMetaData } from '@/shared/types';

export function FeedPage() {
  const { enterVideoDetail, preloadVideos, exitToFeed } = useVideoNavigation();
  const { setCurrentFeedIndex, updateVisibleIndexes } = useFeedActions();
  const videoIds = useFeedStore(state => state.videoIds);
  const isPageFocused = useFocusState(); // 使用 shared hook 跟踪焦点状态
  const [isFeedInitialized, setIsFeedInitialized] = useState(false);
  const currentVisibleIndexes = useRef<number[]>([]);
  const feedListRef = useRef<FeedListRef>(null);

  // 使用通用 timer hook
  const { setTimer } = useSingleTimer();

  // 状态栏跟随 App 主题
  useForceStatusBarStyle('auto');

  // 🆕 滚动到当前视频的辅助函数
  const scrollToCurrentVideo = useCallback((videoId: string) => {
    const currentVideoIds = useFeedStore.getState().videoIds;
    const targetIndex = currentVideoIds.indexOf(videoId);

    if (targetIndex === -1) {
      log('feed-page', LogType.WARNING,
        `Video ${videoId} not found in feed list, cannot scroll`);
      return;
    }

    // 🆕 检查视频是否已在可见区域
    const visibleIndexes = useFeedStore.getState().playback.visibleIndexes;
    const isVisible = visibleIndexes.includes(targetIndex);

    if (isVisible) {
      log('feed-page', LogType.DEBUG,
        `Video at index ${targetIndex} already visible, skip scroll`);

      // 只更新当前索引，不滚动
      setCurrentFeedIndex(targetIndex);
      return;
    }

    // 不可见，执行滚动
    log('feed-page', LogType.INFO,
      `Scrolling to video at index ${targetIndex}: ${videoId}`);

    // 🔑 关键：等待导航动画和 FlatList 渲染完成
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        try {
          feedListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: true,
            viewPosition: 0.5,  // 滚动到屏幕中间
          });

          log('feed-page', LogType.INFO,
            `Successfully scrolled to index ${targetIndex}`);

          // 🔑 关键：立即更新 Feed 索引，保持状态同步
          setCurrentFeedIndex(targetIndex);

        } catch (error) {
          log('feed-page', LogType.ERROR,
            `Failed to scroll to index ${targetIndex}: ${error}`);

          // 降级方案：使用 scrollToOffset
          // 🔑 使用 FEED_CONSTANTS.itemHeight 确保高度计算准确
          const offset = targetIndex * FEED_CONSTANTS.itemHeight;

          feedListRef.current?.scrollToOffset({
            offset,
            animated: true
          });

          log('feed-page', LogType.INFO,
            `Fallback: scrolled to offset ${offset} (itemHeight: ${FEED_CONSTANTS.itemHeight})`);

          setCurrentFeedIndex(targetIndex);
        }
      });
    });
  }, [setCurrentFeedIndex]);

  // 页面焦点控制 - 处理视频清理逻辑
  useFocusEffect(
    useCallback(() => {
      // 🧹 当 Feed 页面获得焦点时，清理可能残留的视频播放状态
      // 这处理了用户从视频页面返回的情况
      const currentMeta = useVideoStore.getState().currentPlayerMeta;
      const currentVideoId = currentMeta?.videoId;

      if (currentMeta) {
        log('feed-page', LogType.INFO, 'Cleaning up video playback from previous session');
        // 使用 exitToFeed 而不是 clearCurrentVideo，它会暂停播放器
        try {
          playerPoolManager.exitFullscreenMode();
        } catch (error) {
          log('feed-page', LogType.WARNING, `Failed to exit fullscreen mode during cleanup: ${error}`);
        }
        try {
          exitToFeed();
        } catch (error) {
          log('feed-page', LogType.WARNING, `Failed to cleanup video: ${error}`);
        }

        // 🆕 清理后，滚动到当前视频位置
        if (currentVideoId) {
          scrollToCurrentVideo(currentVideoId);
        }
      }

      return () => {
        // timer 会自动清理
      };
    }, [exitToFeed, scrollToCurrentVideo])
  );

  // 初始化 Feed 数据 - 按架构文档要求
  useEffect(() => {
    log('feed-page', LogType.INFO, 'Initializing feed data...');

    const initialize = async () => {
      try {
        // 🔑 关键：初始化 Feed 数据（加载 15 个视频）
        await initializeFeed();

        // 🔑 关键：标记初始化完成，启用 onEndReached
        setIsFeedInitialized(true);
        log('feed-page', LogType.INFO, 'Feed initialization completed, onEndReached enabled');

        // 初始化成功后，预加载前三个视频
        InteractionManager.runAfterInteractions(() => {
          const currentVideoIds = useFeedStore.getState().videoIds;

          if (currentVideoIds.length > 0) {
            // 预加载前三个视频：index 0, 1, 2
            const videoIdsToPreload = currentVideoIds.slice(0, 3);

            log('feed-page', LogType.DEBUG,
              `Preloading first ${videoIdsToPreload.length} videos after initialization: indexes [0, 1, 2]`);

            preloadVideos(videoIdsToPreload).catch((error) => {
              log('feed-page', LogType.DEBUG, `Preload after init failed (non-critical): ${error}`);
            });
          }
        });

      } catch (error) {
        log('feed-page', LogType.ERROR, `Failed to initialize feed: ${error}`);
        toast.show({
          type: 'error',
          title: 'Feed 加载失败',
          message: '请检查网络连接后重试',
          duration: 3000
        });
      }
    };

    initialize();
  }, [preloadVideos]);

  // 处理视频点击
  const handleVideoPress = useCallback(async (video: VideoMetaData) => {
    if (!isPageFocused) return;

    try {
      log('feed-page', LogType.INFO, `Entering video detail: ${video.id} - ${video.title}`);

      const feedIndex = videoIds.indexOf(video.id);
      if (feedIndex !== -1) {
        try {
          // 🆕 v7.0: 使用 Feature 层（依赖注入）
          VideoWindowManagement.enterFullscreenMode(video.id);
        } catch (error) {
          log('feed-page', LogType.ERROR, `Failed to enter fullscreen mode for video ${video.id}: ${error}`);
          throw error;
        }
      } else {
        log('feed-page', LogType.WARNING, `Video ${video.id} not found in feed list, skip fullscreen mode switch`);
      }

      // 确保播放器实例创建完成后才进行页面跳转
      await enterVideoDetail(video.id);

      // ✅ 字幕加载现在由全局 useSubtitleAutoLoader 自动处理
      // 无需手动调用，完全解耦

      log('feed-page', LogType.INFO, `Successfully entered video detail for: ${video.id}`);

    } catch (error) {
      log('feed-page', LogType.ERROR, `Failed to enter video detail: ${error}`);
      toast.show({
        type: 'error',
        title: '视频加载失败',
        message: '请检查网络连接后重试',
        duration: 3000
      });
    }
  }, [enterVideoDetail, isPageFocused, videoIds]);

  // 处理可见项目变化 - 优化版：只跟踪可见项，不立即切换播放
  const handleViewableItemsChanged = useCallback((indexes: number[]) => {
    log('feed-page', LogType.DEBUG, `Viewable items changed: ${indexes}`);

    // 更新可见索引列表
    updateVisibleIndexes(indexes);

    // 保存当前可见索引，但不立即切换播放
    currentVisibleIndexes.current = indexes;
  }, [updateVisibleIndexes]);

  // 处理滑动停止 - 在滚动惯性结束后延迟触发
  const handleScrollEnd = useCallback(() => {
    const indexes = currentVisibleIndexes.current;
    if (indexes.length === 0) return;

    const currentIndex = indexes[0];

    // ✅ 立即更新当前索引（不延迟，保证响应性）
    setCurrentFeedIndex(currentIndex);
    log('feed-page', LogType.INFO, `Scroll ended, set current feed index: ${currentIndex}`);

    // ✅ 延迟 500ms 执行预加载（自动清除之前的定时器）
    setTimer(() => {
      // ✅ InteractionManager：延迟到交互完成后执行
      InteractionManager.runAfterInteractions(() => {
        // 🚀 预加载周围视频：当前 + 前一个 + 后一个（共3个）
        const currentVideoId = videoIds[currentIndex];
        const prevVideoId = currentIndex > 0 ? videoIds[currentIndex - 1] : null;
        const nextVideoId = currentIndex < videoIds.length - 1 ? videoIds[currentIndex + 1] : null;

        // 优先级：当前 > 后一个 > 前一个
        const videoIdsToPreload = [
          currentVideoId,
          nextVideoId,
          prevVideoId,
        ].filter((id): id is string => Boolean(id));

        if (videoIdsToPreload.length > 0) {
          // 日志索引顺序与预加载优先级保持一致：当前 > 后一个 > 前一个
          const preloadIndexes = [
            currentIndex,
            nextVideoId ? currentIndex + 1 : null,
            prevVideoId ? currentIndex - 1 : null,
          ].filter((idx): idx is number => idx !== null);

          log('feed-page', LogType.DEBUG,
            `Preloading ${videoIdsToPreload.length} videos after interaction: indexes [${preloadIndexes.join(', ')}]`);

          preloadVideos(videoIdsToPreload).catch((error) => {
            log('feed-page', LogType.DEBUG, `Preload failed (non-critical): ${error}`);
          });
        }
      });
    }, 500);
  }, [setCurrentFeedIndex, videoIds, preloadVideos, setTimer]);

  // 处理加载更多 - 核心逻辑（使用 shared hook 防抖）
  const handleEndReachedCore = useCallback(() => {
    // 检查：获取当前加载状态（实时检查）
    const currentLoadingState = useFeedStore.getState().loading.isLoading;
    if (currentLoadingState) {
      log('feed-page', LogType.DEBUG, 'Still loading, ignoring end reached');
      return;
    }

    log('feed-page', LogType.INFO, 'End reached, loading more videos...');

    loadMoreFeed().catch((error) => {
      log('feed-page', LogType.ERROR, `Failed to load more videos: ${error}`);
      toast.show({
        type: 'error',
        title: '加载更多失败',
        message: '请稍后重试',
        duration: 2000
      });
    });
  }, []);

  // 防抖包装（1秒防抖）
  const handleEndReached = useDebounce(handleEndReachedCore, 1000);

  // 处理下拉刷新
  const handleRefresh = useCallback(async () => {
    log('feed-page', LogType.INFO, 'Refreshing feed...');

    try {
      // 等待刷新完成
      await refreshFeed();

      // 确保刷新后 onEndReached 依然启用
      setIsFeedInitialized(true);

      // 刷新成功后，预加载前三个视频
      InteractionManager.runAfterInteractions(() => {
        const currentVideoIds = useFeedStore.getState().videoIds;

        if (currentVideoIds.length > 0) {
          // 预加载前三个视频：index 0, 1, 2
          const videoIdsToPreload = currentVideoIds.slice(0, 3);

          log('feed-page', LogType.DEBUG,
            `Preloading first ${videoIdsToPreload.length} videos after refresh: indexes [0, 1, 2]`);

          preloadVideos(videoIdsToPreload).catch((error) => {
            log('feed-page', LogType.DEBUG, `Preload after refresh failed (non-critical): ${error}`);
          });
        }
      });

    } catch (error) {
      log('feed-page', LogType.ERROR, `Failed to refresh feed: ${error}`);
      toast.show({
        type: 'error',
        title: '刷新失败',
        message: '请检查网络连接后重试',
        duration: 3000
      });
    }
  }, [preloadVideos]);

  return (
    <FeedList
      ref={feedListRef}
      onVideoPress={handleVideoPress}
      onViewableItemsChanged={handleViewableItemsChanged}
      onScrollEnd={handleScrollEnd}
      onEndReached={isFeedInitialized ? handleEndReached : undefined}
      onRefresh={handleRefresh}
      disabled={!isPageFocused}
    />
  );
}
