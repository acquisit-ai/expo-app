/**
 * VideoDetailScreen - React Navigation 版本
 * 复用现有的 VideoDetailPage 组件
 */

import React from 'react';
import type { VideoDetailScreenProps } from '@/shared/navigation/types';
import { VideoDetailPage } from '@/pages/video-detail';

/**
 * 视频详情屏幕组件
 * 包装 VideoDetailPage，添加 React Navigation props 支持
 *
 * 📝 说明：
 * - route.params.videoId 通过 useVideoDetailLogic 中的 useRoute() 获取
 * - 无需在此处手动传递参数
 */
export function VideoDetailScreen({ navigation, route }: VideoDetailScreenProps) {
  // 直接使用现有的 VideoDetailPage 组件
  // videoId 参数在 useVideoDetailLogic hook 中通过 useRoute() 获取
  return <VideoDetailPage />;
}
