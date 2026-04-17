/**
 * Video Meta Entity - Store 实现
 *
 * VideoMetaData 的唯一数据源 (SSOT)
 * 其他 Entity (Feed/History/Favorites) 只存 videoId，使用时从这里读取
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { log, LogType } from '@/shared/lib/logger';
import type { VideoMetaData } from '@/shared/types';
import type { VideoMetaStore } from './types';

/**
 * Video Meta Entity Store
 *
 * 核心职责：
 * 1. 存储所有 VideoMetaData（SSOT）
 * 2. 提供 O(1) 快速查找
 * 3. 支持增删改查操作
 * 4. 记录关键操作日志
 *
 * 性能优化：
 * - 使用 subscribeWithSelector 中间件，只在选择器结果变化时触发重渲染
 */
export const useVideoMetaStore = create<VideoMetaStore>()(
  subscribeWithSelector((set, get) => ({
  videos: new Map(),

  addVideo: (video) => {
    set((state) => {
      const newVideos = new Map(state.videos);
      newVideos.set(video.id, video);

      log('video-meta', LogType.DEBUG, `Added video: ${video.id} - ${video.title}`);

      return { videos: newVideos };
    });
  },

  addVideos: (videos) => {
    if (videos.length === 0) return;

    set((state) => {
      const newVideos = new Map(state.videos);

      videos.forEach(video => {
        newVideos.set(video.id, video);
      });

      log('video-meta', LogType.INFO, `Added ${videos.length} videos to cache`);

      return { videos: newVideos };
    });
  },

  updateVideo: (videoId, updates) => {
    set((state) => {
      const existing = state.videos.get(videoId);

      if (!existing) {
        log('video-meta', LogType.WARNING, `Cannot update non-existent video: ${videoId}`);
        return state;
      }

      const newVideos = new Map(state.videos);
      newVideos.set(videoId, { ...existing, ...updates });

      log('video-meta', LogType.DEBUG,
        `Updated video ${videoId}: ${JSON.stringify(updates)}`
      );

      return { videos: newVideos };
    });
  },

  getVideo: (videoId) => {
    return get().videos.get(videoId) ?? null;
  },

  hasVideo: (videoId) => {
    return get().videos.has(videoId);
  },

  removeVideo: (videoId) => {
    set((state) => {
      const newVideos = new Map(state.videos);
      const deleted = newVideos.delete(videoId);

      if (deleted) {
        log('video-meta', LogType.DEBUG, `Removed video: ${videoId}`);
      }

      return { videos: newVideos };
    });
  },

  clear: () => {
    log('video-meta', LogType.INFO, 'Clearing all video cache');
    set({ videos: new Map() });
  },
})));

/**
 * 开发环境调试工具
 */
if (__DEV__) {
  (globalThis as any).__videoMetaStore = useVideoMetaStore;
  (globalThis as any).__videoMetaDebug = {
    getAll: () => {
      const store = useVideoMetaStore.getState();
      return Array.from(store.videos.entries());
    },
    getVideo: (id: string) => {
      return useVideoMetaStore.getState().getVideo(id);
    },
    count: () => {
      return useVideoMetaStore.getState().videos.size;
    },
    clear: () => {
      useVideoMetaStore.getState().clear();
    },
  };
}
