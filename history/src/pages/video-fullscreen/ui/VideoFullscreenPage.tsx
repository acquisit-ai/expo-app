/**
 * 全屏视频播放页
 * 支持双模式：
 * - FULLSCREEN_PORTRAIT: ScrollView 上下滑动切换视频
 * - FULLSCREEN_LANDSCAPE: 单视频显示
 */

import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useRoute, useFocusEffect } from '@react-navigation/native';

import { FullscreenVideoPlayerSection } from '@/widgets/fullscreen-video-player-section';
import { VideoDisplayMode } from '@/shared/types';
import { log, LogType } from '@/shared/lib/logger';
import type {
  VideoFullscreenScreenProps,
  StandaloneVideoFullscreenScreenProps,
} from '@/shared/navigation/types';
import { useForceStatusBarStyle } from '@/shared/hooks/useForceStatusBarStyle';
import { useAfterInteractions } from '@/shared/hooks';
import { playerPoolManager, usePlayerPoolStore } from '@/entities/player-pool';
import { useVideoStore, selectPlaybackContext } from '@/entities/video';
import * as VideoWindowManagement from '@/features/video-window-management';

// 使用页面特定逻辑 Hook
import { useVideoFullscreenLogic } from '../hooks/useVideoFullscreenLogic';
import { useFullscreenScrollWindow } from '../hooks/useFullscreenScrollWindow';
import { useStandaloneFullscreenWindow } from '../hooks/useStandaloneFullscreenWindow';
import { FullscreenDebugPanel } from './debug/FullscreenDebugPanel';

/**
 * 🚀 性能优化：占位符组件（保持 ScrollView contentSize）
 * 使用 React.memo 避免不必要的重渲染
 */
const VideoPlaceholder = React.memo<{ style: any }>(({ style }) => (
  <View style={style} />
));

/**
 * 全屏视频播放页
 */
type VideoFullscreenRoute =
  | VideoFullscreenScreenProps['route']
  | StandaloneVideoFullscreenScreenProps['route'];

