import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useVideoStore, selectCurrentVideoId } from '@/entities/video';
import { useVideoMetaStore } from '@/entities/video-meta';
import type { VideoMetaData } from '@/shared/types';

interface VideoInfoDisplayContextValue {
  // 视频数据
  videoMetadata: VideoMetaData | null;
}

const VideoInfoDisplayContext = createContext<VideoInfoDisplayContextValue | undefined>(undefined);

export const VideoInfoDisplayProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // Feature层统一获取Entity数据 - 专注信息展示
  const currentVideoId = useVideoStore(selectCurrentVideoId);
  const videoMetadata = useVideoMetaStore(state =>
    currentVideoId ? state.getVideo(currentVideoId) : null
  );

  const value = useMemo(() => ({
    // 数据
    videoMetadata,
  }), [videoMetadata]);

  return (
    <VideoInfoDisplayContext.Provider value={value}>
      {children}
    </VideoInfoDisplayContext.Provider>
  );
};

export const useVideoInfoDisplay = () => {
  const context = useContext(VideoInfoDisplayContext);
  if (!context) {
    throw new Error('useVideoInfoDisplay must be used within a VideoInfoDisplayProvider');
  }
  return context;
};