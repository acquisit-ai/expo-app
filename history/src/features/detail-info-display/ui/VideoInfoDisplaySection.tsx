/**
 * 视频信息展示区域组件
 *
 * 作为Feature层的完整组件，内部包含Context Provider和信息展示组件
 * 专注于视频信息展示，不包含交互功能
 */

import React from 'react';
import { VideoInfoDisplayProvider } from '../hooks/VideoInfoDisplayContext';
import { VideoInfoSection } from './VideoInfoSection';

export const VideoInfoDisplaySection = React.memo(function VideoInfoDisplaySection() {
  return (
    <VideoInfoDisplayProvider>
      <VideoInfoSection />
    </VideoInfoDisplayProvider>
  );
});