/**
 * 小型视频播放器组件
 *
 * 职责：
 * - 作为 video-player Feature 的根组件
 * - 接收 Widget 层传入的 PlayerMeta（播放器元数据）
 * - 显示视频内容和遮罩层
 *
 * 不负责：
 * - ❌ 应用全局设置到播放器实例（由 Entity 层的 useVideoEntitySync 管理）
 * - ❌ 同步播放器事件到 Entity Store（由 Entity 层的 useVideoEntitySync 管理）
 * - ❌ 管理时间更新间隔（由 Entity 层的 useVideoEntitySync 管理）
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { type AnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '@/shared/providers/ThemeProvider';
import type { PlayerMeta } from '@/shared/types';
import { VIDEO_PLAYER_CONSTANTS } from '../model/constants';
import { VideoPlayerContent } from './components/VideoPlayerContent';
import { log, LogType } from '@/shared/lib/logger';
import { useVideoMetaStore } from '@/entities/video-meta';

/**
 * 小型视频播放器组件的属性接口
 */
export interface SmallVideoPlayerProps {
  /** 播放器元数据 - 包含 playerInstance 和 videoMetaData */
  playerMeta: PlayerMeta;
  /** 容器宽度（可选，默认100%） */
  width?: DimensionValue;
  /** 容器高度（可选，默认按16:9计算） */
  height?: DimensionValue;
  /** 自定义容器样式 */
  containerStyle?: StyleProp<ViewStyle>;
  /** 遮罩层动画样式（用于复杂动画） */
  overlayAnimatedStyle?: AnimatedStyle<ViewStyle>;
  /** 是否自动启用画中画 - 由上层传入 */
  startsPictureInPictureAutomatically?: boolean;
}


/**
 * 小型视频播放器组件
 *
 * @example
 * ```tsx
 * <SmallVideoPlayer
 *   playerMeta={currentPlayerMeta}
 *   width="100%"
 *   height={200}
 *   overlayAnimatedStyle={overlayAnimation}
 * />
 * ```
 */
export const SmallVideoPlayer: React.FC<SmallVideoPlayerProps> = ({
  playerMeta,
  width = '100%',
  height = VIDEO_PLAYER_CONSTANTS.LAYOUT.VIDEO_HEIGHT,
  containerStyle,
  overlayAnimatedStyle,
  startsPictureInPictureAutomatically = false,
}) => {
  const { theme } = useTheme();

  // 从 playerMeta 解构播放器实例和视频 ID
  const { playerInstance, videoId } = playerMeta;

  // 🚀 性能优化：细粒度订阅 - 只订阅 video_url 字段，避免其他字段变化导致重渲染
  const videoUrl = useVideoMetaStore(state => {
    const video = videoId ? state.getVideo(videoId) : null;
    return video?.video_url ?? null;
  });

  // ❌ 已删除：应用全局设置（现在由 Entity 层的 useVideoEntitySync 统一管理）
  // useApplyGlobalSettings(playerInstance);

  // ❌ 已删除：同步播放器事件到 Store（现在由 Entity 层的 useVideoEntitySync 统一管理）
  // const { isPlayerReady } = usePlayerEventSync(playerInstance);

  // ❌ 已删除：时间更新间隔管理（现在由 Entity 层的 useVideoEntitySync 统一管理）
  // useTimeUpdateInterval({ enableDynamicAdjustment: true });

  // 容器样式 - 使用 useMemo 优化性能
  const computedContainerStyle: StyleProp<ViewStyle> = useMemo(() => [
    styles.videoContainer,
    {
      width,
      height,
      backgroundColor: theme.colors.surface,
    },
    containerStyle
  ], [width, height, theme.colors.surface, containerStyle]);

  // 如果没有播放器/视频 URL，不渲染内容
  if (!playerInstance || !videoUrl) {
    log('small-video-player', LogType.WARNING, 'Missing required props in playerMeta');
    return null;
  }

  return (
    <View style={computedContainerStyle}>
      {/* 视频显示区域 */}
      <VideoPlayerContent
        playerInstance={playerInstance}
        videoUrl={videoUrl}
        startsPictureInPictureAutomatically={startsPictureInPictureAutomatically}
        videoDisplayStyle={styles.videoDisplay}
        overlayAnimatedStyle={overlayAnimatedStyle}
        allowsPictureInPicture
        fullscreenOptions={{ enable: true, resizeMode: 'contain' }}
      />
    </View>
  );
};

/**
 * 组件样式
 */
const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  videoDisplay: {
    width: '100%',
    height: '100%',
  },
});