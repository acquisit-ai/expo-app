/**
 * ProfileScreen - React Navigation 版本
 * 复用现有的 ProfilePage 组件
 */

import React from 'react';
import type { ProfileScreenProps } from '@/shared/navigation/types';
import { ProfilePage } from '@/pages/profile';

/**
 * 个人中心屏幕组件
 * 包装 ProfilePage，添加 React Navigation props 支持
 */
export function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  return <ProfilePage />;
}
