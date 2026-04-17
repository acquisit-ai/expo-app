/**
 * PasswordManageScreen - React Navigation 版本
 * 复用现有的 PasswordManagePage 组件
 */

import React from 'react';
import type { PasswordManageScreenProps } from '@/shared/navigation/types';
import { PasswordManagePage } from '@/pages/auth';

/**
 * 密码管理屏幕组件
 * 包装 PasswordManagePage，添加 React Navigation props 支持
 */
export function PasswordManageScreen({ navigation, route }: PasswordManageScreenProps) {
  return <PasswordManagePage />;
}
