/**
 * LiquidGlassTabBar - 液态玻璃效果TabBar组件
 * 使用 expo-glass-effect 提供原生iOS液态玻璃效果
 * 仅在 iOS 26+ 且支持液态玻璃效果时使用
 */

import React, { useMemo, useCallback } from 'react';
import { Platform, View, Dimensions } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { tabBar } from '@/shared/config/theme';
import TabBarItem from './TabBarItem';
import { getTabIcon, getTabLabel } from '../lib/iconUtils';
import { BlurTabBarProps } from '../types';

/**
 * 液态玻璃TabBar组件
 * 性能优化：使用React.memo包装以避免不必要的重新渲染
 */
export const LiquidGlassTabBar = React.memo(function LiquidGlassTabBar({
  state,
  descriptors,
  navigation,
  style
}: BlurTabBarProps) {
  const { theme, isDark } = useTheme();
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

  // 响应式计算 TabBar 位置
  const responsivePosition = useMemo(() => {
    // 底部位置：基于屏幕高度的相对值
    const dynamicBottom = screenHeight * 0.0168; // 屏幕高度的 1.68%
    // 水平边距：基于屏幕宽度的相对值
    const dynamicHorizontal = screenWidth * 0.06; // 屏幕宽度的 6%

    return {
      bottom: dynamicBottom,
      horizontal: dynamicHorizontal,
    };
  }, [screenHeight, screenWidth]);

  // 使用主题化样式创建工具 - 液态玻璃版本（分层设计）
  const styles = useMemo(() => ({
    container: {
      position: 'absolute' as const,
      bottom: responsivePosition.bottom,
      left: responsivePosition.horizontal,
      right: responsivePosition.horizontal,
      height: tabBar.height,
      borderRadius: tabBar.borderRadius,
      // 液态玻璃版本：增强的阴影效果
      ...(!isDark && Platform.select({
        ios: {
          shadowColor: tabBar.effects.shadow.color,
          shadowOffset: { width: 0, height: 4 }, // 增加阴影偏移
          shadowOpacity: 0.12, // 提高阴影透明度
          shadowRadius: 12, // 增大阴影半径
          backgroundColor: 'transparent',
        },
        android: {
          elevation: 6, // 提高安卓阴影
          backgroundColor: 'rgba(0,0,0,0.04)', // 更深的背景色
        },
      })),
    },
    glassView: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: tabBar.borderRadius,
      overflow: 'hidden' as const,
    },
    tabContainer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-around' as const,
      paddingHorizontal: tabBar.horizontalPadding,
      zIndex: 1, // 确保按钮在玻璃效果之上
      pointerEvents: 'box-none' as const, // 允许触摸事件穿透到 GlassView
    },
  }), [isDark, responsivePosition]);

  // 直接使用主题颜色，与 BlurTabBar 保持一致
  const colors = {
    active: theme.colors.primary,
    inactive: theme.colors.textMedium,  // 使用与 Profile 页面相同的颜色
  };

  // Tab 项点击处理器 - 优化：稳定的回调引用
  const handleTabPress = useCallback((routeName: string, routeKey: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }, [navigation]);

  // 预计算Tab项数据，避免在渲染过程中重复计算
  const tabItems = useMemo(() =>
    state.routes.map((route, index) => {
      const { options } = descriptors[route.key];
      const label = getTabLabel(options, route.name);
      const isFocused = state.index === index;
      const iconName = getTabIcon(route.name, isFocused);

      return {
        key: route.key,
        routeName: route.name,
        label,
        isFocused,
        iconName,
        iconColor: isFocused ? colors.active : colors.inactive,
        labelColor: isFocused ? colors.active : colors.inactive,
      };
    })
    , [state.routes, state.index, descriptors, colors.active, colors.inactive]);

  return (
    <View style={[styles.container, style]}>
      <GlassView
        style={[
          styles.glassView,
          {
            backgroundColor: isDark
              ? 'rgba(0, 0, 0, 0.4)'  // 黑暗模式：半透明黑色
              : 'rgba(255, 255, 255, 0.4)'  // 浅色模式：半透明白色
          }
        ]}
        glassEffectStyle="clear"
        isInteractive={true}
      />
      <View style={styles.tabContainer} pointerEvents="box-none">
        {tabItems.map((item) => (
          <TabBarItem
            key={item.key}
            routeKey={item.key}
            routeName={item.routeName}
            label={item.label}
            isFocused={item.isFocused}
            onPress={() => handleTabPress(item.routeName, item.key, item.isFocused)}
            iconName={item.iconName}
            iconColor={item.iconColor}
            labelColor={item.labelColor}
          />
        ))}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // 优化：只有state.index或theme相关属性变化时才重新渲染
  return (
    prevProps.state.index === nextProps.state.index &&
    prevProps.state.routes.length === nextProps.state.routes.length &&
    prevProps.navigation === nextProps.navigation &&
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
  );
});