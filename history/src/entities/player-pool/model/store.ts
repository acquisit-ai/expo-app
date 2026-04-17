/**
 * Player Pool Zustand Store（纯 Queue 架构）
 *
 * 管理播放器池的状态，作为唯一的数据源
 * Entity 层负责数据存储和状态管理
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { log, LogType } from '@/shared/lib/logger';
import type { PlayerPoolStore, MainPlayerMeta, AvailablePlayer, PoolMode } from './types';
import { PoolMode as PoolModeEnum } from './types';

/**
 * Player Pool Store 实现（纯 Queue 架构）
 */
export const usePlayerPoolStore = create<PlayerPoolStore>()(
  subscribeWithSelector((set, get) => ({
    // === 状态 ===
    isPoolInitialized: false,
    mainPoolQueue: [],
    availableQueue: [],
    currentMode: PoolModeEnum.FEED_LIST,
    windowStartVideoId: null,  // 🆕 v5.0: 基于 videoId
    pendingLoads: new Set<string>(),
    isClearingAvailablePool: false,
    isExtendingWindow: false,

    // === Actions ===

    /**
     * 设置池初始化状态
     */
    setPoolInitialized: (value: boolean) => {
      set({ isPoolInitialized: value });
      log('player-pool-store', LogType.INFO, `Pool initialized: ${value}`);
    },

    /**
     * 更新主池队列
     */
    updateMainQueue: (queue: MainPlayerMeta[]) => {
      set({ mainPoolQueue: queue });
      log('player-pool-store', LogType.DEBUG,
        `Main queue updated: ${queue.length} items`);
    },

    /**
     * 更新 Available 池队列
     */
    updateAvailableQueue: (queue: AvailablePlayer[]) => {
      set({ availableQueue: queue });
      log('player-pool-store', LogType.DEBUG,
        `Available queue updated: ${queue.length} items`);
    },

    /**
     * 设置模式
     */
    setMode: (mode: PoolMode) => {
      set({ currentMode: mode });
      log('player-pool-store', LogType.INFO, `Mode changed: ${mode}`);
    },

    /**
     * 添加待加载视频
     */
    addPendingLoad: (videoId: string) => {
      set((state) => {
        const newSet = new Set(state.pendingLoads);
        newSet.add(videoId);
        return { pendingLoads: newSet };
      });
      log('player-pool-store', LogType.DEBUG, `Added to pending loads: ${videoId}`);
    },

    /**
     * 移除待加载视频
     */
    removePendingLoad: (videoId: string) => {
      set((state) => {
        const newSet = new Set(state.pendingLoads);
        newSet.delete(videoId);
        return { pendingLoads: newSet };
      });
      log('player-pool-store', LogType.DEBUG, `Removed from pending loads: ${videoId}`);
    },

    /**
     * 清空待加载队列
     */
    clearPendingLoads: () => {
      set({ pendingLoads: new Set() });
      log('player-pool-store', LogType.DEBUG, 'Pending loads cleared');
    },

    /**
     * 设置 Available 池清理标志
     */
    setIsClearingAvailablePool: (value: boolean) => {
      set({ isClearingAvailablePool: value });
      log('player-pool-store', LogType.DEBUG, `Clearing available pool: ${value}`);
    },

    /**
     * 设置窗口扩展标志
     */
    setIsExtendingWindow: (value: boolean) => {
      set({ isExtendingWindow: value });
      log('player-pool-store', LogType.DEBUG, `Window extending: ${value}`);
    },

    /**
     * 🆕 v5.0: 设置窗口起始视频 ID
     */
    setWindowStartVideoId: (videoId: string | null) => {
      set({ windowStartVideoId: videoId });
      log('player-pool-store', LogType.DEBUG, `Window start video ID: ${videoId}`);
    },

    /**
     * 🆕 v6.0: 原子更新窗口状态（窗口扩展专用，防止闪烁）
     *
     * 🔑 关键：一次性更新所有相关状态，避免中间状态导致的闪烁
     * - 完全基于 videoId，Feed 裁剪不影响
     */
    updateWindowState: (update) => {
      const newState: Partial<PlayerPoolStore> = {
        mainPoolQueue: update.mainQueue,
        availableQueue: update.availableQueue,
        windowStartVideoId: update.windowStartVideoId,
      };

      // 如果提供了 isExtendingWindow，一起原子更新
      if (update.isExtendingWindow !== undefined) {
        newState.isExtendingWindow = update.isExtendingWindow;
      }

      set(newState);

      log('player-pool-store', LogType.INFO,
        `Window state updated atomically: ${update.mainQueue.length} videos, ` +
        `startVideoId: ${update.windowStartVideoId}` +
        (update.isExtendingWindow !== undefined ? `, extending: ${update.isExtendingWindow}` : ''));
    },

    /**
     * 重置池
     * 应用退出或重新初始化时调用
     */
    resetPool: () => {
      log('player-pool-store', LogType.DEBUG, 'Resetting pool store');

      set({
        isPoolInitialized: false,
        mainPoolQueue: [],
        availableQueue: [],
        currentMode: PoolModeEnum.FEED_LIST,
        windowStartVideoId: null,
        pendingLoads: new Set(),
        isClearingAvailablePool: false,
        isExtendingWindow: false,
      });
    },
  }))
);

