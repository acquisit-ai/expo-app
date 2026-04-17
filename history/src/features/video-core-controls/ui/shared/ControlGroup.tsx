/**
 * 控制组分组组件
 * 用于组织和排列相关的控制元素
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getSpacing } from '../../model/constants';
import type { ControlGroupProps } from '../../model/types';

/**
 * 控制组分组
 * 提供统一的间距和对齐方式
 */
export const ControlGroup: React.FC<ControlGroupProps> = ({
  align = 'center',
  spacing = 'sm',
  flex,
  children,
}) => {
  // 获取间距值
  const spacingValue = getSpacing(spacing);

  // 对齐样式
  const getAlignmentStyle = () => {
    switch (align) {
      case 'left':
        return styles.alignLeft;
      case 'right':
        return styles.alignRight;
      case 'center':
      default:
        return styles.alignCenter;
    }
  };

  return (
    <View
      style={[
        styles.container,
        getAlignmentStyle(),
        { flex, gap: spacingValue },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignLeft: {
    justifyContent: 'flex-start',
  },
  alignCenter: {
    justifyContent: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
});

ControlGroup.displayName = 'ControlGroup';