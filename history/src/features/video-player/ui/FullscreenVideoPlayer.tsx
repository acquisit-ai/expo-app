/**
 * 全屏视频播放器组件
 *
 * 职责：
 * - 作为 video-player Feature 的根组件
 * - 接收 Widget 层传入的 PlayerMeta（播放器元数据）
 * - 显示全屏视频内容
 * - 管理自动播放逻辑
 *
 * 不负责：
 * - ❌ 应用全局设置到播放器实例（由 Entity 层的 useVideoEntitySync 管理）
 * - ❌ 同步播放器事件到 Entity Store（由 Entity 层的 useVideoEntitySync 管理）
 * - ❌ 管理时间更新间隔（由 Entity 层的 useVideoEntitySync 管理）
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoDisplayMode, type PlayerMeta } from '@/shared/types';
import { VideoPlayerContent } from './components/VideoPlayerContent';
import { usePlayerReadyState } from '@/shared/hooks';
import { useVideoMetaStore } from '@/entities/video-meta';
import { log, LogType } from '@/shared/lib/logger';

/**
 * 全屏视频播放器组件的属性接口
 */
export interface FullscreenVideoPlayerProps {
  /** 播放器元数据 - 包含 playerInstance 和 videoMetaData */
  playerMeta: PlayerMeta;
  /** 显示模式 - 由上层传入 */
  displayMode: VideoDisplayMode;
  /** 是否自动播放 - 从导航参数传入 */
  autoPlay?: boolean;
  /** 是否自动启用画中画 - 由上层传入 */
  startsPictureInPictureAutomatically?: boolean;
}

/**
 * 全屏视频播放器组件
 *
 * 职责边界：
 * - 只负责视频播放和状态管理
 * - 控制层和字幕由 Widget 层组合
 */
export const FullscreenVideoPlayer: React.FC<FullscreenVideoPlayerProps> = ({
  playerMeta,
  displayMode,
  autoPlay,
  startsPictureInPictureAutomatically = false,
}) => {
  // 从 playerMeta 解构播放器实例和视频 ID
  const { playerInstance, videoId } = playerMeta;

  // 从 Video Meta Entity 获取视频数据
  const videoMetaData = useVideoMetaStore(state =>
    videoId ? state.getVideo(videoId) : null
  );

  // ❌ 已删除：应用全局设置（现在由 Entity 层的 useVideoEntitySync 统一管理）
  // useApplyGlobalSettings(playerInstance);

  // ❌ 已删除：同步播放器事件到 Store（现在由 Entity 层的 useVideoEntitySync 统一管理）
  // const { isPlayerReady } = usePlayerEventSync(playerInstance);

  // ❌ 已删除：时间更新间隔管理（现在由 Entity 层的 useVideoEntitySync 统一管理）
  // useTimeUpdateInterval({ enableDynamicAdjustment: true });

  // ✅ 本地状态：每个播放器实例独立跟踪自己的 isPlayerReady
  // 不从 Entity Store 读取（Entity Store 只维护当前播放器的全局状态）
  const { isPlayerReady } = usePlayerReadyState(playerInstance);

  // 🎬 条件自动播放逻辑
  // ✅ 简化版：不需要 lastAutoPlayedVideoIdRef 防重复
  // 原因：页面层通过 useFocusEffect 已经控制了 autoPlay 的响应式状态
  useEffect(() => {
    // ✅ 只在以下条件全部满足时才自动播放：
    // 1. autoPlay === true (明确要求自动播放，由页面层响应式控制)
    // 2. 播放器已就绪
    // 3. 播放器实例存在
    // 4. 视频数据存在
    if (autoPlay === true &&
        isPlayerReady &&
        playerInstance &&
        videoMetaData) {
      log('fullscreen-video-player', LogType.INFO,
        `Auto-playing video on ready (autoPlay=true): ${videoMetaData.id}`);
      playerInstance.play();
    } else if (autoPlay !== true && isPlayerReady && videoMetaData) {
      // 📝 记录：不自动播放的情况（如从 Detail 切换过来，或页面失去焦点）
      log('fullscreen-video-player', LogType.DEBUG,
        `Skipping auto-play (autoPlay=${autoPlay}): keeping current playback state for ${videoMetaData.id}`);
    }
  }, [autoPlay, isPlayerReady, playerInstance, videoMetaData]);

  // 调试日志
  useEffect(() => {
    log('fullscreen-video-player', LogType.INFO,
      `Player: ${playerInstance ? 'exists' : 'null'}, Video: ${videoMetaData ? videoMetaData.title : 'null'}, Mode: ${displayMode}`);
  }, [playerInstance, videoMetaData, displayMode]);

  // 如果没有播放器/视频数据，不渲染内容
  if (!playerInstance || !videoMetaData) {
    log('fullscreen-video-player', LogType.WARNING, 'Missing required props in playerMeta');
    return null;
  }

  // 从 videoMetaData 计算显示数据
  const videoUrl = videoMetaData.video_url;

  return (
    <View style={styles.container}>
      {/* <StatusBar hidden /> */}

      {/* 视频播放器内容 - 只负责视频播放 */}
      <VideoPlayerContent
        playerInstance={playerInstance}
        videoUrl={videoUrl}
        startsPictureInPictureAutomatically={startsPictureInPictureAutomatically}
        videoDisplayStyle={styles.video}
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
  container: {
    flex: 1,
    backgroundColor: 'black', // 保持黑色，作为视频播放背景
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});