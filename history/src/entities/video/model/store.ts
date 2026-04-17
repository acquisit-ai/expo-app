/**
 * 视频实体的状态管理
 * 使用 Zustand 管理当前播放会话的视频状态
 *
 * ⚠️ 重构说明（方案A）：
 * - 使用 PlayerMeta 确保 videoId 和 player 绑定
 * - VideoMetaData 从 Video Meta Entity 获取
 *
 * 性能优化：
 * - 使用 subscribeWithSelector 中间件，只在选择器结果变化时触发重渲染
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { log, LogType } from '@/shared/lib/logger';
import type {
  VideoStore,
  VideoEntityState,
  VideoPlaybackState,
  VideoPlaybackContext,
} from './types';

/**
 * 初始播放状态
 * 通过定时器从播放器实例同步更新
 *
 * 注意：
 * - 播放设置已移至 global-settings entity
 * - ❌ isPlaying 不在此管理，使用 usePlayerPlaying Hook 直接监听
 * - ❌ isPlayerReady 不在此管理，使用 usePlayerReadyState Hook 直接监听
 */
const initialPlaybackState: VideoPlaybackState = {
  currentTime: 0,
  bufferedTime: 0,
};

// 注意：动画状态 SharedValues 已移到页面层本地管理
// isPlayingShared 和 isPlayAnimatingShared 现在由页面组件创建并传递

/**
 * 视频实体的 Zustand Store
 * 专注于当前播放会话的状态管理，不涉及持久化
 */
export const useVideoStore = create<VideoStore>()(
  subscribeWithSelector((set, get) => ({
    // === 状态 ===
    currentPlayerMeta: null,
    playback: initialPlaybackState,
    playbackContext: null,

    // === Actions ===

    /**
     * 设置当前播放器元数据
     * 切换视频时会重置所有播放和会话状态
     *
     * ⚠️ 注意：不在此直接读取播放器状态，完全依赖 usePlayerEventSync 同步
     */
    setCurrentPlayerMeta: (meta, context) => {
      const oldMeta = get().currentPlayerMeta;

      // 🔑 关键：暂停旧视频，但不重置进度（保留播放位置）
      if (oldMeta?.playerInstance && oldMeta.videoId !== meta.videoId) {
        log('video-entity', LogType.INFO, `Pausing old video: ${oldMeta.videoId}`);
        oldMeta.playerInstance.pause();
      }

      log('video-entity', LogType.INFO, `Setting current video: ${meta.videoId} (context: ${context})`);

      set({
        currentPlayerMeta: meta,
        // ✅ 重置为初始状态，由 usePlayerEventSync 负责同步实际状态
        playback: initialPlaybackState,
        playbackContext: context,
      });

      // ✅ 立即同步一次播放器状态，避免等待第一个事件导致的闪烁
      // 这样保持了单一数据源（通过 updatePlayback），只是手动触发一次
      if (meta.playerInstance) {
        const currentTime = meta.playerInstance.currentTime ?? 0;
        // 使用 updatePlayback 保持一致性
        get().updatePlayback({ currentTime });
      }
    },

    /**
     * 清除当前视频
     * 通常在离开视频页面时调用
     */
    clearCurrentVideo: () => {
      const currentMeta = get().currentPlayerMeta;

      if (currentMeta?.videoId) {
        log('video-entity', LogType.INFO, `Clearing current video: ${currentMeta.videoId}`);
      }

      set({
        currentPlayerMeta: null,
        playback: initialPlaybackState,
        playbackContext: null,
      });
    },

    /**
     * 更新播放状态（带防重复机制）
     */
    updatePlayback: (updates: Partial<VideoPlaybackState>) => {
      const currentState = get();
      const currentMeta = currentState.currentPlayerMeta;

      if (!currentMeta?.videoId) {
        log('video-entity', LogType.WARNING, 'Attempted to update playback state without current video');
        return;
      }

      // 检查是否有实际变化，避免不必要的更新和日志
      const hasChanges = Object.entries(updates).some(([key, value]) => {
        const currentValue = currentState.playback[key as keyof VideoPlaybackState];
        return currentValue !== value;
      });

      if (!hasChanges) {
        // 没有实际变化，跳过更新
        return;
      }

      set(state => ({
        playback: { ...state.playback, ...updates }
      }));

      // 只在有实际变化时记录日志
      log('video-entity', LogType.DEBUG, `Playback state updated: ${JSON.stringify(updates)}`);
    },

    /**
     * 设置播放上下文
     * 仅在特殊场景下使用（例如独立播放器模式中的导航守卫）
     */
    setPlaybackContext: (context: VideoPlaybackContext) => {
      log('video-entity', LogType.DEBUG, `Playback context updated: ${context}`);
      set({
        playbackContext: context,
      });
    },


    // === 播放器管理 ===
    // 🎯 播放器实例由 Player Pool 管理
    // 🎯 VideoMetaData 由 Video Meta Entity 管理
    // Store 只存储 currentVideoId 和 currentPlayer 引用
  })));

/**
 * 开发环境下的调试工具
 */
if (__DEV__) {
  // 在开发环境下暴露 store 到全局，方便调试
  (globalThis as any).__videoStore = useVideoStore;
}
