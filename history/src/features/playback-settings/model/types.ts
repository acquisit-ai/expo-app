/**
 * Playback Settings Feature Types
 *
 * 播放设置相关的类型定义
 */

/**
 * 播放速度选项
 */
export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

/**
 * 音量级别选项
 */
export type VolumeLevel = 0 | 0.25 | 0.5 | 0.75 | 1;

/**
 * 播放设置配置
 */
export interface PlaybackSettingsConfig {
  /** 可用的播放速度选项 */
  availablePlaybackRates: PlaybackRate[];
  /** 可用的音量级别选项 */
  availableVolumeLevels: VolumeLevel[];
  /** 默认播放速度 */
  defaultPlaybackRate: PlaybackRate;
  /** 默认音量 */
  defaultVolume: VolumeLevel;
}