/**
 * Pool Store 选择器
 * 提供便捷的状态选择方法，优化组件性能
 */
export const playerPoolSelectors = {
  /** 池是否已初始化 */
  isPoolReady: (state: PlayerPoolStore): boolean =>
    state.isPoolInitialized,

  /** 获取主池队列 */
  getMainQueue: (state: PlayerPoolStore): MainPlayerMeta[] =>
    state.mainPoolQueue,

  /** 获取 Available 池队列 */
  getAvailableQueue: (state: PlayerPoolStore): AvailablePlayer[] =>
    state.availableQueue,

  /** 获取当前模式 */
  getCurrentMode: (state: PlayerPoolStore): PoolMode =>
    state.currentMode,

  /** 获取窗口视频ID列表（ScrollView 用） */
  getWindowVideoIds: (state: PlayerPoolStore): string[] =>
    state.mainPoolQueue.map(m => m.videoId),

  /** 获取播放器实例（O(n) 查找） */
  getPlayer: (state: PlayerPoolStore, videoId: string) =>
    state.mainPoolQueue.find(m => m.videoId === videoId)?.playerInstance || null,

  /** 检查视频是否在池中（O(n)） */
  hasVideo: (state: PlayerPoolStore, videoId: string): boolean =>
    state.mainPoolQueue.some(m => m.videoId === videoId) ||
    state.availableQueue.some(p => p.loadingVideoId === videoId),

  // 🆕 v5.0: 基于 videoId 的动态索引计算

  /** 获取窗口起始索引（基于 windowStartVideoId 动态计算，O(n)） */
  getWindowStartIndex: (state: PlayerPoolStore): number => {
    if (!state.windowStartVideoId) {
      return 0;
    }

    // 动态从 Feed 中查找
    const { useFeedStore } = require('@/entities/feed');
    const feedVideoIds = useFeedStore.getState().videoIds;
    const index = feedVideoIds.indexOf(state.windowStartVideoId);

    // 找不到说明被裁剪了，返回 -1 触发降级处理
    return index >= 0 ? index : -1;
  },
};

/**
 * 开发环境调试
 */
if (__DEV__) {
  // 暴露 store 到全局，方便调试
  (globalThis as any).__playerPoolStore = usePlayerPoolStore;

  // 监听队列变化
  usePlayerPoolStore.subscribe(
    (state) => state.mainPoolQueue.length,
    (length) => {
      console.debug('[PlayerPool] Main queue length:', length);
    }
  );

  // 监听初始化状态
  usePlayerPoolStore.subscribe(
    (state) => state.isPoolInitialized,
    (isInitialized) => {
      console.debug('[PlayerPool] Initialized:', isInitialized);
    }
  );
}
