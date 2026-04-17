/**
 * 播放/暂停按钮组件
 * 基于AnimatedButton实现，提供播放状态切换功能
 *
 * 性能优化：使用 React.memo 避免不必要的重渲染
 */

import React from 'react';
import { AnimatedButton } from '../shared/AnimatedButton';
import type { PlayButtonProps } from '../../model/types';

/**
 * 播放/暂停按钮
 * 根据播放状态自动切换图标
 */
export const PlayButton: React.FC<PlayButtonProps> = React.memo(({
  isPlaying,
  onToggle,
  size,
  disabled = false,
  showLabel = false,
  onInteraction,
  testID = 'play-button',
}) => {
  const handlePress = () => {
    onToggle();
    onInteraction?.(); // 重置自动隐藏计时器
  };

  const icon = isPlaying ? 'pause' : 'play';
  const accessibilityLabel = isPlaying ? '暂停' : '播放';

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
        accessibilityState: { selected: isPlaying },
      }}
    />
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：只在关键 props 变化时重渲染
  // 假设回调函数是稳定的（通过 useCallback）
  return (
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.size === nextProps.size &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.showLabel === nextProps.showLabel
  );
});

PlayButton.displayName = 'PlayButton';