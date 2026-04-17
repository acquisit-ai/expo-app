/**
 * 小屏视频播放器区域Widget组件
 *
 * 专门用于小屏模式的视频播放器区域，组合相关功能：
 * - 小屏视频播放器组件组合
 * - 控制栏组合
 * - 固定定位和安全区域
 * - 滚动动画响应
 */

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  cancelAnimation,
  runOnJS,
  makeMutable,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { log, LogType } from '@/shared/lib/logger';

// 从video-player feature导入
import {
  VIDEO_PLAYER_CONSTANTS,
  SmallVideoPlayer,
  HeaderButtonBar,
  calculateVideoScrollTransform,
  calculateOverlayAnimation,
  createVideoScrollLogic,
  ANIMATION_PRESETS,
} from '@/features/video-player';

// 从 shared 库导入播放器工具
import { usePlayerPlaying } from '@/shared/hooks';

// 从detail-interaction-bar feature导入
import { VideoInteractionSection } from '@/features/detail-interaction-bar';

// 从video-controls-overlay widget导入
import { VideoControlsOverlay } from '@/widgets/video-controls-overlay';
import { IntegratedSubtitleView } from '@/features/subtitle-display';
import { VideoDisplayMode } from '@/shared/types';

// 从entities导入
import { useGlobalSettings, selectStartsPictureInPictureAutomatically } from '@/entities/global-settings';
import { useVideoMetaStore } from '@/entities/video-meta';
import { useVideoStore, selectCurrentVideoId } from '@/entities/video';
import type { PlayerMeta } from '@/shared/types';

const { LAYOUT, DERIVED } = VIDEO_PLAYER_CONSTANTS;

// 🚀 性能优化：静态配置对象 - 避免每次渲染创建新对象
const SMALL_SUBTITLE_CONFIG = {
  enabled: false,
  position: 'bottom' as const,
  fontSize: 14,
  fontColor: '#FFFFFF',
  backgroundColor: 'transparent',
  backgroundOpacity: 0,
  showNavigationControls: false,
  autoScroll: true,
  enableClickToSeek: false,
};

const SMALL_SUBTITLE_CONTAINER_STYLE = {
  position: 'absolute' as const,
  bottom: 10,
  left: 10,
  right: 10,
  zIndex: 10,
};

export interface SmallVideoPlayerSectionProps {
  /** 播放器元数据 - 包含 playerInstance 和 videoMetadata */
  playerMeta: PlayerMeta;
  /** 滚动处理器 - 传递给外部ScrollView */
  onScrollHandler?: (handler: (event: NativeSyntheticEvent<NativeScrollEvent>) => void) => void;
  /** 全屏切换回调 */
  onToggleFullscreen: () => void;
  /** 返回回调 */
  onBack: () => void;
  /** 显示模式 - 由 page 层传入 */
  displayMode: VideoDisplayMode;
}

/**
 * 视频播放器区域组件
 *
 * 负责组合视频播放器相关的所有功能：
 * - 视频播放器和动画
 * - 控制栏交互
 * - 返回按钮
 * - 固定定位布局
 */
