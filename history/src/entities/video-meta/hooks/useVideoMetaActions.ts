/**
 * Video Meta Entity - Actions Hook
 *
 * 提供便捷的操作方法
 */

import { useVideoMetaStore } from '../model/store';

/**
 * Video Meta 操作 Hook
 *
 * 用法：
 * ```tsx
 * const videoMetaActions = useVideoMetaActions();
 * videoMetaActions.addVideo(video);
 * videoMetaActions.updateVideo(id, { isLiked: true });
 * ```
 */
export function useVideoMetaActions() {
  const store = useVideoMetaStore();

  return {
    addVideo: store.addVideo,
    addVideos: store.addVideos,
    updateVideo: store.updateVideo,
    getVideo: store.getVideo,
    hasVideo: store.hasVideo,
    removeVideo: store.removeVideo,
    clear: store.clear,
  };
}
