/**
 * 全屏切换按钮组件
 * 用于切换视频全屏显示模式
 */

import React from 'react';
import { AnimatedButton } from '../shared/AnimatedButton';
import type { FullscreenToggleProps } from '../../model/types';

/**
 * 全屏切换按钮
 * 根据全屏状态自动切换图标
 */
export const FullscreenToggle: React.FC<FullscreenToggleProps> = ({
  isFullscreen,
  onToggle,
  size,
  disabled = false,
  showLabel = false,
  onInteraction,
  testID = 'fullscreen-toggle',
}) => {
  const handlePress = () => {
    onToggle();
    onInteraction?.(); // 重置自动隐藏计时器
  };

  const icon = isFullscreen ? 'fullscreen-exit' : 'fullscreen';
  const accessibilityLabel = isFullscreen ? '退出全屏' : '进入全屏';

  return (
    <AnimatedButton
      icon={icon}
      size={size}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
      // 添加无障碍支持
      {...{
        accessibilityLabel,
        accessibilityRole: 'button',
        accessibilityState: { selected: isFullscreen },
      }}
    />
  );
};

FullscreenToggle.displayName = 'FullscreenToggle';