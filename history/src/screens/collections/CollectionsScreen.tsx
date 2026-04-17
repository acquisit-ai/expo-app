/**
 * CollectionsScreen - React Navigation 版本
 * 复用现有的 CollectionsPage 组件
 */

import React from 'react';
import type { CollectionsScreenProps } from '@/shared/navigation/types';
import { CollectionsPage } from '@/pages/collections';

/**
 * 单词本屏幕组件
 * 包装 CollectionsPage，添加 React Navigation props 支持
 */
export function CollectionsScreen({ navigation, route }: CollectionsScreenProps) {
  return <CollectionsPage />;
}
