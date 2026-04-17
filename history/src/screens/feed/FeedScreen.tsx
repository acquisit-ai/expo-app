/**
 * FeedScreen - React Navigation 版本
 * 复用现有的 FeedPage 组件
 */

import React from 'react';
import type { FeedScreenProps } from '@/shared/navigation/types';
import { FeedPage } from '@/pages/feed';

/**
 * Feed 屏幕组件
 * 包装 FeedPage，添加 React Navigation props 支持
 */
export function FeedScreen({ navigation, route }: FeedScreenProps) {
  // 直接使用现有的 FeedPage 组件
  // FeedPage 不依赖路由参数，所以不需要传递 props
  return <FeedPage />;
}
