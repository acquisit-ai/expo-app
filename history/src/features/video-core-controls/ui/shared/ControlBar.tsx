/**
 * 通用控制栏容器组件
 * 提供统一的布局、样式和渐变背景
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { getBarDimensions, GRADIENT_COLORS } from '../../model/constants';
import type { ControlBarProps } from '../../model/types';

/**
 * 通用控制栏容器
 * 支持不同位置、尺寸和渐变效果
 */
export const ControlBar: React.FC<ControlBarProps> = ({
  position,
  size,
  transparent = false,
  gradient = position, // 默认根据位置设置渐变
  autoHide = true,
  bottomPadding = 0,
  topPadding = 0,
  children,
}) => {
  const { theme } = useTheme();
  const dimensions = getBarDimensions(size);

  // 基础样式 - 恢复绝对定位以贴边显示
  const baseStyle = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: dimensions.height,
    paddingHorizontal: dimensions.padding,
    paddingVertical: dimensions.verticalPadding,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    // 为底部控制栏添加额外的下边距
    paddingBottom: position === 'bottom'
      ? dimensions.verticalPadding + bottomPadding
      : dimensions.verticalPadding,
    // 为顶部控制栏添加额外的上边距
    paddingTop: position === 'top'
      ? dimensions.verticalPadding + topPadding
      : dimensions.verticalPadding,
  };

  // 位置样式
  const positionStyle = {
    [position]: 0,
  };

  // 渐变颜色
  const gradientColors = gradient !== 'none' ? GRADIENT_COLORS[gradient] : GRADIENT_COLORS.none;

  return (
    <Animated.View style={[baseStyle, positionStyle]}>
      {/* 渐变背景 */}
      {!transparent && gradient !== 'none' && (
        <LinearGradient
          colors={gradientColors}
          locations={[0, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* 内容区域 */}
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    // 移除固定的布局方向，让子组件决定布局
    // flexDirection 由子组件 ControlBarSection 控制
    width: '100%', // 确保占满全宽
  },
});

ControlBar.displayName = 'ControlBar';