/**
 * 视频控件组合Hook - 性能优化版
 * 分层架构，懒加载，最小化重计算
 *
 * 🚀 性能优化策略：
 * - 分层Hook架构：核心逻辑分离到专用Hook
 * - 懒加载：按需初始化复杂系统
 * - 依赖优化：精确控制更新时机
 * - 缓存优化：减少重复计算
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { makeMutable } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { VideoDisplayMode, type PlayerMeta } from '@/shared/types';
import {
  useConditionalCurrentTime,
  useConditionalBufferedTime,
  useConditionalDuration,
} from '@/entities/video';
import { useSubtitleNavigation } from '@/features/subtitle-display/hooks/useSubtitleNavigation';
import { useVideoMetaStore } from '@/entities/video-meta';
import {
  useGlobalSettings,
  selectShowSubtitles,
  selectShowTranslation,
  selectUpdateUIDisplaySettings,
} from '@/entities/global-settings';
import { syncFavoriteMockState } from '@/features/favorites-fetching/api/favorites-mock-store';
import { recordHistoryMock } from '@/features/history-fetching/api/history-mock-store';
import { isDevelopment } from '@/shared/config/environment';
import { usePlayerReadyState, usePlayerPlaying } from '@/shared/hooks';
import { seekVideo, togglePlayVideo } from '@/shared/lib/player-controls';
import { useScrollAwareVisibility } from './useScrollAwareVisibility';
import { useControlsAutoHide } from './useControlsAutoHide';
import { useVideoAnimation } from './useVideoAnimation';
import { useVideoGestureCallbacks } from './useVideoGestureCallbacks';
import { useModal } from '@/shared/lib/modal';
import type { AppModalStackParamsList } from '@/app/config/modal-registry';
import type { VideoCoreControlsProviderProps } from '@/features/video-core-controls';
import {
  SmallScreenLayout,
  FullscreenPortraitLayout,
  FullscreenLandscapeLayout,
} from '@/features/video-core-controls';

// === 布局组件映射 - 静态配置 ===
const LAYOUT_COMPONENTS = {
  [VideoDisplayMode.SMALL]: SmallScreenLayout,
  [VideoDisplayMode.FULLSCREEN_PORTRAIT]: FullscreenPortraitLayout,
  [VideoDisplayMode.FULLSCREEN_LANDSCAPE]: FullscreenLandscapeLayout,
} as const;

// === 接口定义 ===
interface VideoControlsCompositionOptions {
  playerMeta: PlayerMeta; // 播放器元数据（包含 videoId 和 playerInstance）
  displayMode: VideoDisplayMode;
  isActiveVideo: boolean; // 是否为当前活跃视频（由 Widget 层判断）
  onToggleFullscreen?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  scrollY?: SharedValue<number>;
  isPlayingShared?: SharedValue<boolean>;
}

interface VideoControlsCompositionReturn {
  coreControlsProps: Omit<VideoCoreControlsProviderProps, 'children'>;
  gestureProps: {
    tapGesture: any;
    seekFeedbackTrigger: any;
  };
  animationProps: {
    animatedStyle: any;
    shouldShowPlayButton: boolean;
  };
  LayoutComponent: React.ComponentType<any>;
}

/**
 * 视频控件组合Hook - 性能优化版
 *
 * 🎯 优化亮点：
 * - 分层架构：核心逻辑分离，降低复杂度
 * - 懒加载：复杂系统按需初始化
 * - 缓存优化：智能缓存，减少重计算
 * - 依赖精简：最小化Hook依赖，避免过度更新
 */
