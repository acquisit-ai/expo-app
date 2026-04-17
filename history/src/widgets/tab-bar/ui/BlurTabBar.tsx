/**
 * BlurTabBar - 模糊透明TabBar组件
 * 专为现代移动应用设计的浮动式Tab导航栏
 */

import React, { useMemo, useCallback } from 'react';
import { Platform, View, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { tabBar } from '@/shared/config/theme';
import TabBarItem from './TabBarItem';
import { getTabIcon, getTabLabel } from '../lib/iconUtils';
import { BlurTabBarProps } from '../types';

/**
 * 自定义透明模糊TabBar组件
 * 性能优化：使用React.memo包装以避免不必要的重新渲染
 */
export const BlurTabBar = React.memo(function BlurTabBar({ state, descriptors, navigation, style }: BlurTabBarProps) {
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

  // 使用主题化样式创建工具
  const styles = useMemo(() => ({
    shadowContainer: {
      position: 'absolute',
      bottom: responsivePosition.bottom,
      left: responsivePosition.horizontal,
      right: responsivePosition.horizontal,
      borderRadius: tabBar.borderRadius,
      // 只在浅色模式下使用阴影
      ...(!isDark && Platform.select({
        ios: {
          shadowColor: tabBar.effects.shadow.color,
          shadowOffset: tabBar.effects.shadow.offset,
          shadowOpacity: tabBar.effects.shadow.opacity,
          shadowRadius: tabBar.effects.shadow.radius,
          backgroundColor: 'transparent',
        },
        android: {
          elevation: tabBar.effects.shadow.elevation,
          backgroundColor: tabBar.effects.androidShadowBg,
        },
      })),
    },
    blurView: {
      borderRadius: tabBar.borderRadius,
      overflow: 'hidden' as const,
      width: '100%' as const,
      height: '100%' as const,
    },
    // 内部高光边框，只有左右两边
    highlightBorder: {
      position: 'absolute' as const,
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
      borderRadius: tabBar.borderRadius - 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderLeftColor: tabBar.effects.highlightBorderColor,
      borderRightColor: tabBar.effects.highlightBorderColor,
      pointerEvents: 'none' as const,
    },
    tabContainer: {
      flexDirection: 'row' as const,
      height: tabBar.height,
      alignItems: 'center' as const,
      justifyContent: 'space-around' as const,
      paddingHorizontal: tabBar.horizontalPadding,
    },
  }), [isDark, responsivePosition]);

  // 直接使用主题颜色，极简高效
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
    <View style={[styles.shadowContainer, style]}>
      <BlurView
        style={styles.blurView}
        tint={isDark ? 'regular' : 'light'}
        intensity={isDark ? tabBar.effects.blurIntensity.dark : tabBar.effects.blurIntensity.light}
      >
        {isDark && <View style={styles.highlightBorder} />}
        <View style={styles.tabContainer}>
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
      </BlurView>
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
