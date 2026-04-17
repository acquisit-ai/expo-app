import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useVideoMetaStore } from '@/entities/video-meta';
import { useGlobalSettings, selectShowSubtitles, selectShowTranslation, selectUpdateUIDisplaySettings } from '@/entities/global-settings';
import { syncFavoriteMockState } from '@/features/favorites-fetching/api/favorites-mock-store';
import { isDevelopment } from '@/shared/config/environment';

interface VideoInteractionContextValue {
  // 交互状态
  isLiked: boolean;
  isFavorited: boolean;
  showSubtitles: boolean;
  showTranslation: boolean;

  // 交互方法
  toggleLike: () => void;
  toggleFavorite: () => void;
  toggleSubtitles: () => void;
  toggleTranslation: () => void;
}

const VideoInteractionContext = createContext<VideoInteractionContextValue | undefined>(undefined);

export const VideoInteractionProvider: React.FC<{
  videoId: string; // ✅ 接收 videoId prop，解耦活跃视频判断
  children: ReactNode;
}> = ({ videoId, children }) => {
  // ❌ 删除：不再订阅 currentVideoId
  // const currentVideoId = useVideoStore(selectCurrentVideoId);

  // 从 Video Meta Entity 获取视频数据
  const videoMetadata = useVideoMetaStore(state =>
    videoId ? state.getVideo(videoId) : null
  );

  // 订阅全局设置
  const showSubtitles = useGlobalSettings(selectShowSubtitles);
  const showTranslation = useGlobalSettings(selectShowTranslation);
  const updateUIDisplaySettings = useGlobalSettings(selectUpdateUIDisplaySettings);

  // 创建稳定的 toggle 方法 - 直接更新 Video Meta Entity
  const toggleLike = useCallback(() => {
    if (!videoId || !videoMetadata) return;

    const videoMetaStore = useVideoMetaStore.getState();
    videoMetaStore.updateVideo(videoId, {
      isLiked: !videoMetadata.isLiked
    });
  }, [videoId, videoMetadata]);

  const toggleFavorite = useCallback(() => {
    if (!videoId || !videoMetadata) return;

    const videoMetaStore = useVideoMetaStore.getState();
    const nextIsFavorited = !videoMetadata.isFavorited;

    videoMetaStore.updateVideo(videoId, {
      isFavorited: nextIsFavorited
    });

    if (isDevelopment()) {
      syncFavoriteMockState(videoId, nextIsFavorited);
    }
  }, [videoId, videoMetadata]);

  const toggleSubtitles = useCallback(() => updateUIDisplaySettings({ showSubtitles: !showSubtitles }), [updateUIDisplaySettings, showSubtitles]);
  const toggleTranslation = useCallback(() => updateUIDisplaySettings({ showTranslation: !showTranslation }), [updateUIDisplaySettings, showTranslation]);

  const value = useMemo(() => ({
    // 状态
    isLiked: videoMetadata?.isLiked ?? false,
    isFavorited: videoMetadata?.isFavorited ?? false,
    showSubtitles,
    showTranslation,
    // 方法
    toggleLike,
    toggleFavorite,
    toggleSubtitles,
    toggleTranslation,
  }), [
    videoMetadata,
    showSubtitles,
    showTranslation,
    toggleLike,
    toggleFavorite,
    toggleSubtitles,
    toggleTranslation,
  ]);

  return (
    <VideoInteractionContext.Provider value={value}>
      {children}
    </VideoInteractionContext.Provider>
  );
};

export const useVideoInteraction = () => {
  const context = useContext(VideoInteractionContext);
  if (!context) {
    throw new Error('useVideoInteraction must be used within a VideoInteractionProvider');
  }
  return context;
};
