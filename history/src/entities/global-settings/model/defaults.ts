/**
 * Global Settings Entity - 默认值
 */

import type { PlayerInstanceSettings, UIDisplaySettings } from './types';

/**
 * 播放器实例默认设置
 */
export const DEFAULT_PLAYER_INSTANCE_SETTINGS: PlayerInstanceSettings = {
  playbackRate: 1.0,
  isMuted: false,
  staysActiveInBackground: false,
  startsPictureInPictureAutomatically: false,
};

/**
 * UI 显示默认设置
 */
export const DEFAULT_UI_DISPLAY_SETTINGS: UIDisplaySettings = {
  showSubtitles: true,
  showTranslation: false,
};
