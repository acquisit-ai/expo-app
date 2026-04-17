/**
 * Feed Entity Store
 *
 * 基于 Zustand 的 Feed 状态管理
 * 纯状态管理，不包含数据获取逻辑
 * Feature 获取数据 → Entity 存储
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { log, LogType } from '@/shared/lib/logger';
import type {
  FeedStore,
  FeedLoadingState,
  FeedPlaybackState
} from './types';

/**
 * 初始加载状态
 */
const initialLoadingState: FeedLoadingState = {
  isLoading: false,
  error: null,
  loadingType: null,
};

/**
 * 初始播放状态
 */
const initialPlaybackState: FeedPlaybackState = {
  currentFeedIndex: 0,
  visibleIndexes: [],
};

/**
 * Feed Store 实现
 * 纯状态管理，Feature 调用这些方法来存储数据
 */
export const useFeedStore = create<FeedStore>()(
  subscribeWithSelector((set, get) => ({
    // ===== 初始状态 =====
    videoIds: [],
    videoIdSet: new Set<string>(),
    loading: initialLoadingState,
    playback: initialPlaybackState,

    // ===== 状态重置 =====
    resetFeed: () => {
      log('feed-store', LogType.INFO, 'Resetting feed');

      set({
        videoIds: [],
        videoIdSet: new Set<string>(),
        loading: initialLoadingState,
        playback: initialPlaybackState,
      });
    },

    // ===== 播放控制方法 =====
    setCurrentFeedIndex: (index: number) => {
      const state = get();

      if (index === state.playback.currentFeedIndex) {
        return; // 无变化，不更新
      }

      if (index < 0 || index >= state.videoIds.length) {
        log('feed-store', LogType.WARNING, `Invalid feed index: ${index}, videoIds length: ${state.videoIds.length}`);
        return;
      }

      log('feed-store', LogType.DEBUG, `Setting current feed index: ${index}`);

      set((state) => ({
        playback: {
          ...state.playback,
          currentFeedIndex: index,
        },
      }));
    },

    updateVisibleIndexes: (indexes: number[]) => {
      set((state) => ({
        playback: {
          ...state.playback,
          visibleIndexes: indexes,
        },
      }));
    },

    // ===== 滑动窗口方法 =====
    appendVideoIds: (ids: string[]) => {
      if (ids.length === 0) {
        // 即使没有新数据，也要清除加载状态
        set((state) => ({
          loading: { ...state.loading, isLoading: false, loadingType: null },
        }));
        return;
      }

      set((state) => {
        // 🆕 去重：过滤掉已存在于 Feed 中的视频 ID
        const uniqueIds = ids.filter(id => !state.videoIdSet.has(id));

        if (uniqueIds.length === 0) {
          log('feed-store', LogType.DEBUG,
            `All ${ids.length} video IDs are duplicates, skipping append`
          );
          return state; // 全部重复，不更新状态
        }

        const updatedIds = [...state.videoIds, ...uniqueIds];
        const updatedSet = new Set([...state.videoIdSet, ...uniqueIds]);

        log('feed-store', LogType.DEBUG,
          `Appending ${ids.length} video IDs: ${uniqueIds.length} unique, ${ids.length - uniqueIds.length} duplicates filtered. Total: ${updatedIds.length}`
        );

        return {
          videoIds: updatedIds,
          videoIdSet: updatedSet,
          // 不在这里清除 isLoading，等待数据处理完成
        };
      });

      // 维护窗口大小，处理完成后才清除加载状态
      get().maintainWindowSize();

      // 延迟清除加载状态，等待 maintainVisibleContentPosition 完成滚动调整
      // 解决 React Native 异步滚动调整与 onEndReached 检测的时序竞争问题
      setTimeout(() => {
        set((state) => ({
          loading: { ...state.loading, isLoading: false, loadingType: null },
        }));
        log('feed-store', LogType.DEBUG, 'Loading state cleared after scroll adjustment delay');
      }, 150); // 给 React Native 足够时间完成滚动位置调整
    },

    maintainWindowSize: () => {
      const state = get();
      const MAX_SIZE = 500; // FEED_CONSTANTS.MAX_FEED_SIZE

      if (state.videoIds.length <= MAX_SIZE) {
        return; // 无需裁剪
      }

      const itemsToRemove = state.videoIds.length - MAX_SIZE;
      const newIds = state.videoIds.slice(itemsToRemove); // 保留最新的MAX_SIZE条
      const newSet = new Set(newIds); // 🆕 重建 Set

      log('feed-store', LogType.INFO,
        `Maintaining window size: removed ${itemsToRemove} items. ` +
        `maintainVisibleContentPosition will handle scroll position and onViewableItemsChanged will update indexes.`
      );

      set({
        videoIds: newIds,
        videoIdSet: newSet, // 🆕 同步更新 Set
        // 移除手动索引调整，让 maintainVisibleContentPosition 和 onViewableItemsChanged 自然处理
      });
    },

    // ===== 状态管理方法 =====
    setLoading: (isLoading: boolean, type?: 'refresh' | 'loadMore') => {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading,
          loadingType: isLoading ? (type || 'initial') : null,
        },
      }));
    },

    setError: (error: string | null) => {
      set((state) => ({
        loading: {
          ...state.loading,
          error,
          isLoading: false, // 出错时停止加载
          loadingType: null, // 清除加载类型
        },
      }));
    },

    clearError: () => {
      set((state) => ({
        loading: {
          ...state.loading,
          error: null,
        },
      }));
    },

    // ===== 辅助方法 =====
    /**
     * 获取当前播放的视频 ID
     */
    getCurrentVideoId: () => {
      const state = get();
      return state.videoIds[state.playback.currentFeedIndex] ?? null;
    },
  }))
);

/**
 * Feed Store 选择器
 * 提供便捷的状态选择方法，优化组件性能
 */
export const feedSelectors = {
  /** 获取当前播放的视频 ID */
  getCurrentVideoId: (state: FeedStore): string | null => {
    const { videoIds, playback } = state;
    return videoIds[playback.currentFeedIndex] || null;
  },

  /** 获取 Feed 视频 ID 列表 */
  getVideoIds: (state: FeedStore): string[] => state.videoIds,

  /** 获取加载状态 */
  getLoadingState: (state: FeedStore): FeedLoadingState => state.loading,

  /** 获取播放状态 */
  getPlaybackState: (state: FeedStore): FeedPlaybackState => state.playback,

  /** 检查是否可以加载更多 */
  canLoadMore: (state: FeedStore): boolean => {
    const { loading } = state;
    return !loading.isLoading;
  },
};