export function VideoFullscreenPage() {
  // 获取导航参数（支持主视频栈与独立栈）
  const route = useRoute<VideoFullscreenRoute>();
  const initialAutoPlay = route.params?.autoPlay ?? false;

  // 🔑 方案A：响应式 autoPlay 状态
  // 将 autoPlay 从静态导航参数转为动态状态，随页面焦点变化
  const [shouldAutoPlay, setShouldAutoPlay] = useState(initialAutoPlay ?? false);

  // 🚀 性能优化 P4：使用 ref 避免依赖变化导致 effect 重新创建
  const initialAutoPlayRef = React.useRef(initialAutoPlay ?? false);
  initialAutoPlayRef.current = initialAutoPlay ?? false;

  // 🔑 关键：监听页面焦点变化，失去焦点时立即取消自动播放意图
  useFocusEffect(
    useCallback(() => {
      // 页面获得焦点时，恢复初始的 autoPlay 意图
      setShouldAutoPlay(initialAutoPlayRef.current);

      return () => {
        // 🔥 核心修复：页面失去焦点时，立即取消自动播放意图
        // 这确保即使播放器在后台加载完成，也不会自动播放
        setShouldAutoPlay(false);
        log('video-fullscreen-page', LogType.INFO, 'Page lost focus, cancelled autoPlay intent');
      };
    }, [])  // ✅ 空依赖，永远不重新创建
  );

  const playbackContext = useVideoStore(selectPlaybackContext);
  const isStandaloneMode = playbackContext === 'standalone';

  // 🆕 页面挂载后批量加载待加载的视频（仅池模式）
  useAfterInteractions(() => {
    if (playbackContext !== 'pool') {
      log('video-fullscreen-page', LogType.DEBUG,
        'Standalone mode detected, skipping pending video load');
      return;
    }

    log('video-fullscreen-page', LogType.INFO,
      'Page mounted after navigation, loading pending videos');

    VideoWindowManagement.loadPendingVideos();
  }, [playbackContext], false);  // 不使用 RAF，立即执行

  // 🎨 强制状态栏为白色（不受系统主题影响）
  useForceStatusBarStyle('light');

  // 页面特定逻辑
  const { exitFullscreen, isLandscape } = useVideoFullscreenLogic();

  // ScrollView 滑动窗口逻辑
  const poolWindowController = useFullscreenScrollWindow(isLandscape);
  const standaloneWindowController = useStandaloneFullscreenWindow();

  const {
    scrollViewRef,
    windowVideoIds,
    allPlayerMetas,
    currentIndex,
    handleScroll,
    handleMomentumScrollEnd,
    itemHeight,
    isInitialMount,
    resetExtendTriggers,
  } = isStandaloneMode ? standaloneWindowController : poolWindowController;

  // 🔑 关键：使用 video entity store 作为唯一真相来源（仅用于可见性判断）
  const currentVideoIdFromStore = useVideoStore(
    state => state.currentPlayerMeta?.videoId
  );

  // === 🆕 v5.0: 窗口扩展时的滚动位置同步（基于 videoId）===
  const windowStartVideoId = usePlayerPoolStore(state => state.windowStartVideoId);
  const prevWindowStartVideoIdRef = useRef(windowStartVideoId);

  // 🎯 优化：使用 ref 访问最新的 currentIndex，避免将其加入依赖数组
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  useLayoutEffect(() => {
    const videoIdChanged = windowStartVideoId !== prevWindowStartVideoIdRef.current;

    // 🔑 关键：从 ref 读取最新的 currentIndex，避免闭包陷阱
    // currentIndex >= 0 表示当前视频在窗口中，-1 表示不在或无视频
    if (videoIdChanged && !isLandscape && currentIndexRef.current >= 0) {
      const newOffset = currentIndexRef.current * itemHeight;

      log('video-fullscreen-page', LogType.INFO,
        `🔧 windowStartVideoId changed: ${prevWindowStartVideoIdRef.current} → ${windowStartVideoId}`);
      log('video-fullscreen-page', LogType.INFO,
        `   Current video at index ${currentIndexRef.current}, scrollTo ${newOffset}`);

      // ✅ 立即调整滚动位置（在浏览器绘制前同步执行，避免闪烁）
      scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });

      // 🔑 关键：重置窗口扩展触发标志，允许下次再次触发
      resetExtendTriggers();
    }

    // 更新 ref
    prevWindowStartVideoIdRef.current = windowStartVideoId;
  }, [windowStartVideoId, itemHeight, isLandscape, resetExtendTriggers]);

  // 计算显示模式
  const displayMode = React.useMemo(() =>
    isLandscape ? VideoDisplayMode.FULLSCREEN_LANDSCAPE : VideoDisplayMode.FULLSCREEN_PORTRAIT,
    [isLandscape]
  );

  // 🚀 性能优化：缓存样式对象，避免每次渲染创建新对象
  const placeholderStyle = React.useMemo(
    () => [styles.placeholder, { height: itemHeight }],
    [itemHeight]
  );

  const videoContainerStyle = React.useMemo(
    () => [styles.videoContainer, { height: itemHeight }],
    [itemHeight]
  );

  // 🚀 性能优化：提前计算需要渲染的索引集合（避免 13 次重复计算）
  // currentIndex 现在从 hook 获取，避免重复计算
  const renderIndices = React.useMemo(() => {
    if (isStandaloneMode) {
      return new Set<number>([0]);
    }

    const set = new Set<number>();

    if (currentIndex === -1) {
      // 当前视频不在窗口中（降级处理）
      return set;
    }

    if (isInitialMount) {
      // 初次挂载：只渲染当前索引
      set.add(currentIndex);
    } else {
      // 滑动后：渲染当前 ± 1 索引
      const start = Math.max(0, currentIndex - 1);
      const end = Math.min(windowVideoIds.length - 1, currentIndex + 1);
      for (let i = start; i <= end; i++) {
        set.add(i);
      }
    }
    return set;
  }, [currentIndex, isInitialMount, windowVideoIds.length]);  // 🔧 修复：添加 windowVideoIds.length 依赖

  // 🆕 v5.0: 移除 Feed 裁剪监听（基于 videoId 后不再需要）
  // 之前的实现会监听 Feed 长度变化并调整 windowStartIndex
  // 现在完全基于 windowStartVideoId，Feed 裁剪不影响

  // 页面挂载日志
  React.useEffect(() => {
    log('video-fullscreen-page', LogType.INFO,
      `Page mounted, initialAutoPlay: ${initialAutoPlay}, shouldAutoPlay: ${shouldAutoPlay}, isLandscape: ${isLandscape}`);
  }, [initialAutoPlay, shouldAutoPlay, isLandscape]);

  // 🔍 调试：追踪懒加载渲染数量
  React.useEffect(() => {
    if (!isLandscape && windowVideoIds.length > 0) {
      log('video-fullscreen-page', LogType.DEBUG,
        `Lazy loading: rendering ${renderIndices.size}/${windowVideoIds.length} videos (current: ${currentIndex}, initial: ${isInitialMount})`);
    }
  }, [currentIndex, windowVideoIds.length, isLandscape, isInitialMount, renderIndices.size]);

  // 错误状态：窗口为空
  if (windowVideoIds.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>
          视频窗口加载失败
        </Text>
      </View>
    );
  }

  // 🚀 性能优化 P2：统一使用 ScrollView，横屏时禁用滚动（避免闪烁）
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        // === 🚀 性能优化：原生分页滚动，动画最流畅 ===
        pagingEnabled={!isLandscape && !isStandaloneMode}           // ✅ 横屏或独立模式时禁用分页
        scrollEnabled={!isLandscape && !isStandaloneMode}           // ✅ 横屏或独立模式时禁用滚动
        decelerationRate="fast"                // ✅ 快速响应滑动
        scrollEventThrottle={50}               // ✅ 窗口扩展检测（20fps足够）
        overScrollMode="never"                 // ✅ Android 禁用过度滚动
        bounces={!isLandscape && !isStandaloneMode}                 // ✅ 横屏或独立模式时禁用弹性效果
        scrollsToTop={false}
        onScroll={handleScroll}                // 窗口扩展检测
        onMomentumScrollEnd={handleMomentumScrollEnd}  // 更新 currentVideoId
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        {windowVideoIds.map((videoId, index) => {
          // 🔑 关键：使用 videoId 判断可见性，而不是索引（避免窗口扩展时的状态不一致）
          const isVisible = videoId === currentVideoIdFromStore;

          // 🔑 关键：懒加载优化 - 使用预计算的索引集合（避免重复计算）
          // 🆕 横屏模式只渲染当前视频
          const shouldRender = isLandscape ? isVisible : renderIndices.has(index);

          if (!shouldRender) {
            // 渲染占位符（保持滚动高度）
            return <VideoPlaceholder key={videoId} style={placeholderStyle} />;
          }

          // 🚀 性能优化 P3：从预计算的 Map 中获取（O(1) 查找）
          const playerMeta = allPlayerMetas.get(videoId);

          // 跳过无效的播放器
          if (!playerMeta) {
            log('video-fullscreen-page', LogType.WARNING,
              `Player meta not found for video: ${videoId}`);
            return <VideoPlaceholder key={videoId} style={placeholderStyle} />;
          }

          return (
            <View key={videoId} style={videoContainerStyle}>
              <FullscreenVideoPlayerSection
                playerMeta={playerMeta}
                onExitFullscreen={exitFullscreen}
                displayMode={displayMode}
                autoPlay={shouldAutoPlay && isVisible}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* 调试面板 - 仅开发环境 */}
      {__DEV__ && false && (
        <FullscreenDebugPanel
          currentVideoId={currentVideoIdFromStore ?? null}
          windowVideoIds={windowVideoIds}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
  },
  // 🚀 性能优化：预定义样式，避免运行时创建对象
  placeholder: {
    backgroundColor: '#000',
    // height 由 useMemo 动态组合
  },
  videoContainer: {
    // height 由 useMemo 动态组合
  },
});
