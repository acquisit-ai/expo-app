/**
 * TabBarItem - 单个Tab项组件
 * 渲染带图标和标签的可交互Tab项
 */

import React, { useMemo, memo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tabBar } from '@/shared/config/theme';
import { TabBarItemProps } from '../types';

/**
 * Tab项组件
 */
const TabBarItem = memo(function TabBarItem({
  routeKey,
  label,
  isFocused,
  onPress,
  iconName,
  iconColor,
  labelColor,
}: TabBarItemProps) {

  // 包装 onPress 函数，添加震动反馈
  const handlePress = useCallback(() => {
    // 触发选择反馈 - 轻快的"嘀嗒"感，更适合选项卡切换
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  // 静态样式，不依赖状态
  const staticStyles = useMemo(() => ({
    container: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 8,
      minHeight: tabBar.height - 16,
    },
    icon: {
      marginBottom: tabBar.labelMarginTop,
    },
    labelBase: {
      fontSize: tabBar.labelFontSize,
      textAlign: 'center' as const,
      includeFontPadding: false,
    },
  }), []);

  // 动态样式，基于状态
  const dynamicLabelStyle = useMemo(() => ({
    fontWeight: isFocused ? '600' as const : '500' as const,
  }), [isFocused]);

  return (
    <TouchableOpacity
      key={routeKey}
      style={staticStyles.container}
      onPress={handlePress}
      activeOpacity={tabBar.effects.activeOpacity}
    >
      <Ionicons
        name={iconName}
        size={tabBar.iconSize}
        color={iconColor}
        style={staticStyles.icon}
      />
      <Text style={[staticStyles.labelBase, dynamicLabelStyle, { color: labelColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键属性变化时重新渲染
  // 关键优化：只有真正影响渲染的属性变化时才重新渲染
  return (
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.iconColor === nextProps.iconColor &&
    prevProps.labelColor === nextProps.labelColor &&
    prevProps.label === nextProps.label &&
    prevProps.iconName === nextProps.iconName &&
    prevProps.onPress === nextProps.onPress
  );
});

export default TabBarItem;