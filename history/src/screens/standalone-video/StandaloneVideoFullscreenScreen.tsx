/**
 * StandaloneVideoFullscreenScreen
 * 复用 VideoFullscreenPage，用于收藏/历史入口的独立播放模式
 */

import React from 'react';
import type { StandaloneVideoFullscreenScreenProps } from '@/shared/navigation/types';
import { VideoFullscreenPage } from '@/pages/video-fullscreen';

export function StandaloneVideoFullscreenScreen(_props: StandaloneVideoFullscreenScreenProps) {
  return <VideoFullscreenPage />;
}
