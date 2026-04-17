/**
 * 全屏播放页特定逻辑 Hook
 * 🔑 React Navigation 版本：使用 replace() 切换到 Detail
 */

import { useCallback, useEffect } from 'react';
import { useNavigation, StackActions } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { log, LogType } from '@/shared/lib/logger';
import { useOrientationDetection } from '@/shared/hooks/useOrientationDetection';
import { useBackHandler } from '@/shared/hooks/useEventSubscription';
import { useVideoStore, selectPlaybackContext } from '@/entities/video';
import { exitStandaloneVideo } from '@/features/standalone-video';

const LOG_TAG = 'video-fullscreen-logic';

export interface VideoFullscreenActions {
  /** 退出全屏模式 */
  exitFullscreen: () => void;
  /** 返回 Feed 页 */
  backToFeed: () => void;
  /** 当前是否为横屏 */
  isLandscape: boolean;
}

/**
 * 全屏播放页特定逻辑 - React Navigation 版本
 * 🔑 关键：使用 navigation.replace() 切换到 Detail，不增加栈深度
 */
export function useVideoFullscreenLogic(): VideoFullscreenActions {
  const navigation = useNavigation();
  const playbackContext = useVideoStore(selectPlaybackContext);

  // ✅ 不再需要读取 videoId，因为不需要传递参数

  const { isLandscape } = useOrientationDetection();

  // 注意：不在这里自动清理视频
  // 清理由 Feed 页面在获得焦点时处理

  // 🔓 页面挂载时解锁方向，卸载时恢复竖屏锁定
  useEffect(() => {
    let mounted = true;

    const unlockOrientation = async () => {
      try {
        await ScreenOrientation.unlockAsync();
        if (mounted) {
          log(LOG_TAG, LogType.INFO, 'Orientation unlocked for fullscreen');
        }
      } catch (error) {
        if (mounted) {
          log(LOG_TAG, LogType.WARNING, `Failed to unlock orientation: ${error}`);
        }
      }
    };

    unlockOrientation();

    // 🎯 清理函数：恢复竖屏锁定
    return () => {
      mounted = false;

      // Fire-and-forget: 不等待结果，添加错误处理
      // 确保退出 Fullscreen 后其他页面恢复竖屏锁定
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      ).then(() => {
        log(LOG_TAG, LogType.INFO, 'Orientation locked on fullscreen unmount');
      }).catch((error) => {
        log(LOG_TAG, LogType.WARNING, `Failed to lock orientation on cleanup: ${error}`);
      });
    };
  }, []);

  useEffect(() => {
    if (playbackContext !== 'standalone') {
      return;
    }

    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (event.data.action?.type === 'REPLACE') {
        return;
      }

      exitStandaloneVideo().catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        log(LOG_TAG, LogType.WARNING,
          `Failed to release standalone player on beforeRemove: ${message}`);
      });
    });

    return unsubscribe;
  }, [navigation, playbackContext]);

  // 🚫 横屏模式禁用硬件返回键
  useBackHandler(
    () => {
      log(LOG_TAG, LogType.DEBUG, 'Hardware back blocked in landscape');
      return true; // 阻止默认行为
    },
    isLandscape
  );

  // 🔙 退出全屏模式（切换到 Detail 页面）
  const exitFullscreen = useCallback(() => {
    log(LOG_TAG, LogType.INFO, `Exiting fullscreen to detail mode (context: ${playbackContext})`);

    // 🔑 使用 replace() 替换当前页面，保持栈深度不变
    // ✅ 不再传递 videoId，Detail 直接读取 currentPlayerMeta
    if (playbackContext === 'standalone') {
      navigation.dispatch(StackActions.replace('StandaloneVideoDetail'));
      return;
    }

    navigation.dispatch(StackActions.replace('VideoDetail'));
  }, [navigation, playbackContext]);

  // 🔙 返回 Feed 页
  const backToFeed = useCallback(() => {
    log(LOG_TAG, LogType.INFO, `Navigating back (context: ${playbackContext})`);

    if (playbackContext === 'standalone') {
      exitStandaloneVideo().catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        log(LOG_TAG, LogType.WARNING,
          `Failed to release standalone player on back: ${message}`);
      });
    }

    // 关闭当前视频栈
    const parent = navigation.getParent();
    if (parent) {
      parent.goBack();
      return;
    }

    navigation.goBack();
  }, [navigation, playbackContext]);

  return {
    exitFullscreen,
    backToFeed,
    isLandscape,
  };
}