export function useVideoControlsComposition({
  playerMeta,
  displayMode,
  isActiveVideo,
  onToggleFullscreen,
  onVisibilityChange,
  scrollY,
  isPlayingShared,
}: VideoControlsCompositionOptions): VideoControlsCompositionReturn {

  const navigation = useNavigation();
  const { openModal } = useModal<AppModalStackParamsList>();

  // 解构 playerMeta
  const { videoId, playerInstance } = playerMeta;

  // ====== 字幕导航 - 内部管理（条件订阅）======
  const subtitleNavigation = useSubtitleNavigation(playerInstance, isActiveVideo);

  // ====== 2. 播放状态（细粒度条件订阅）======
  // ✅ 每个字段独立订阅
  const currentTime = useConditionalCurrentTime(isActiveVideo);
  const bufferedTime = useConditionalBufferedTime(isActiveVideo);
  const duration = useConditionalDuration(isActiveVideo);

  // ✅ 从 playerInstance 读取（不订阅 store）
  const isPlaying = usePlayerPlaying(playerInstance);

  // ✅ 响应式获取播放器就绪状态（Feature 层本地状态）
  const { isPlayerReady } = usePlayerReadyState(playerInstance);

  // ====== 3. 播放控制方法（仅活跃视频有效）======
  const seek = useCallback((time: number) => {
    if (isActiveVideo) {
      seekVideo(playerInstance, time);
    }
  }, [isActiveVideo, playerInstance]);

  const togglePlay = useCallback(() => {
    if (isActiveVideo) {
      togglePlayVideo(playerInstance);
    }
  }, [isActiveVideo, playerInstance]);

  // ====== 4. Feature 层本地控件可见性状态 ======
  const [controlsVisible, setControlsVisible] = useState(true);

  // ====== 5. 从 Video Meta Entity 获取视频数据 ======
  const videoMetadata = useVideoMetaStore(state =>
    videoId ? state.getVideo(videoId) : null
  );

  // === 3. 从 Entity 订阅全局设置 ===
  const showSubtitles = useGlobalSettings(selectShowSubtitles);
  const showTranslation = useGlobalSettings(selectShowTranslation);
  const updateUIDisplaySettings = useGlobalSettings(selectUpdateUIDisplaySettings);

  // ====== 6. 元数据控制（所有视频都有效）======
  const toggleLike = useCallback(() => {
    if (!videoId) return;
    const store = useVideoMetaStore.getState();
    const meta = store.getVideo(videoId);
    store.updateVideo(videoId, {
      isLiked: !meta?.isLiked
    });
  }, [videoId]);

  const toggleFavorite = useCallback(() => {
    if (!videoId) return;
    const store = useVideoMetaStore.getState();
    const meta = store.getVideo(videoId);
    if (!meta) return;
    const nextIsFavorited = !meta.isFavorited;
    store.updateVideo(videoId, {
      isFavorited: nextIsFavorited
    });

    if (isDevelopment()) {
      syncFavoriteMockState(videoId, nextIsFavorited);
    }
  }, [videoId]);

  const toggleSubtitles = useCallback(() => updateUIDisplaySettings({ showSubtitles: !showSubtitles }), [updateUIDisplaySettings, showSubtitles]);
  const toggleTranslation = useCallback(() => updateUIDisplaySettings({ showTranslation: !showTranslation }), [updateUIDisplaySettings, showTranslation]);

  // === 5. 核心数据计算（缓存优化） ===
  const coreData = useMemo(() => ({
    isFullscreen: displayMode !== VideoDisplayMode.SMALL,
    duration, // 使用 Entity 提供的 duration
    iconSize: displayMode === VideoDisplayMode.SMALL ? 'small' as const : 'medium' as const,
    shouldShowPlayButton: isPlayerReady && !isPlaying,
  }), [displayMode, duration, isPlayerReady, isPlaying]);

  // === 6. 控件自动隐藏系统（Feature 层本地管理） ===
  const { showControls, resetAutoHideTimer } = useControlsAutoHide({
    displayMode,
    controlsVisible,
    setControlsVisible,
    playerInstance,
    onVisibilityChange,
  });

  // === 4. 长按处理 - 稳定回调 ===
  const handleLongPress = useCallback(() => {
    openModal('PlaybackSettingsModal');
    resetAutoHideTimer();
  }, [openModal, resetAutoHideTimer]);

  // === 4.1. 返回导航处理 - 稳定回调 ===
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // === 5. 播放状态SharedValue - 懒加载 ===
  const playingSharedValue = useMemo(() =>
    isPlayingShared || makeMutable(isPlaying),
    [isPlayingShared, isPlaying]
  );

  // ====== 6.1 历史记录 Mock 记录（开发模式） ======
  const lastProgressRef = useRef(0);
  const hasDuration = typeof duration === 'number' && duration > 0;

  useEffect(() => {
    if (!isDevelopment()) {
      return;
    }

    if (!isActiveVideo || !videoId || !hasDuration) {
      lastProgressRef.current = 0;
      return;
    }

    const progress = Math.max(0, Math.min(1, (currentTime || 0) / (duration as number)));
    const threshold = 0.05;

    if (progress >= threshold && lastProgressRef.current < threshold) {
      recordHistoryMock(videoId, progress);
    }

    lastProgressRef.current = progress;
  }, [currentTime, duration, hasDuration, isActiveVideo, videoId]);

  // === 6. 小屏滚动感知系统（条件性初始化） ===
  const smallScreenVisibility = useScrollAwareVisibility({
    scrollY,
    onVisibilityChange: undefined,
    animationDuration: 200,
    isPlayingShared: playingSharedValue,
  });

  // === 7. 动画系统（分离优化） ===
  const { animatedStyle, seekFeedback } = useVideoAnimation({
    displayMode,
    controlsVisible,
    smallScreenOpacity: smallScreenVisibility.opacity,
  });

  // === 8. 手势系统（分离优化） ===
  const { gestureHandler } = useVideoGestureCallbacks({
    displayMode,
    playerInstance,
    togglePlay,
    showControls,
    currentTime,
    duration: coreData.duration,
    seek,
    subtitleNavigation,
    onLongPress: handleLongPress,
    triggerForward: seekFeedback.triggerForward,
    triggerBackward: seekFeedback.triggerBackward,
  });

  // === 9. Core Controls Props组合（分组优化，提升可维护性） ===

  // 9.1 播放核心数据 - 视频状态和时间
  const playbackProps = useMemo(() => ({
    currentTime,
    duration: coreData.duration,
    isPlaying,
    bufferedTime,
    isFullscreen: coreData.isFullscreen,
    size: coreData.iconSize,
  }), [currentTime, coreData.duration, coreData.isFullscreen, coreData.iconSize, isPlaying, bufferedTime]);

  // 9.2 播放控制回调 - 播放器操作
  const controlProps = useMemo(() => ({
    onSeek: seek,
    onPlayToggle: togglePlay,
    onToggleFullscreen,
    onBack: handleBack,
  }), [seek, togglePlay, onToggleFullscreen, handleBack]);

  // 9.3 交互反馈回调 - 自动隐藏触发
  const interactionProps = useMemo(() => ({
    onInteraction: resetAutoHideTimer,
    onProgressInteraction: resetAutoHideTimer,
  }), [resetAutoHideTimer]);

  // 9.4 社交功能状态 - 点赞收藏
  const socialProps = useMemo(() => ({
    isLiked: videoMetadata?.isLiked ?? false,
    isFavorited: videoMetadata?.isFavorited ?? false,
    onToggleLike: toggleLike,
    onToggleFavorite: toggleFavorite,
  }), [videoMetadata?.isLiked, videoMetadata?.isFavorited, toggleLike, toggleFavorite]);

  // 9.5 内容显示功能 - 字幕翻译
  const contentProps = useMemo(() => ({
    showSubtitles,
    showTranslation,
    onToggleSubtitles: toggleSubtitles,
    onToggleTranslation: toggleTranslation,
  }), [showSubtitles, showTranslation, toggleSubtitles, toggleTranslation]);

  // 9.6 UI配置
  const uiConfigProps = useMemo(() => ({
    showBackButton: true,
    controlsVisible: true,
    // ✅ 播放控件透明度（非活跃视频透明）
    playbackControlsOpacity: isActiveVideo ? 1 : 0,
    // ✅ 播放控件交互控制（非活跃视频禁用触摸）
    playbackControlsPointerEvents: isActiveVideo ? 'auto' as const : 'none' as const,
  }), [isActiveVideo]);

  // 9.7 最终组合 - 零开销合并所有分组
  const coreControlsProps = useMemo((): Omit<VideoCoreControlsProviderProps, 'children'> => ({
    ...playbackProps,
    ...controlProps,
    ...interactionProps,
    ...socialProps,
    ...contentProps,
    ...uiConfigProps,
  }), [playbackProps, controlProps, interactionProps, socialProps, contentProps, uiConfigProps]);

  // === 10. 布局组件选择（零开销） ===
  const LayoutComponent = LAYOUT_COMPONENTS[displayMode];

  return {
    coreControlsProps,
    gestureProps: {
      tapGesture: gestureHandler,
      seekFeedbackTrigger: seekFeedback,
    },
    animationProps: {
      animatedStyle,
      shouldShowPlayButton: coreData.shouldShowPlayButton,
    },
    LayoutComponent,
  };
}
