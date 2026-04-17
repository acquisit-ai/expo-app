/**
 * 视频导航业务逻辑 Hook - Feature 层
 * 协调视频播放、导航和播放器池管理
 *
 * 职责：
 * - 进入/退出视频详情页
 * - 协调 video entity 和 player-pool entity
 * - 处理视频预加载
 *
 * 🔑 React Navigation 版本：使用 navigation API 代替 expo-router
 */

import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/shared/navigation/types';
import { log, LogType } from '@/shared/lib/logger';
import { useVideoStore } from '@/entities/video/model/store';
import { selectSetCurrentPlayerMeta, selectClearCurrentVideo } from '@/entities/video/model/selectors';
import { acquirePlayerForVideo, performPreloadVideos } from '../lib/video-operations';

export interface VideoNavigationActions {
  enterVideoDetail: (videoId: string) => Promise<void>;
  exitToFeed: () => void;
  preloadVideos: (videoIds: string[]) => Promise<void>;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * 视频导航业务逻辑 Hook
 * 编排多个 entities，处理导航和播放器管理
 * 🎯 使用 PlayerMeta 确保 videoId 和 player 绑定
 */
export const useVideoNavigation = (): VideoNavigationActions => {
  const navigation = useNavigation<NavigationProp>();
  const setCurrentPlayerMeta = useVideoStore(selectSetCurrentPlayerMeta);
  const clearCurrentVideo = useVideoStore(selectClearCurrentVideo);

  // 🚀 进入视频播放模式 - 从池获取播放器和元数据
  const enterVideoDetail = useCallback(async (videoId: string) => {
    try {
      log('video-navigation', LogType.INFO, `Entering video detail: ${videoId}`);

      // 1. 从池获取播放器实例（使用 Feature 层）
      const player = await acquirePlayerForVideo(videoId);

      // 2. 构造 PlayerMeta（包含 player + videoId 的绑定）
      const playerMeta = {
        playerInstance: player,
        videoId: videoId,
      };

      // 3. 设置到 video store（使用 PlayerMeta 确保绑定）
      setCurrentPlayerMeta(playerMeta, 'pool');

      // 4. 导航
      // ✅ 不再传递 videoId，Fullscreen 直接读取 currentPlayerMeta
      navigation.navigate('VideoStack', {
        screen: 'VideoFullscreen',
        params: {
          autoPlay: true,
        },
      });

      log('video-navigation', LogType.INFO, `Successfully entered video detail: ${videoId}`);
    } catch (error) {
      log('video-navigation', LogType.ERROR, `Failed to enter video detail: ${error}`);
      clearCurrentVideo();
      throw error;
    }
  }, [navigation, setCurrentPlayerMeta, clearCurrentVideo]);

  // 🧹 退出视频播放 - 暂停并清除指针
  const exitToFeed = useCallback(() => {
    try {
      log('video-navigation', LogType.INFO, 'Exiting video playback');

      const currentMeta = useVideoStore.getState().currentPlayerMeta;

      // 暂停当前播放器（但不销毁，留在池中）
      if (currentMeta?.playerInstance) {
        currentMeta.playerInstance.pause();
        log('video-navigation', LogType.DEBUG, 'Current player paused');
      }

      // 清除状态和指针
      clearCurrentVideo();

      // 导航回 Feed
      navigation.navigate('MainTabs', { screen: 'Feed' });

      log('video-navigation', LogType.INFO, 'Successfully exited to feed');
    } catch (error) {
      log('video-navigation', LogType.WARNING, `Error during exit: ${error}`);
      // 确保状态被清理，即使出现错误
      clearCurrentVideo();
    }
  }, [navigation, clearCurrentVideo]);

  // 🎯 预加载视频列表 - 串行执行
  const preloadVideos = useCallback(async (videoIds: string[]) => {
    if (videoIds.length === 0) {
      return;
    }

    log('video-navigation', LogType.DEBUG,
      `Preloading ${videoIds.length} video IDs`);

    // 🔑 await 确保串行执行完成（调用底层实现）
    await performPreloadVideos(videoIds);

    log('video-navigation', LogType.DEBUG, 'Preload completed');
  }, []);

  return useMemo(() => ({
    enterVideoDetail,
    exitToFeed,
    preloadVideos,
  }), [
    enterVideoDetail,
    exitToFeed,
    preloadVideos,
  ]);
};
