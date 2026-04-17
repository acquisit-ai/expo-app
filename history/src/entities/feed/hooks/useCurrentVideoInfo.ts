/**
 * 当前视频信息 Hook
 *
 * 获取当前播放视频的完整信息和控制方法
 */

import { useCallback } from 'react';
import { useFeedStore, feedSelectors } from '../model/store';
import { useVideoMetaStore } from '@/entities/video-meta';

export function useCurrentVideoInfo() {
  // 从 Feed Entity 获取当前视频 ID
  const currentVideoId = useFeedStore(feedSelectors.getCurrentVideoId);

  // 从 Video Meta Entity 获取视频数据
  const currentVideo = useVideoMetaStore(state =>
    currentVideoId ? state.getVideo(currentVideoId) : null
  );

  const currentIndex = useFeedStore(state => state.playback.currentFeedIndex);
  const videoIds = useFeedStore(state => state.videoIds);

  const hasNext = currentIndex < videoIds.length - 1;
  const hasPrevious = currentIndex > 0;

  const goToNext = useCallback(() => {
    if (hasNext) {
      useFeedStore.getState().setCurrentFeedIndex(currentIndex + 1);
    }
  }, [currentIndex, hasNext]);

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      useFeedStore.getState().setCurrentFeedIndex(currentIndex - 1);
    }
  }, [currentIndex, hasPrevious]);

  return {
    video: currentVideo,
    videoId: currentVideoId,
    index: currentIndex,
    hasNext,
    hasPrevious,
    goToNext,
    goToPrevious,
  };
}