export const SmallVideoPlayerSection = React.memo(function SmallVideoPlayerSection({
  playerMeta,
  onScrollHandler,
  onToggleFullscreen,
  onBack,
  displayMode,
}: SmallVideoPlayerSectionProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // 从 props 解构播放器元数据
  const { playerInstance: currentPlayer, videoId } = playerMeta;

  // 🚀 性能优化：只检查视频存在性，避免订阅整个对象导致无关字段变化时重渲染
  const videoExists = useVideoMetaStore(state =>
    videoId ? state.getVideo(videoId) !== null : false
  );

  // 🎯 判断是否为当前活跃视频 - Widget 层职责
  const currentVideoId = useVideoStore(selectCurrentVideoId);
  const isActiveVideo = videoId === currentVideoId;

  // 🚀 性能优化：缓存 playerMeta 对象，避免子组件不必要的重渲染
  const cachedPlayerMeta = useMemo(
    () => ({ videoId, playerInstance: currentPlayer }),
    [videoId, currentPlayer]
  );

  // 🎯 从 global-settings 读取画中画配置 - Widget 层负责组合
  const startsPictureInPictureAutomatically = useGlobalSettings(selectStartsPictureInPictureAutomatically);

  // 🎯 从 playerInstance 直接监听播放状态（本地响应式）
  const isPlaying = usePlayerPlaying(currentPlayer);

  // 错误状态检查
  if (!videoExists || !currentPlayer || !videoId) {
    return null;
  }

  // 动画状态管理 - 使用useRef确保SharedValues稳定
  const scrollY = useRef(useSharedValue(0)).current;
  const scrollOffsetRaw = useRef(useSharedValue(0)).current;
  const effectiveScrollY = useRef(useSharedValue(0)).current;
  const playingTransition = useRef(useSharedValue(0)).current;

  // 本地动画状态 - 用于组件间动画协调
  const isPlayingShared = useRef(makeMutable(false)).current;
  const isPlayAnimatingShared = useRef(makeMutable(false)).current;


  // 全局偏移量
  const scrollOffset = useDerivedValue(() => Math.max(0, scrollOffsetRaw.value));

  // 缓存样式 - 拆分静态和动态部分以优化性能
  const fixedHeaderBaseStyle = useMemo(() => [
    styles.fixedHeader,
    {
      top: insets.top,
      height: DERIVED.PLACEHOLDER_HEIGHT,
    }
  ], [insets.top]); // ✅ 只依赖 insets.top，不依赖高频变化的 isPlaying

  const safeAreaStyle = useMemo(() => [
    styles.fixedSafeArea,
    { height: insets.top }
  ], [insets.top]);

  // 监听视频切换，重置滚动状态
  useEffect(() => {
    scrollY.value = 0;
    scrollOffsetRaw.value = 0;
    effectiveScrollY.value = 0;
    playingTransition.value = 0;
  }, [videoId]);


  // 🚀 优化：动画完成后的批量操作处理
  const handleVideoExpandComplete = useCallback(() => {
    log('video-player', LogType.DEBUG, 'Video expand animation completed successfully');
    // 这里可以添加其他需要在动画完成后执行的JS操作
    // 例如：分析事件、状态同步确认等
  }, []);

  const handleVideoCollapseComplete = useCallback(() => {
    log('video-player', LogType.DEBUG, 'Video collapse animation completed successfully');
    // 暂停状态下的动画完成处理
  }, []);

  // 全屏切换处理 - 直接使用回调，不需要包装

  // 监听播放状态变化并同步到SharedValues
  useEffect(() => {
    // 同步播放状态到SharedValue
    isPlayingShared.value = isPlaying;

    if (isPlaying) {
      isPlayAnimatingShared.value = true;

      effectiveScrollY.value = withTiming(0, ANIMATION_PRESETS.videoExpand, (finished) => {
        'worklet';
        if (finished) {
          isPlayAnimatingShared.value = false;
          // 🚀 优化：使用 runOnJS 执行动画完成后的JS操作
          runOnJS(handleVideoExpandComplete)();
        }
      });

      playingTransition.value = withTiming(1, ANIMATION_PRESETS.playTransition);
    } else {
      isPlayAnimatingShared.value = false;
      scrollOffsetRaw.value = scrollY.value;

      playingTransition.value = withTiming(0, ANIMATION_PRESETS.pauseTransition, (finished) => {
        'worklet';
        if (finished) {
          // 🚀 优化：暂停动画完成后的JS操作
          runOnJS(handleVideoCollapseComplete)();
        }
      });
    }
  }, [isPlaying, isPlayingShared, isPlayAnimatingShared, handleVideoExpandComplete, handleVideoCollapseComplete]);

  // 组件卸载清理
  useEffect(() => {
    return () => {
      cancelAnimation(effectiveScrollY);
      cancelAnimation(playingTransition);
      log('video-player', LogType.DEBUG, 'VideoPlayerSection unmounted, animations cleaned up');
    };
  }, []);

  // 🚀 性能优化：缓存滚动处理逻辑，避免每次渲染重新创建
  const scrollLogic = useMemo(() => createVideoScrollLogic(), []);
  const { handlePlayingScroll, handlePausedScroll } = scrollLogic;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      if (isPlayingShared.value) {
        handlePlayingScroll(
          event.contentOffset.y,
          scrollOffsetRaw,
          effectiveScrollY,
          isPlayAnimatingShared.value
        );
      } else {
        handlePausedScroll(
          event.contentOffset.y,
          scrollOffset,
          scrollOffsetRaw,
          effectiveScrollY
        );
      }
    },
  });

  // 传递滚动处理器给父组件 - 仅在初始化时调用
  useEffect(() => {
    onScrollHandler?.(scrollHandler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // scrollHandler 由 useAnimatedScrollHandler 创建，引用始终稳定

  // 动画样式
  const videoAnimatedStyle = useAnimatedStyle(() => {
    return calculateVideoScrollTransform({ effectiveScrollY, playingTransition });
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return calculateOverlayAnimation({ effectiveScrollY, playingTransition });
  });

  // 静态样式部分
  const baseAnimatedContentStyle = useMemo(() => [
    styles.animatedContent,
    { height: DERIVED.PLACEHOLDER_HEIGHT },
  ], []);

  return (
    <>
      {/* 固定的黑色SafeArea */}
      <View style={safeAreaStyle} />

      {/* 固定的头部容器 - 动态 zIndex 内联 */}
      <View style={[fixedHeaderBaseStyle, { zIndex: isPlaying ? 11 : 9 }]}>
        {/* 头部按钮栏（包含返回按钮和播放状态指示器） */}
        <HeaderButtonBar
          effectiveScrollY={effectiveScrollY}
          onBackPress={onBack}
          isPlaying={isPlaying}
        />

        {/* 动画内容容器 */}
        <Animated.View style={[baseAnimatedContentStyle, videoAnimatedStyle]}>
          {/* 视频播放器组件 - 纯播放功能 */}
          <SmallVideoPlayer
            playerMeta={cachedPlayerMeta}
            width="100%"
            height={LAYOUT.VIDEO_HEIGHT}
            overlayAnimatedStyle={overlayAnimatedStyle}
            containerStyle={styles.videoContainer}
            startsPictureInPictureAutomatically={startsPictureInPictureAutomatically}
          />

          {/* 控制层覆盖 - Widget 层平行组合 */}
          <View
            style={styles.controlsOverlayContainer}
            pointerEvents="box-none" // 允许事件穿透到子组件
          >
            <VideoControlsOverlay
              playerMeta={cachedPlayerMeta}
              displayMode={displayMode}
              isActiveVideo={isActiveVideo}
              onToggleFullscreen={onToggleFullscreen}
              scrollY={effectiveScrollY}
              isPlayingShared={isPlayingShared}
            />

            {/* 字幕显示组件 - 仅活跃视频渲染 */}
            {isActiveVideo && (
              <IntegratedSubtitleView
                config={SMALL_SUBTITLE_CONFIG}
                containerStyle={SMALL_SUBTITLE_CONTAINER_STYLE}
              />
            )}
          </View>

          {/* 控制按钮栏 */}
          <VideoInteractionSection videoId={videoId} />
        </Animated.View>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  fixedSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    zIndex: 10,
  },
  fixedHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
    overflow: 'hidden',
  },
  animatedContent: {
    // height 动态设置
  },
  videoContainer: {
    width: '100%',
    height: LAYOUT.VIDEO_HEIGHT,
    backgroundColor: 'black',
  },
  controlsOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: LAYOUT.VIDEO_HEIGHT,
  },
});