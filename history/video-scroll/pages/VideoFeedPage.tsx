import React, { useRef, useEffect, useLayoutEffect, useCallback, useReducer, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayerStatus } from 'expo-video';
import type { VideoPlayer as VideoPlayerType } from 'expo-video';
import { VideoPlayer, VideoPlayerRef } from '../components/VideoPlayer';
import { StatusPanel } from '../components/StatusPanel';
import { videoWindowReducer, WindowState } from '../reducers/videoWindowReducer';
import { videoData } from '../data/videos';
import { playerPool } from '../utils/playerPool';

/**
 * 视频流页面
 *
 * 使用 ScrollView 实现无限滚动的视频播放功能
 */
export default function VideoFeedPage() {
  const scrollViewRef = useRef<ScrollView>(null);
  const mediaRefs = useRef<{ [key: string]: VideoPlayerRef }>({});

  // 当前播放的视频 metaId（用 metaId 而非 index，避免窗口变化时判断错误）
  const [currentVideoId, setCurrentVideoId] = useState<string>(videoData[0]?.metaId || '');

  // 同时用 ref 存储 currentVideoId，用于 useLayoutEffect 读取（避免重复触发）
  const currentVideoIdRef = useRef<string>(currentVideoId);

  // 视频高度（全屏）
  const itemHeight = Dimensions.get('window').height;

  // 防抖：标记是否已在触发区域内触发过加载
  const hasTriggeredLoadRef = useRef<{ next: boolean; prev: boolean }>({
    next: false,
    prev: false,
  });

  // 加载状态：防止重复触发
  const isLoadingRef = useRef<{ next: boolean; prev: boolean }>({
    next: false,
    prev: false,
  });

  // 记录上一次的 windowStartIndex（用于检测窗口移动）
  const prevWindowStartIndexRef = useRef(0);

  // 使用 useReducer 统一管理窗口状态
  const [state, dispatch] = useReducer(videoWindowReducer, {
    windowData: [],
    windowStartIndex: 0,
  } as WindowState);

  // 使用 ref 存储最新的 state，避免 load 函数频繁重新创建
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 辅助函数：直接从 player 实例获取状态
  const getVideoStatus = useCallback((videoId: string): VideoPlayerStatus | 'unknown' => {
    return mediaRefs.current[videoId]?.getStatus() || 'unknown';
  }, []);

  // 初始化滑动窗口：加载前12个视频
  useEffect(() => {
    dispatch({ type: 'INITIALIZE', payload: { videos: videoData } });
  }, []);

  // 辅助函数：等待 player 加载完成（带超时保护）
  const waitForPlayerReady = useCallback((player: VideoPlayerType): Promise<void> => {
    return new Promise((resolve) => {
      // 如果已经 ready，立即 resolve
      if (player.status === 'readyToPlay' || player.status === 'error') {
        console.log(`✅ Player already ready: ${player.status}`);
        resolve();
        return;
      }

      console.log(`⏳ Waiting for player ready, current status: ${player.status}`);

      let resolved = false;

      // 监听状态变化
      const listener = player.addListener('statusChange', ({ status }) => {
        console.log(`📊 Player status changed: ${status}`);

        if (status === 'readyToPlay' || status === 'error') {
          if (!resolved) {
            resolved = true;
            listener.remove();
            resolve();
          }
        }
      });

      // 10秒超时保护
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          listener.remove();
          console.warn(`⏰ Timeout waiting for player ready (status: ${player.status})`);
          resolve(); // 超时也继续
        }
      }, 10000);
    });
  }, []);

  // 通用加载函数：预加载批次视频，确保 ready 后再插入窗口
  const load = useCallback(async (direction: 'next' | 'prev') => {
    if (isLoadingRef.current[direction]) {
      console.log(`⏭️  load${direction}: Already loading, skipping`);
      return;
    }

    isLoadingRef.current[direction] = true;
    console.log(`🔽 load${direction}: Starting preload...`);

    try {
      // 1. 计算需要加载的视频（使用 stateRef 获取最新状态）
      const batchSize = 4;
      let videosToLoad = [];

      if (direction === 'next') {
        const startIdx = stateRef.current.windowStartIndex + stateRef.current.windowData.length;
        const endIdx = Math.min(startIdx + batchSize, videoData.length);
        videosToLoad = videoData.slice(startIdx, endIdx);
      } else {
        const endIdx = stateRef.current.windowStartIndex;
        const startIdx = Math.max(0, endIdx - batchSize);
        videosToLoad = videoData.slice(startIdx, endIdx);
      }

      if (videosToLoad.length === 0) {
        console.log(`📍 No videos to load for ${direction}`);
        return;
      }

      console.log(`📦 Preloading ${videosToLoad.length} videos:`, videosToLoad.map(v => v.metaId));

      // 2. 从 pool 获取 player 并等待加载完成
      const preloadPromises = videosToLoad.map(async (video) => {
        try {
          console.log(`📤 Acquiring player for ${video.metaId}`);
          const player = await playerPool.acquirePlayer(video.metaId, video.video_url);

          if (!player) {
            console.error(`❌ Failed to acquire player for ${video.metaId}`);
            return;
          }

          console.log(`⏳ Waiting for ${video.metaId} to be ready...`);
          await waitForPlayerReady(player);
          console.log(`✅ ${video.metaId} is ready!`);
        } catch (error) {
          console.error(`❌ Preload error for ${video.metaId}:`, error);
        }
      });

      // 3. 等待所有视频都加载完成
      await Promise.all(preloadPromises);

      console.log(`✅ All ${videosToLoad.length} videos preloaded successfully`);

      // 4. 所有视频都 ready 了，dispatch 更新窗口
      dispatch({
        type: direction === 'next' ? 'LOAD_NEXT' : 'LOAD_PREV',
        payload: { allVideos: videoData }
      });

      console.log(`✅ load${direction}: Window updated`);
    } catch (error) {
      console.error(`❌ load${direction} error:`, error);
    } finally {
      isLoadingRef.current[direction] = false;
    }
  }, [waitForPlayerReady]);

  // maintainVisibleContentPosition: windowStartIndex 变化时调整滚动位置
  // 使用 useLayoutEffect 而非 useEffect，确保在浏览器绘制前同步执行，避免黑屏闪烁
  useLayoutEffect(() => {
    const prevStartIndex = prevWindowStartIndexRef.current;
    const currentStartIndex = state.windowStartIndex;
    const delta = currentStartIndex - prevStartIndex;

    // windowStartIndex 发生变化，需要调整滚动位置
    if (delta !== 0 && state.windowData.length > 0) {
      // 找到当前播放视频在新窗口中的位置
      const currentVideo = state.windowData.find(v => v.metaId === currentVideoIdRef.current);

      if (currentVideo) {
        const newIndex = state.windowData.indexOf(currentVideo);
        const newOffset = newIndex * itemHeight;

        console.log(`🔧 windowStartIndex changed: ${prevStartIndex} → ${currentStartIndex} (delta: ${delta})`);
        console.log(`   Current video ${currentVideoIdRef.current} is now at index ${newIndex}, scrollTo ${newOffset}`);

        // 立即调整滚动位置（在浏览器绘制前同步执行，避免显示错误位置）
        scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
      } else {
        console.warn(`⚠️  Current video ${currentVideoIdRef.current} not found in new window`);
      }
    }

    // 更新 ref
    prevWindowStartIndexRef.current = state.windowStartIndex;
  }, [state.windowStartIndex, state.windowData, itemHeight]); // 依赖 windowData 以获取最新数据

  /**
   * ScrollView onScroll 处理：检测当前视频 ID
   */
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newIndex = Math.round(offsetY / itemHeight);

    // 使用 stateRef 获取最新状态
    const currentState = stateRef.current;

    if (newIndex >= 0 && newIndex < currentState.windowData.length) {
      const newVideoId = currentState.windowData[newIndex]?.metaId;

      if (newVideoId && newVideoId !== currentVideoId) {
        console.log(`📱 Current video changed: ${currentVideoId} → ${newVideoId} (index: ${newIndex})`);

        // 同时更新 state 和 ref
        currentVideoIdRef.current = newVideoId;
        setCurrentVideoId(newVideoId);
      }

      // 边界检查（基于 index 触发加载）
      const canLoadNext = currentState.windowStartIndex + currentState.windowData.length < videoData.length;
      const canLoadPrev = currentState.windowStartIndex > 0;

      // 🔽 向下加载逻辑：位置 10-11 触发
      if (newIndex >= 10) {
        if (!hasTriggeredLoadRef.current.next && !isLoadingRef.current.next && canLoadNext) {
          console.log(`🔽 Near bottom (${newIndex}/${currentState.windowData.length}), triggering loadNext`);
          hasTriggeredLoadRef.current.next = true;
          load('next');
        }
      } else {
        hasTriggeredLoadRef.current.next = false;
      }

      // 🔼 向上加载逻辑：位置 0-1 触发
      if (newIndex <= 1) {
        if (!hasTriggeredLoadRef.current.prev && !isLoadingRef.current.prev && canLoadPrev) {
          console.log(`🔼 Near top (${newIndex}/${currentState.windowData.length}), triggering loadPrev`);
          hasTriggeredLoadRef.current.prev = true;
          load('prev');
        }
      } else {
        hasTriggeredLoadRef.current.prev = false;
      }
    }
  }, [currentVideoId, itemHeight, load]);

  // VideoPlayer 容器 style
  const videoItemStyle = { height: itemHeight, backgroundColor: 'black' as const };

  // 计算当前视频在窗口中的 index（用于 StatusPanel 显示）
  const currentIndexInWindow = useMemo(
    () => state.windowData.findIndex(v => v.metaId === currentVideoId),
    [state.windowData, currentVideoId]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        scrollsToTop={false}
        decelerationRate="normal"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {state.windowData.map((item) => (
          <View key={item.metaId} style={videoItemStyle}>
            <VideoPlayer
              item={item}
              isVisible={item.metaId === currentVideoId}
              ref={ref => {
                if (ref) {
                  mediaRefs.current[item.metaId] = ref;
                } else {
                  console.log(`🗑️  Cleaning ref for ${item.metaId}`);
                  delete mediaRefs.current[item.metaId];
                }
              }}
            />
          </View>
        ))}
      </ScrollView>

      {/* 状态显示面板（仅开发环境） */}
      {__DEV__ && (
        <StatusPanel
          currentIndexInSource={
            state.windowStartIndex + (currentIndexInWindow !== -1 ? currentIndexInWindow : 0)
          }
          totalVideos={videoData.length}
          windowStartIndex={state.windowStartIndex}
          windowSize={state.windowData.length}
          currentIndex={currentIndexInWindow !== -1 ? currentIndexInWindow : 0}
          getVideoStatus={getVideoStatus}
          videoData={videoData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
