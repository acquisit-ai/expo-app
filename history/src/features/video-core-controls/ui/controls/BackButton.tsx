/**
 * 返回按钮组件
 * 用于导航返回功能
 *
 * 性能优化：使用 React.memo 避免不必要的重渲染
 */

import React from 'react';
import { AnimatedButton } from '../shared/AnimatedButton';
import type { BackButtonProps } from '../../model/types';

/**
 * 返回按钮
 * 提供标准的返回导航功能
 */
export const BackButton: React.FC<BackButtonProps> = React.memo(({
  size,
  onPress,
  disabled = false,
  showLabel = false,
  confirmBeforeBack = false,
  onInteraction,
  testID = 'back-button',
}) => {
  const handlePress = () => {
    // 如果需要确认，这里可以添加确认逻辑
    // 目前直接执行返回
    onPress?.();
    onInteraction?.(); // 重置自动隐藏计时器
  };

  return (
    <AnimatedButton
      icon="chevron-left"
      size={size}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
      // 添加无障碍支持
      {...{
        accessibilityLabel: '返回',
        accessibilityRole: 'button',
        accessibilityHint: '返回上一页',
      }}
    />
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：只在关键 props 变化时重渲染
  // 假设回调函数是稳定的（通过 useCallback）
  return (
    prevProps.size === nextProps.size &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.showLabel === nextProps.showLabel &&
    prevProps.confirmBeforeBack === nextProps.confirmBeforeBack
  );
});

BackButton.displayName = 'BackButton';