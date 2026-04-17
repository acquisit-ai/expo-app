/**
 * VideoFullscreenScreen - React Navigation 版本
 * 复用现有的 VideoFullscreenPage 组件
 */

import React from 'react';
import type { VideoFullscreenScreenProps } from '@/shared/navigation/types';
import { VideoFullscreenPage } from '@/pages/video-fullscreen';

/**
 * 视频全屏播放屏幕组件
 * 包装 VideoFullscreenPage，添加 React Navigation props 支持
 *
 * 📝 说明：
 * - route.params.videoId 通过 useVideoFullscreenLogic 中的 useRoute() 获取
 * - 无需在此处手动传递参数
 */
export function VideoFullscreenScreen({ navigation, route }: VideoFullscreenScreenProps) {
  // 直接使用现有的 VideoFullscreenPage 组件
  // videoId 参数在 useVideoFullscreenLogic hook 中通过 useRoute() 获取
  return <VideoFullscreenPage />;
}
