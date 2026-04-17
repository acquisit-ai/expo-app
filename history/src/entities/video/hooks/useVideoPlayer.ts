/**
 * 视频播放器统一入口 Hook
 * 提供播放器实例和播放状态访问
 * Player Pool 架构：从 Store 获取 currentPlayer 指针
 */

import { useMemo } from 'react';
import { useVideoStore } from '../model/store';
import { selectCurrentPlayer, selectCurrentTime, selectBufferedTime } from '../model/selectors';
import { formatTime } from '@/shared/lib/time-format';

/**
 * 视频播放器统一入口 Hook
 *
 * 提供：
 * - playerInstance: 当前播放器实例（直接操作实例进行控制）
 * - 播放状态和派生状态
 *
 * 控制播放器（使用 @/shared/lib/player-controls 工具函数）：
 * - playVideo(playerInstance) / pauseVideo(playerInstance)
 * - seekVideo(playerInstance, time)
 * - togglePlayVideo(playerInstance)
 *
 * 或直接使用实例方法：
 * - playerInstance.play() / playerInstance.pause()
 * - playerInstance.currentTime = time
 * - playerInstance.volume = volume
 * - playerInstance.playing (读取播放状态)
 */
export const useVideoPlayer = () => {
  // 🎯 精确订阅：只订阅 currentTime，不订阅整个 playback 对象
  const currentTime = useVideoStore(selectCurrentTime);

  // 🎯 精确订阅：只订阅 bufferedTime
  const bufferedTime = useVideoStore(selectBufferedTime);

  // 🎯 从 Store 获取当前播放器指针（Player Pool 架构）
  const playerInstance = useVideoStore(selectCurrentPlayer);

  // 🎯 直接从 playerInstance 读取其他状态
  const duration = playerInstance?.duration || 0;
  const volume = playerInstance?.volume || 1;

  // 🎯 计算格式化时间（避免重复订阅）
  const formattedCurrentTime = useMemo(() =>
    formatTime(currentTime), [currentTime]
  );

  const formattedDuration = useMemo(() =>
    formatTime(duration), [duration]
  );

  const isAtStart = currentTime === 0;
  const isAtEnd = duration > 0 && Math.abs(currentTime - duration) < 0.1;
  const progress = duration > 0 ? currentTime / duration : 0;
  const bufferedProgress = duration > 0 ? bufferedTime / duration : 0;

  return useMemo(() => ({
    // 🎯 播放器实例 - 直接使用实例方法进行控制
    playerInstance,

    // 🎯 原始播放状态
    currentTime,
    bufferedTime,
    duration,
    volume,

    // 🎯 派生状态
    progress,
    bufferedProgress,
    isAtStart,
    isAtEnd,
    formattedCurrentTime,
    formattedDuration,
  }), [
    playerInstance,
    currentTime,
    bufferedTime,
    duration,
    volume,
    progress,
    bufferedProgress,
    isAtStart,
    isAtEnd,
    formattedCurrentTime,
    formattedDuration,
  ]);
};
