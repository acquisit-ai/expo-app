/**
 * 动态时间更新间隔管理 Hook
 * 根据播放状态和应用状态智能调整时间更新频率
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { VideoPlayer } from 'expo-video';
import { useVideoPlayer } from '../useVideoPlayer';
import { log, LogType } from '@/shared/lib/logger';

// 时间更新间隔常量
const TIME_UPDATE_INTERVALS = {
  PLAYING: 0.15,        // 播放时 150ms
  BACKGROUND_OR_PAUSED: 1,  // 后台或暂停时 1s
} as const;

interface TimeUpdateIntervalConfig {
  /** 是否启用动态调整 */
  enableDynamicAdjustment?: boolean;
  /** 自定义播放时间隔 */
  customPlayingInterval?: number;
  /** 自定义后台时间隔 */
  customBackgroundInterval?: number;
}

/**
 * 动态时间更新间隔管理 Hook
 *
 * 功能：
 * - 播放时使用 300ms 间隔
 * - 暂停/后台时使用 1s 间隔
 * - 自动响应 AppState 变化
 * - 支持自定义间隔配置
 * - 自动从 entity 获取播放器实例
 */
export const useTimeUpdateInterval = (
  config: TimeUpdateIntervalConfig = {}
) => {
  // 🎯 从 entity 获取播放器实例
  const { playerInstance } = useVideoPlayer();
  const player = playerInstance as VideoPlayer | null;
  const {
    enableDynamicAdjustment = true,
    customPlayingInterval = TIME_UPDATE_INTERVALS.PLAYING,
    customBackgroundInterval = TIME_UPDATE_INTERVALS.BACKGROUND_OR_PAUSED,
  } = config;

  // 当前间隔状态跟踪
  const currentIntervalRef = useRef<number>(customPlayingInterval);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * 更新播放器时间更新间隔
   */
  const updatePlayerInterval = (interval: number, reason: string) => {
    if (!player || currentIntervalRef.current === interval) return;

    player.timeUpdateEventInterval = interval;
    currentIntervalRef.current = interval;

    log('video-player', LogType.DEBUG, `Time update interval changed to ${interval * 1000}ms (${reason})`);
  };

  /**
   * 根据播放状态确定合适的间隔
   */
  const getOptimalInterval = (isPlaying: boolean, appState: AppStateStatus): number => {
    // 应用在后台时，使用低频更新
    if (appState !== 'active') {
      return customBackgroundInterval;
    }

    // 根据播放状态选择间隔
    return isPlaying ? customPlayingInterval : customBackgroundInterval;
  };

  /**
   * 应用状态变化监听
   */
  useEffect(() => {
    if (!enableDynamicAdjustment || !player) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const prevAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      // 确定当前播放状态
      const isPlaying = player.playing;
      const optimalInterval = getOptimalInterval(isPlaying, nextAppState);

      // 更新间隔
      updatePlayerInterval(
        optimalInterval,
        `App state: ${prevAppState} → ${nextAppState}, Playing: ${isPlaying}`
      );
    };

    // 订阅应用状态变化
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [player, enableDynamicAdjustment, customPlayingInterval, customBackgroundInterval]);

  /**
   * 播放状态变化监听
   */
  useEffect(() => {
    if (!enableDynamicAdjustment || !player) return;

    const playingSubscription = player.addListener('playingChange', ({ isPlaying }: { isPlaying: boolean }) => {
      const currentAppState = appStateRef.current;
      const optimalInterval = getOptimalInterval(isPlaying, currentAppState);

      updatePlayerInterval(
        optimalInterval,
        `Playing state changed: ${isPlaying}, App state: ${currentAppState}`
      );
    });

    return () => {
      playingSubscription.remove();
    };
  }, [player, enableDynamicAdjustment, customPlayingInterval, customBackgroundInterval]);

  /**
   * 初始化播放器间隔
   */
  useEffect(() => {
    if (!player) return;

    // 设置初始间隔
    const initialInterval = getOptimalInterval(player.playing, AppState.currentState);
    updatePlayerInterval(initialInterval, 'Initial setup');
  }, [player, customPlayingInterval]);

  const setPlayingInterval = useCallback((interval: number) => {
    if (player?.playing && appStateRef.current === 'active') {
      updatePlayerInterval(interval, 'Manual playing interval update');
    }
  }, [player]);

  const setBackgroundInterval = useCallback((interval: number) => {
    if (!player?.playing || appStateRef.current !== 'active') {
      updatePlayerInterval(interval, 'Manual background interval update');
    }
  }, [player]);

  const getRecommendedIntervals = useMemo(() => ({
    playing: customPlayingInterval,
    background: customBackgroundInterval,
  }), [customPlayingInterval, customBackgroundInterval]);

  return useMemo(() => ({
    /** 当前时间更新间隔 */
    currentInterval: currentIntervalRef.current,

    /** 手动设置播放时间隔 */
    setPlayingInterval,

    /** 手动设置后台时间隔 */
    setBackgroundInterval,

    /** 获取推荐的间隔配置 */
    getRecommendedIntervals,
  }), [setPlayingInterval, setBackgroundInterval, getRecommendedIntervals]);
};