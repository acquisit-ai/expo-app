/**
 * 小屏详情页特定逻辑 Hook
 * 🔑 React Navigation 版本：使用 replace() 切换到全屏
 */

import { useCallback, useEffect } from 'react';
import { useNavigation, StackActions } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { log, LogType } from '@/shared/lib/logger';
import { useVideoStore, selectPlaybackContext } from '@/entities/video';
import { exitStandaloneVideo } from '@/features/standalone-video';

const LOG_TAG = 'video-detail-logic';

export interface VideoDetailActions {
  /** 进入全屏模式 */
  enterFullscreen: () => void;
  /** 返回 Feed 页 */
  backToFeed: () => void;
}

/**
 * 小屏详情页特定逻辑 - React Navigation 版本
 * 🔑 关键：使用 navigation.replace() 切换到全屏，不增加栈深度
 */
export function useVideoDetailLogic(): VideoDetailActions {
  const navigation = useNavigation();
  const playbackContext = useVideoStore(selectPlaybackContext);

  // ✅ 不再需要读取 videoId，因为不需要传递参数

  // 注意：不在这里自动清理视频
  // 清理由 Feed 页面在获得焦点时处理

  // 🔒 页面挂载时锁定竖屏
  useEffect(() => {
    let mounted = true;

    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
        if (mounted) {
          log(LOG_TAG, LogType.INFO, 'Orientation locked to portrait');
        }
      } catch (error) {
        if (mounted) {
          log(LOG_TAG, LogType.WARNING, `Failed to lock orientation: ${error}`);
        }
      }
    };

    lockOrientation();

    return () => {
      mounted = false;
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

  // 🎬 进入全屏模式
  const enterFullscreen = useCallback(() => {
    log(LOG_TAG, LogType.INFO, `Entering fullscreen mode (context: ${playbackContext})`);

    // 🔑 使用 replace() 替换当前页面，保持栈深度不变
    // ✅ 不再传递 videoId，Fullscreen 直接读取 currentPlayerMeta
    if (playbackContext === 'standalone') {
      navigation.dispatch(StackActions.replace('StandaloneVideoFullscreen'));
      return;
    }

    navigation.dispatch(StackActions.replace('VideoFullscreen'));
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
    enterFullscreen,
    backToFeed,
  };
}
