/**
 * Video Entity 自动同步 Hook
 *
 * 职责：
 * - 监听 Entity Store 中的 currentPlayerMeta
 * - 自动同步当前活动播放器的事件到 Store
 * - 其他播放器实例不同步（避免状态冲突）
 *
 * 使用场景：
 * - 在 App 根组件调用一次（全局同步）
 * - 确保只有当前活动播放器的事件被同步到全局 Store
 *
 * 架构优势：
 * - 防止多播放器实例状态冲突
 * - Feature 层职责更单一（只负责显示）
 * - Entity 层自己管理状态同步（符合单一职责原则）
 *
 * @example
 * ```tsx
 * // App.tsx
 * export function App() {
 *   useVideoEntitySync();  // 全局同步入口
 *   return <Navigation />;
 * }
 * ```
 */

import { useEffect } from 'react';
import { useVideoStore } from '../model/store';
import { usePlayerEventSync } from './videoview-sync/usePlayerEventSync';
import { useTimeUpdateInterval } from './videoview-sync/useTimeUpdateInterval';
import { useApplyGlobalSettings } from '@/entities/global-settings/hooks/useApplyGlobalSettings';
import { log, LogType } from '@/shared/lib/logger';

/**
 * Video Entity 自动同步 Hook
 *
 * 🎯 核心功能：
 * - 订阅 Store.currentPlayerMeta，响应式获取当前活动播放器
 * - 只对当前活动播放器应用全局设置（playbackRate, muted 等）
 * - 只同步当前活动播放器的事件（statusChange, playingChange, timeUpdate）
 * - 自动管理时间更新间隔（播放/暂停/后台智能调整）
 *
 * ⚠️ 注意：
 * - 整个应用只应调用一次（通常在 App 根组件）
 * - 不要在 Feature 层或 Widget 层调用
 * - currentPlayerMeta 变化时，自动切换同步对象
 *
 * 🎯 性能优化：
 * - 只有当前活动播放器订阅全局设置（避免重复订阅）
 * - 其他非活动播放器实例不订阅
 */
export const useVideoEntitySync = () => {
  // 🎯 订阅当前活动的播放器实例
  // 当 currentPlayerMeta 变化时，这个值会自动更新，触发重新同步
  const currentPlayer = useVideoStore(
    state => state.currentPlayerMeta?.playerInstance ?? null
  );

  // 📊 日志：记录同步对象变化
  useEffect(() => {
    if (currentPlayer) {
      const videoId = useVideoStore.getState().currentPlayerMeta?.videoId;
      log('video-entity-sync', LogType.INFO,
        `Syncing events for current active player: video-${videoId}`);
    } else {
      log('video-entity-sync', LogType.DEBUG,
        'No active player to sync - waiting for video playback');
    }
  }, [currentPlayer]);

  // ✅ 应用全局设置到当前活动播放器
  // 优化：只对当前播放器应用设置，避免重复订阅
  useApplyGlobalSettings(currentPlayer);

  // ✅ 同步当前活动播放器的事件到 Entity Store
  // 当 currentPlayer 变化时，usePlayerEventSync 会：
  // 1. 取消旧播放器的事件监听
  // 2. 设置新播放器的事件监听
  usePlayerEventSync(currentPlayer);

  // ✅ 时间更新间隔管理（应用到当前播放器）
  // 根据播放状态自动调整更新频率：
  // - 播放时: 150ms
  // - 暂停/后台: 1s
  // - 拖拽进度条: 150ms（高优先级）
  useTimeUpdateInterval({
    enableDynamicAdjustment: true
  });
};
