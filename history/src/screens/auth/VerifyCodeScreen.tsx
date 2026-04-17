/**
 * VerifyCodeScreen - React Navigation 版本
 * 复用现有的 VerifyCodePage 组件
 */

import React from 'react';
import type { VerifyCodeScreenProps } from '@/shared/navigation/types';
import { VerifyCodePage } from '@/pages/auth';

/**
 * 验证码屏幕组件
 * 包装 VerifyCodePage，添加 React Navigation props 支持
 */
export function VerifyCodeScreen({ navigation, route }: VerifyCodeScreenProps) {
  return <VerifyCodePage />;
}
