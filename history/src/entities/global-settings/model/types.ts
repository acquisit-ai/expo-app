/**
 * Global Settings Entity - 类型定义
 *
 * 管理应用级别的全局设置，与具体视频会话无关
 */

/**
 * 播放器实例配置
 * 这些设置需要应用到每个 player instance
 */
export interface PlayerInstanceSettings {
  /** 播放速率（0.5x, 1x, 1.5x, 2x） */
  playbackRate: number;
  /** 静音状态 */
  isMuted: boolean;
  /** 后台继续播放 */
  staysActiveInBackground: boolean;
  /** 画中画自动启动 */
  startsPictureInPictureAutomatically: boolean;
}

/**
 * UI 显示设置
 * 这些设置只影响 UI 渲染
 */
export interface UIDisplaySettings {
  /** 显示字幕 */
  showSubtitles: boolean;
  /** 显示翻译 */
  showTranslation: boolean;
}

/**
 * 全局设置实体状态
 */
export interface GlobalSettingsState {
  playerInstance: PlayerInstanceSettings;
  uiDisplay: UIDisplaySettings;
}

/**
 * 全局设置 Actions
 */
export interface GlobalSettingsActions {
  /** 更新播放器实例设置 */
  updatePlayerInstanceSettings: (updates: Partial<PlayerInstanceSettings>) => void;

  /** 更新 UI 显示设置 */
  updateUIDisplaySettings: (updates: Partial<UIDisplaySettings>) => void;

  /** 重置为默认值 */
  resetToDefaults: () => void;
}

/**
 * 全局设置 Store
 */
export interface GlobalSettingsStore extends GlobalSettingsState, GlobalSettingsActions {}
