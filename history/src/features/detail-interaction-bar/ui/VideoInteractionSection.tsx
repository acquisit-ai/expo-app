/**
 * 视频交互区域组件
 *
 * 作为Feature层的完整组件，内部包含Context Provider和交互栏
 */

import React from 'react';
import { VideoInteractionProvider } from '../hooks/VideoInteractionContext';
import { VideoInteractionBar } from './VideoInteractionBar';

interface VideoInteractionSectionProps {
  videoId: string; // ✅ 接收 videoId，支持多视频场景
}

export const VideoInteractionSection = React.memo(function VideoInteractionSection({
  videoId,
}: VideoInteractionSectionProps) {
  return (
    <VideoInteractionProvider videoId={videoId}>
      <VideoInteractionBar />
    </VideoInteractionProvider>
  );
});