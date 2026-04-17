/**
 * 播放器就绪状态 Hook
 *
 * 职责：
 * - 跟踪单个播放器实例的 isPlayerReady 状态
 * - 不同步到 Entity Store（与 usePlayerEventSync 分离）
 * - 用于任何需要播放器就绪状态的组件
 *
 * 区别：
 * - usePlayerEventSync: 同步当前播放器到 Store（全局状态）
 * - usePlayerReadyState: 返回播放器实例的本地状态（组件私有）
 *
 * @example
 * ```tsx
 * // Feature 层组件
 * const VideoPlayerContent = ({ playerInstance }) => {
 *   const { isPlayerReady } = usePlayerReadyState(playerInstance);
 *
 *   return isPlayerReady ? <VideoView /> : <ActivityIndicator />;
 * };
 * ```
 */

import { useEffect, useState, useRef } from 'react';
import { type VideoPlayer, type VideoPlayerStatus } from 'expo-video';
import { log, LogType } from '@/shared/lib/logger';
import { useSingleTimer } from './useTimer';

/**
 * 播放器就绪状态 Hook
 * 跟踪单个播放器实例的就绪状态，不影响全局 Entity Store
 */
export const usePlayerReadyState = (player: VideoPlayer | null) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // 状态去重：跟踪上一次的状态
  const lastStatus = useRef<VideoPlayerStatus | null>(null);
  // 使用通用 timer hook
  const { setTimer, clearTimer } = useSingleTimer();

  useEffect(() => {
    if (!player) {
      setIsPlayerReady(false);
      lastStatus.current = null;
      return;
    }

    // 检查播放器初始状态，避免组件重新挂载时丢失就绪状态
    if (player.status === 'readyToPlay') {
      lastStatus.current = 'readyToPlay';
      setIsPlayerReady(true);
      log('player-ready-state', LogType.DEBUG,
        `Player already ready on mount - duration: ${player.duration}s`);
    }

    // 监听状态变化事件
    const statusSubscription = player.addListener('statusChange', ({ status, error }) => {
      // 🔥 状态去重：如果状态没有变化，直接忽略
      if (lastStatus.current === status) {
        return;
      }

      // 🔥 HLS 特殊处理：一旦进入 ready 状态，短时间内忽略 loading 状态
      if (lastStatus.current === 'readyToPlay' && status === 'loading') {
        log('player-ready-state', LogType.DEBUG,
          `Ignoring transient loading state (HLS segment loading)`);
        return;
      }

      // 更新上次状态
      lastStatus.current = status;

      // 处理错误状态
      if (error) {
        log('player-ready-state', LogType.WARNING, `Player error: ${error.message}`);
      }

      // 处理视频就绪状态
      if (status === 'readyToPlay') {
        // 清除可能存在的防抖定时器
        clearTimer();

        setIsPlayerReady(true);
        log('player-ready-state', LogType.DEBUG,
          `Player ready - duration: ${player.duration}s`);
      } else if (status === 'loading') {
        // 🔥 loading 状态防抖：延迟 300ms 才更新为 not ready
        // 避免短暂的 loading 状态造成 UI 闪烁
        setTimer(() => {
          setIsPlayerReady(false);
          log('player-ready-state', LogType.DEBUG, `Player loading (debounced)`);
        }, 300);
      } else {
        setIsPlayerReady(false);
      }
    });

    // 清理事件监听（timer 会自动清理）
    return () => {
      statusSubscription.remove();
    };
  }, [player, setTimer, clearTimer]);

  return { isPlayerReady };
};
