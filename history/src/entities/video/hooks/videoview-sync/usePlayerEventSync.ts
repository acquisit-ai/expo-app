/**
 * 播放器事件同步 Hook
 *
 * 职责：
 * - 监听播放器事件（statusChange, timeUpdate）
 * - 同步必要状态到 Entity Store（currentTime, bufferedTime）
 * - 不负责本地 UI 状态管理
 *
 * 注意：
 * - 整个应用只应通过 useVideoEntitySync 调用一次
 * - 不返回任何值（纯同步到 Store）
 * - ❌ 不同步 isPlaying（使用 usePlayerPlaying 直接监听）
 * - ❌ 不同步 isPlayerReady（使用 usePlayerReadyState 直接监听）
 */

import { useEffect, useRef } from 'react';
import { type VideoPlayer, type VideoPlayerStatus } from 'expo-video';
import { useVideoStore } from '../../model/store';
import { log, LogType } from '@/shared/lib/logger';
import { toast } from '@/shared/lib/toast';

/**
 * 播放器事件同步 Hook
 * 监听 expo-video 播放器事件并同步状态到 video entity store
 */
export const usePlayerEventSync = (player: VideoPlayer | null) => {
  // 状态去重：跟踪上一次的状态
  const lastStatus = useRef<VideoPlayerStatus | null>(null);

  useEffect(() => {
    if (!player) {
      lastStatus.current = null;
      return;
    }

    // 检查播放器初始状态（只记录日志，不同步 isPlayerReady）
    if (player.status === 'readyToPlay') {
      lastStatus.current = 'readyToPlay';
      log('player-event-sync', LogType.DEBUG,
        `Player already ready on mount - duration: ${player.duration}s`);
    }

    // 监听状态变化事件
    const statusSubscription = player.addListener('statusChange', ({ status, error }) => {
      // 🔥 状态去重：如果状态没有变化，直接忽略
      if (lastStatus.current === status) {
        return;
      }

      // 🔥 HLS 特殊处理：一旦进入 ready 状态，短时间内忽略 loading 状态
      // 这是因为 HLS 加载新分片时会触发 loading，但这不应该影响全局状态
      if (lastStatus.current === 'readyToPlay' && status === 'loading') {
        log('player-event-sync', LogType.DEBUG,
          `Ignoring transient loading state (HLS segment loading)`);
        return;
      }

      // 更新上次状态
      lastStatus.current = status;

      // 1. 处理错误状态
      if (error) {
        log('player-event-sync', LogType.WARNING, `Video error: ${error.message}`);

        // 显示统一的错误提示
        toast.show({
          type: 'error',
          title: '视频播放错误',
          message: '视频播放遇到问题，请重试'
        });
      }

      // 2. 记录播放器状态变化（不同步 isPlayerReady 到 Store）
      // isPlayerReady 由 Feature 层的 usePlayerReadyState 独立管理
      if (status === 'readyToPlay') {
        log('player-event-sync', LogType.DEBUG,
          `Player ready - duration: ${player.duration}s`);
      } else if (status === 'loading') {
        log('player-event-sync', LogType.DEBUG, `Player loading`);
      }

      // 3. 处理播放结束
      if (status === 'idle' && !player.playing) {
        log('player-event-sync', LogType.INFO, 'Video playback ended or stopped');
      }

      log('player-event-sync', LogType.DEBUG, `Video status changed: ${status}`);
    });

    // ❌ 已删除：playingChange 监听
    // isPlaying 现在由各组件使用 usePlayerPlaying 直接监听

    // 监听时间更新（用于进度条和时间显示）
    const timeSubscription = player.addListener('timeUpdate', ({ currentTime, bufferedPosition }) => {
      const store = useVideoStore.getState();
      store.updatePlayback({
        currentTime,
        bufferedTime: bufferedPosition
      });
    });

    // 清理事件监听
    return () => {
      statusSubscription.remove();
      timeSubscription.remove();
    };
  }, [player]);

  // 注意：此 Hook 不返回任何值，只负责同步到 Store
  // UI 组件应使用 Feature 层的 usePlayerReadyState 获取本地状态
};