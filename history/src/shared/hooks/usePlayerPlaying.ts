/**
 * 监听播放器实例播放状态的 Hook
 *
 * 职责：
 * - 监听指定播放器实例的 playingChange 事件
 * - 返回响应式的 isPlaying 状态
 * - 自动清理事件监听
 *
 * 使用场景：
 * - Widget 层需要根据播放状态控制动画
 * - Feature 层需要本地播放状态
 * - 任何需要响应式播放状态的组件
 *
 * 注意：
 * - 这是本地状态，不涉及全局 Store
 * - 每个使用此 Hook 的组件都会独立订阅播放器事件
 *
 * @example
 * ```tsx
 * const isPlaying = usePlayerPlaying(playerInstance);
 *
 * useEffect(() => {
 *   if (isPlaying) {
 *     startAnimation();
 *   } else {
 *     stopAnimation();
 *   }
 * }, [isPlaying]);
 * ```
 */

import { useState, useEffect } from 'react';
import type { VideoPlayer } from 'expo-video';

/**
 * 监听播放器播放状态
 *
 * @param player 播放器实例
 * @returns 播放状态（响应式）
 */
export const usePlayerPlaying = (player: VideoPlayer | null | undefined): boolean => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) {
      setIsPlaying(false);
      return;
    }

    // 读取初始状态
    setIsPlaying(player.playing);

    // 监听播放状态变化
    const subscription = player.addListener('playingChange', ({ isPlaying: newIsPlaying }) => {
      setIsPlaying(newIsPlaying);
    });

    // 清理监听
    return () => {
      subscription.remove();
    };
  }, [player]);

  return isPlaying;
};
