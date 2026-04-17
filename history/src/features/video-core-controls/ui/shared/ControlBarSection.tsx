/**
 * 控制栏区段组件
 * 提供灵活的布局和对齐选项
 */

import React from 'react';
import { View } from 'react-native';
import type { ControlBarSectionProps } from '../../model/types';

/**
 * 控制栏区段
 * 用于在控制栏内创建不同的布局区域
 */
export const ControlBarSection: React.FC<ControlBarSectionProps> = ({
  direction = 'horizontal',
  align = 'center',
  justify,
  flex,
  children,
}) => {
  // 转换对齐方式到FlexBox属性
  const getAlignItems = () => {
    switch (align) {
      case 'left': return 'flex-start';
      case 'right': return 'flex-end';
      case 'center': return 'center';
      case 'space-between': return 'stretch';
      case 'space-around': return 'stretch';
      default: return 'center';
    }
  };

  const getJustifyContent = () => {
    if (justify) return justify;

    switch (align) {
      case 'left': return 'flex-start';
      case 'right': return 'flex-end';
      case 'center': return 'center';
      case 'space-between': return 'space-between';
      case 'space-around': return 'space-around';
      default: return 'center';
    }
  };

  const flexDirection = direction === 'horizontal' ? 'row' : 'column';
  const alignItems = getAlignItems();
  const justifyContent = getJustifyContent();

  return (
    <View
      style={{
        flexDirection,
        alignItems,
        justifyContent,
        flex,
        width: '100%', // 确保占满全宽
      }}
    >
      {children}
    </View>
  );
};

ControlBarSection.displayName = 'ControlBarSection';