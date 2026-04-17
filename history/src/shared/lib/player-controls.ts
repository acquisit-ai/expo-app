/**
 * 播放器控制工具函数
 * 提供统一的播放器实例操作方法，包含错误处理
 */

import type { VideoPlayer } from 'expo-video';

/**
 * 播放视频
 */
export const playVideo = (player: VideoPlayer | null | undefined): void => {
  if (player) {
    try {
      player.play();
    } catch (error) {
      console.warn('Failed to play, player might be disposed:', error);
    }
  }
};

/**
 * 暂停视频
 */
export const pauseVideo = (player: VideoPlayer | null | undefined): void => {
  if (player) {
    try {
      player.pause();
    } catch (error) {
      console.warn('Failed to pause, player might be disposed:', error);
    }
  }
};

/**
 * 切换播放/暂停状态
 */
export const togglePlayVideo = (player: VideoPlayer | null | undefined): void => {
  if (player?.playing) {
    pauseVideo(player);
  } else {
    playVideo(player);
  }
};

/**
 * 跳转到指定时间
 * @param player 播放器实例
 * @param time 目标时间（秒）
 */
export const seekVideo = (player: VideoPlayer | null | undefined, time: number): void => {
  if (player) {
    try {
      player.currentTime = Math.max(0, time);
    } catch (error) {
      console.warn('Failed to seek, player might be disposed:', error);
    }
  }
};

/**
 * 相对跳转（向前或向后）
 * @param player 播放器实例
 * @param delta 时间偏移量（秒，正数向前，负数向后）
 */
export const seekVideoRelative = (player: VideoPlayer | null | undefined, delta: number): void => {
  if (player) {
    const currentTime = player.currentTime ?? 0;
    const newTime = Math.max(0, currentTime + delta);
    seekVideo(player, newTime);
  }
};

/**
 * 设置音量
 * @param player 播放器实例
 * @param volume 音量值（0-1）
 */
export const setVideoVolume = (player: VideoPlayer | null | undefined, volume: number): void => {
  if (player) {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      player.volume = clampedVolume;
    } catch (error) {
      console.warn('Failed to set volume, player might be disposed:', error);
    }
  }
};
