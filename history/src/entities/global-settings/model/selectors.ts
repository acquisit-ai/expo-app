/**
 * Global Settings Entity - Selectors
 *
 * 提供细粒度的状态选择器，优化渲染性能
 */

import type { GlobalSettingsStore } from './types';

// === Player Instance Settings ===

export const selectPlayerInstanceSettings = (state: GlobalSettingsStore) =>
  state.playerInstance;

export const selectPlaybackRate = (state: GlobalSettingsStore) =>
  state.playerInstance.playbackRate;

export const selectIsMuted = (state: GlobalSettingsStore) =>
  state.playerInstance.isMuted;

export const selectStaysActiveInBackground = (state: GlobalSettingsStore) =>
  state.playerInstance.staysActiveInBackground;

export const selectStartsPictureInPictureAutomatically = (state: GlobalSettingsStore) =>
  state.playerInstance.startsPictureInPictureAutomatically;

// === UI Display Settings ===

export const selectUIDisplaySettings = (state: GlobalSettingsStore) =>
  state.uiDisplay;

export const selectShowSubtitles = (state: GlobalSettingsStore) =>
  state.uiDisplay.showSubtitles;

export const selectShowTranslation = (state: GlobalSettingsStore) =>
  state.uiDisplay.showTranslation;

// === Actions ===

export const selectUpdatePlayerInstanceSettings = (state: GlobalSettingsStore) =>
  state.updatePlayerInstanceSettings;

export const selectUpdateUIDisplaySettings = (state: GlobalSettingsStore) =>
  state.updateUIDisplaySettings;

export const selectResetToDefaults = (state: GlobalSettingsStore) =>
  state.resetToDefaults;
