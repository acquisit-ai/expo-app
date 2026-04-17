/**
 * Global Settings Entity - 统一导出
 *
 * 管理应用级别的全局设置：
 * - 播放器实例配置（playbackRate, isMuted, etc.）
 * - UI 显示设置（showSubtitles, showTranslation）
 *
 * 使用示例：
 * ```tsx
 * import { useGlobalSettings, selectIsMuted, selectUpdatePlayerInstanceSettings } from '@/entities/global-settings';
 *
 * const isMuted = useGlobalSettings(selectIsMuted);
 * const updateSettings = useGlobalSettings(selectUpdatePlayerInstanceSettings);
 *
 * updateSettings({ isMuted: true }); // 自动同步到当前 player
 * ```
 */

// === 核心类型 ===
export type {
  PlayerInstanceSettings,
  UIDisplaySettings,
  GlobalSettingsState,
  GlobalSettingsActions,
  GlobalSettingsStore,
} from './model/types';

// === Store ===
export { useGlobalSettings } from './model/store';

// === Selectors ===
export {
  // Player Instance Settings
  selectPlayerInstanceSettings,
  selectPlaybackRate,
  selectIsMuted,
  selectStaysActiveInBackground,
  selectStartsPictureInPictureAutomatically,

  // UI Display Settings
  selectUIDisplaySettings,
  selectShowSubtitles,
  selectShowTranslation,

  // Actions
  selectUpdatePlayerInstanceSettings,
  selectUpdateUIDisplaySettings,
  selectResetToDefaults,
} from './model/selectors';

// === 默认值 ===
export {
  DEFAULT_PLAYER_INSTANCE_SETTINGS,
  DEFAULT_UI_DISPLAY_SETTINGS,
} from './model/defaults';
