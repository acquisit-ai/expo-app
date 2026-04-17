/**
 * LoginScreen - React Navigation 版本
 * 复用现有的 LoginPage 组件
 */

import React from 'react';
import type { LoginScreenProps } from '@/shared/navigation/types';
import { LoginPage } from '@/pages/auth';

/**
 * 登录屏幕组件
 * 包装 LoginPage，添加 React Navigation props 支持
 */
export function LoginScreen({ navigation, route }: LoginScreenProps) {
  return <LoginPage />;
}
