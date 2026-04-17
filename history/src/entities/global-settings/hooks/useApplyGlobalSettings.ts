/**
 * 应用全局设置到播放器实例 Hook
 *
 * Video Entity 主动监听 global-settings 的变化
 * 实现单向依赖：video → global-settings
 *
 * 性能优化：
 * - 使用精确选择器，只订阅需要的字段
 * - 避免订阅整个设置对象
 */

import { useEffect } from 'react';
import type { VideoPlayer } from 'expo-video';
import {
  useGlobalSettings,
  selectPlaybackRate,
  selectIsMuted,
  selectStaysActiveInBackground,
} from '@/entities/global-settings';
import { log, LogType } from '@/shared/lib/logger';

/**
 * 应用全局设置到播放器实例
 *
 * 职责：
 * - 监听 global-settings 的配置变化
 * - 自动应用到指定的播放器实例
 * - 处理播放器为空的情况
 *
 * @param player 播放器实例（可为 null）
 *
 * @example
 * ```tsx
 * const playerInstance = useVideoStore(selectPlayerInstance);
 * useApplyGlobalSettings(playerInstance);
 * ```
 */
export const useApplyGlobalSettings = (player: VideoPlayer | null) => {
  // 🎯 使用精确选择器，只订阅需要的字段（性能优化）
  const playbackRate = useGlobalSettings(selectPlaybackRate);
  const isMuted = useGlobalSettings(selectIsMuted);
  const staysActiveInBackground = useGlobalSettings(selectStaysActiveInBackground);

  useEffect(() => {
    if (!player) {
      return;
    }

    try {
      // 检查播放器实例是否有效（未被释放或销毁）
      // expo-video 的 player 实例在被释放后，其属性会变为 undefined
      if (player.playing === undefined) {
        log('video', LogType.WARNING,
          'Player instance appears to be disposed, skipping settings application'
        );
        return;
      }

      // 应用播放速率
      player.playbackRate = playbackRate;

      // 应用静音设置
      player.muted = isMuted;

      // 应用后台播放设置
      player.staysActiveInBackground = staysActiveInBackground;

      // 注意：startsPictureInPictureAutomatically 是 VideoView 的 prop，不是 player 属性

      log('video', LogType.DEBUG,
        `Applied global settings to player: rate=${playbackRate}, muted=${isMuted}, background=${staysActiveInBackground}`
      );
    } catch (error) {
      log('video', LogType.ERROR,
        `Failed to apply global settings to player: ${error}`
      );
    }
  }, [player, playbackRate, isMuted, staysActiveInBackground]);
};
