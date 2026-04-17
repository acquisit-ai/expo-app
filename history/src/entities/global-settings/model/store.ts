/**
 * Global Settings Entity - Zustand Store
 *
 * 管理应用级别的全局设置
 * - 内存存储，app 启动时初始化默认值
 * - 修改设置时自动同步到当前播放器实例
 *
 * 性能优化：
 * - 使用 subscribeWithSelector 中间件，只在选择器结果变化时触发重渲染
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { VideoPlayer } from 'expo-video';
import { log, LogType } from '@/shared/lib/logger';
import type {
  GlobalSettingsStore,
  PlayerInstanceSettings,
  UIDisplaySettings,
} from './types';
import { DEFAULT_PLAYER_INSTANCE_SETTINGS, DEFAULT_UI_DISPLAY_SETTINGS } from './defaults';

export const useGlobalSettings = create<GlobalSettingsStore>()(
  subscribeWithSelector((set, get) => ({
  // === 状态 ===
  playerInstance: DEFAULT_PLAYER_INSTANCE_SETTINGS,
  uiDisplay: DEFAULT_UI_DISPLAY_SETTINGS,

  // === Actions ===

  /**
   * 更新播放器实例设置
   *
   * 注意：此方法只负责更新配置存储
   * 配置的应用由 video entity 通过监听实现（单向依赖）
   */
  updatePlayerInstanceSettings: (updates) => {
    const validated = { ...updates };

    // 验证并修正 playbackRate（支持范围：0.25x - 4x）
    if ('playbackRate' in updates) {
      const rate = updates.playbackRate!;
      if (rate < 0.25 || rate > 4) {
        const clampedRate = Math.max(0.25, Math.min(4, rate));
        log('global-settings', LogType.WARNING,
          `Invalid playbackRate: ${rate}, clamped to ${clampedRate}`
        );
        validated.playbackRate = clampedRate;
      }
    }

    // 验证 isMuted（必须为布尔值）
    if ('isMuted' in updates && typeof updates.isMuted !== 'boolean') {
      log('global-settings', LogType.WARNING,
        `Invalid isMuted value: ${updates.isMuted}, using false`
      );
      validated.isMuted = false;
    }

    // 验证 staysActiveInBackground（必须为布尔值）
    if ('staysActiveInBackground' in updates && typeof updates.staysActiveInBackground !== 'boolean') {
      log('global-settings', LogType.WARNING,
        `Invalid staysActiveInBackground value: ${updates.staysActiveInBackground}, using false`
      );
      validated.staysActiveInBackground = false;
    }

    // 验证 startsPictureInPictureAutomatically（必须为布尔值）
    if ('startsPictureInPictureAutomatically' in updates && typeof updates.startsPictureInPictureAutomatically !== 'boolean') {
      log('global-settings', LogType.WARNING,
        `Invalid startsPictureInPictureAutomatically value: ${updates.startsPictureInPictureAutomatically}, using false`
      );
      validated.startsPictureInPictureAutomatically = false;
    }

    set(state => ({
      playerInstance: { ...state.playerInstance, ...validated }
    }));

    log('global-settings', LogType.INFO,
      `Player instance settings updated: ${JSON.stringify(validated)}`);
  },

  /**
   * 更新 UI 显示设置
   */
  updateUIDisplaySettings: (updates) => {
    const validated = { ...updates };

    // 验证 showSubtitles（必须为布尔值）
    if ('showSubtitles' in updates && typeof updates.showSubtitles !== 'boolean') {
      log('global-settings', LogType.WARNING,
        `Invalid showSubtitles value: ${updates.showSubtitles}, using false`
      );
      validated.showSubtitles = false;
    }

    // 验证 showTranslation（必须为布尔值）
    if ('showTranslation' in updates && typeof updates.showTranslation !== 'boolean') {
      log('global-settings', LogType.WARNING,
        `Invalid showTranslation value: ${updates.showTranslation}, using false`
      );
      validated.showTranslation = false;
    }

    set(state => ({
      uiDisplay: { ...state.uiDisplay, ...validated }
    }));

    log('global-settings', LogType.DEBUG,
      `UI display settings updated: ${JSON.stringify(validated)}`);
  },

  /**
   * 重置为默认值
   */
  resetToDefaults: () => {
    set({
      playerInstance: DEFAULT_PLAYER_INSTANCE_SETTINGS,
      uiDisplay: DEFAULT_UI_DISPLAY_SETTINGS,
    });

    log('global-settings', LogType.INFO, 'Settings reset to defaults');
  },
})));

/**
 * 开发环境调试
 */
if (__DEV__) {
  (globalThis as any).__globalSettings = useGlobalSettings;
}
