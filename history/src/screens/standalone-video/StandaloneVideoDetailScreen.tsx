/**
 * StandaloneVideoDetailScreen
 * 复用 VideoDetailPage，用于收藏/历史入口的独立播放模式
 */

import React from 'react';
import type { StandaloneVideoDetailScreenProps } from '@/shared/navigation/types';
import { VideoDetailPage } from '@/pages/video-detail';

export function StandaloneVideoDetailScreen(_props: StandaloneVideoDetailScreenProps) {
  return <VideoDetailPage />;
}
