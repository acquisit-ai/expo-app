/**
 * 全屏视频播放器区域Widget组件
 *
 * 专门用于全屏模式的视频播放器区域，组合相关功能：
 * - 全屏视频播放器组件
 * - 控制层覆盖
 * - 字幕显示组件
 * - 状态栏管理
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { FullscreenVideoPlayer } from '@/features/video-player';
import { VideoDisplayMode } from '@/shared/types';
import { VideoControlsOverlay } from '@/widgets/video-controls-overlay';
import { IntegratedSubtitleView } from '@/features/subtitle-display';
import { useGlobalSettings, selectStartsPictureInPictureAutomatically } from '@/entities/global-settings';
import { useVideoMetaStore } from '@/entities/video-meta';
import { useVideoStore, selectCurrentVideoId } from '@/entities/video';
import type { PlayerMeta } from '@/shared/types';

// 🚀 性能优化：静态配置对象 - 避免每次渲染创建新对象
const FULLSCREEN_SUBTITLE_CONFIG = {
  enabled: true,
  position: 'bottom' as const,
  fontSize: 18,
  fontColor: '#FFFFFF',
  backgroundColor: 'transparent',
  backgroundOpacity: 0,
  showNavigationControls: true,
  autoScroll: true,
  enableClickToSeek: true,
};

const SUBTITLE_STYLE = {
  pointerEvents: 'box-none' as const,
};

/**
 * 全屏视频播放器区域组件的属性接口
 */
export interface FullscreenVideoPlayerSectionProps {
  /** 播放器元数据 - 包含 playerInstance 和 videoMetadata */
  playerMeta: PlayerMeta;
  /** 全屏退出回调 */
  onExitFullscreen: () => void;
  /** 显示模式 - 由 page 层传入 */
  displayMode: VideoDisplayMode;
  /** 是否自动播放 - 从 page 层传入 */
  autoPlay?: boolean;
}

/**
 * 全屏视频播放器区域组件
 */
export const FullscreenVideoPlayerSection = React.memo(function FullscreenVideoPlayerSection({
  playerMeta,
  onExitFullscreen,
  displayMode,
  autoPlay,
}: FullscreenVideoPlayerSectionProps) {
  // 从 props 解构播放器元数据
  const { playerInstance, videoId } = playerMeta;

  // 🚀 性能优化：只检查视频存在性，避免订阅整个对象导致无关字段变化时重渲染
  const videoExists = useVideoMetaStore(state =>
    videoId ? state.getVideo(videoId) !== null : false
  );

  // 🎯 判断是否为当前活跃视频 - Widget 层职责
  const currentVideoId = useVideoStore(selectCurrentVideoId);
  const isActiveVideo = videoId === currentVideoId;

  // 🎯 从 global-settings 读取画中画配置 - Widget 层负责组合
  const startsPictureInPictureAutomatically = useGlobalSettings(selectStartsPictureInPictureAutomatically);

  // 🚀 性能优化：缓存 playerMeta 对象，避免子组件不必要的重渲染
  const cachedPlayerMeta = useMemo(
    () => ({ videoId, playerInstance }),
    [videoId, playerInstance]
  );

  // 错误状态检查
  if (!videoExists || !playerInstance || !videoId) {
    return null;
  }

  return (
    <>
      {/* 全屏视频播放器 - 纯播放功能 */}
      <FullscreenVideoPlayer
        playerMeta={cachedPlayerMeta}
        displayMode={displayMode}
        autoPlay={autoPlay}
        startsPictureInPictureAutomatically={startsPictureInPictureAutomatically}
      />

      {/* 覆盖层容器 - Widget 层组合控制层和字幕 */}
      <View style={styles.overlayContainer}>
        <VideoControlsOverlay
          playerMeta={cachedPlayerMeta}
          displayMode={displayMode}
          isActiveVideo={isActiveVideo}
          onToggleFullscreen={onExitFullscreen}
        />

        {/* 字幕显示组件 - 仅活跃视频渲染 */}
        {isActiveVideo && (
          <IntegratedSubtitleView
            config={FULLSCREEN_SUBTITLE_CONFIG}
            subtitleStyle={SUBTITLE_STYLE}
          />
        )}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none', // 允许事件穿透到视频播放器
  },
});