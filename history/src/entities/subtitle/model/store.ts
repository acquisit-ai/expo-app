/**
 * 字幕实体状态存储
 *
 * 职责：
 * - 管理所有字幕数据的生命周期
 * - 提供高性能的状态访问
 * - 处理多视频的字幕切换
 * - 优化内存使用和搜索性能
 *
 * 性能优化：
 * - 使用 subscribeWithSelector 中间件，只在选择器结果变化时触发重渲染
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SubtitleJson } from './subtitle';
import { log, LogType } from '@/shared/lib/logger';


/**
 * 字幕实体状态
 *
 * 重构说明：完全移除缓存机制，专注于纯数据管理
 * 搜索操作直接使用高效的二分搜索算法，无需缓存优化
 */
export interface SubtitleEntityState {
  // 核心数据
  subtitles: Map<string, SubtitleJson>;
  currentSubtitle: SubtitleJson | null;
  activeVideoId: string | null;

  // 索引指针优化
  currentIndex: number;

  // 加载状态
  isLoading: boolean;
  loadingVideoId: string | null;
}

/**
 * 字幕操作接口
 *
 * 重构说明：完全移除缓存相关方法，专注于纯数据管理
 * 搜索操作通过纯函数实现，无状态，高性能
 */
export interface SubtitleActions {
  // 数据管理
  storeSubtitle: (videoId: string, subtitle: SubtitleJson) => void;
  setActiveSubtitle: (videoId: string) => void;
  clearSubtitle: (videoId?: string) => void;
  clearActiveSubtitle: () => void;

  // 索引管理
  updateCurrentIndex: (index: number) => void;

  // 加载状态管理
  setLoading: (videoId: string) => void;
  clearLoading: () => void;
}

/**
 * 字幕状态存储 (无持久化版本)
 */
export const useSubtitleStore = create<SubtitleEntityState & SubtitleActions>()(
  subscribeWithSelector((set, get) => ({
  // === 初始状态 ===
  subtitles: new Map(),
  currentSubtitle: null,
  activeVideoId: null,
  currentIndex: 0,
  isLoading: false,
  loadingVideoId: null,

  // === 核心操作 ===

  /**
   * 存储字幕数据
   * 注意：现在只接收完全处理好的 SubtitleJson
   * @param videoId 视频ID
   * @param subtitle 完全处理后的字幕数据
   */
  storeSubtitle: (videoId: string, subtitle: SubtitleJson) => {
    set((state) => {
      const newSubtitles = new Map(state.subtitles);
      newSubtitles.set(videoId, subtitle);

      // 如果是当前活跃视频，同时更新当前字幕
      const updates: Partial<SubtitleEntityState> = {
        subtitles: newSubtitles
      };

      if (state.activeVideoId === videoId) {
        updates.currentSubtitle = subtitle;
        // 重置索引指针
        updates.currentIndex = 0;
      }

      return updates;
    });

    log('subtitle-entity', LogType.INFO, `Stored subtitle for video ${videoId} - ${subtitle.sentences.length} sentences`);
  },

  /**
   * 设置活跃字幕
   * @param videoId 视频ID
   */
  setActiveSubtitle: (videoId: string) => {
    const subtitle = get().subtitles.get(videoId);

    set({
      activeVideoId: videoId,
      currentSubtitle: subtitle || null,
      currentIndex: 0  // 重置索引指针
    });

    log('subtitle-entity', LogType.DEBUG, `Activated subtitle for video ${videoId}`);
  },

  /**
   * 清除当前激活字幕但保留已缓存数据
   */
  clearActiveSubtitle: () => {
    set({
      activeVideoId: null,
      currentSubtitle: null,
      currentIndex: 0,
    });

    log('subtitle-entity', LogType.DEBUG, 'Cleared active subtitle pointer');
  },


  /**
   * 清除字幕数据
   * @param videoId 视频ID，不传则清除所有
   */
  clearSubtitle: (videoId?: string) => {
    if (videoId) {
      set((state) => {
        const newSubtitles = new Map(state.subtitles);
        newSubtitles.delete(videoId);

        const updates: Partial<SubtitleEntityState> = {
          subtitles: newSubtitles
        };

        // 如果清除的是当前活跃字幕
        if (state.activeVideoId === videoId) {
          updates.currentSubtitle = null;
          updates.activeVideoId = null;
          updates.currentIndex = 0;
        }

        return updates;
      });
    } else {
      // 清除所有字幕
      set({
        subtitles: new Map(),
        currentSubtitle: null,
        activeVideoId: null,
        currentIndex: 0
      });
    }

    log('subtitle-entity', LogType.INFO, `Cleared subtitle${videoId ? ` for ${videoId}` : 's'}`);
  },

  /**
   * 更新当前索引指针
   * @param index 新的索引位置
   */
  updateCurrentIndex: (index: number) => {
    set({ currentIndex: index });
  },

  /**
   * 设置加载状态
   * @param videoId 正在加载的视频ID
   */
  setLoading: (videoId: string) => {
    set({
      isLoading: true,
      loadingVideoId: videoId
    });
    log('subtitle-entity', LogType.DEBUG, `Loading subtitle for: ${videoId}`);
  },

  /**
   * 清除加载状态
   */
  clearLoading: () => {
    const videoId = get().loadingVideoId;
    set({
      isLoading: false,
      loadingVideoId: null
    });
    if (videoId) {
      log('subtitle-entity', LogType.DEBUG, `Cleared loading state for: ${videoId}`);
    }
  }

})));
