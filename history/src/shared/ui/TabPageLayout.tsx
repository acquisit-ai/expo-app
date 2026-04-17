import React from 'react';
import { StyleSheet, ScrollView, Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tabBar } from '@/shared/config/theme';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useGlass } from '@/shared/providers/GlassProvider';

interface TabPageLayoutProps {
  children: React.ReactNode;
  /** 是否启用内置 ScrollView。虚拟化列表页面应设置为 false，避免嵌套冲突 */
  scrollable?: boolean;
  /** 自定义内容容器样式 */
  contentStyle?: any;
}

/**
 * Tab页面通用布局组件
 * 提供统一的渐变背景、安全区域和滚动功能，适用于所有tab页面
 */
export function TabPageLayout({ children, scrollable = true, contentStyle }: TabPageLayoutProps) {
  const { isDark } = useTheme();
  const { config } = useGlass();
  const { height: screenHeight } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  // 使用 Glass Provider 的背景配置
  const backgroundColors = isDark
    ? config.backgrounds.midnight
    : config.backgrounds.creamyWhite;

  // 响应式计算底部内边距 - 与 TabBar 的动态位置保持一致
  const dynamicBottomPadding = React.useMemo(() => {
    // TabBar 占用的空间（与 BlurTabBar 逻辑保持一致）
    const tabBarBottom = screenHeight * 0.0168; // 屏幕高度的 1.68%
    const tabBarTotalSpace = tabBarBottom + tabBar.height;

    // 基于屏幕高度的最小相对值
    const relativeMinHeight = screenHeight * 0.05;

    // 取较大值确保足够空间
    const basePadding = Math.max(tabBarTotalSpace, relativeMinHeight);

    // 添加额外的缓冲空间 (屏幕高度的 2%)
    return basePadding + (screenHeight * 0.02);
  }, [screenHeight]);

  const bottomPadding = React.useMemo(() => {
    if (scrollable) {
      return dynamicBottomPadding;
    }
    return 0;
  }, [scrollable, dynamicBottomPadding]);

  return (
    <LinearGradient
      colors={backgroundColors}
      start={config.gradient.start}
      end={config.gradient.end}
      style={styles.container}
    >
      {/* 只为顶部提供安全区域 */}
      <View style={[styles.topSafeArea, { paddingTop: insets.top }]}>
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomPadding },
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.nonScrollContent,
              { paddingBottom: bottomPadding },
              contentStyle,
            ]}
          >
            {children}
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // 底部内边距现在动态计算，考虑不同屏幕尺寸
  },
  nonScrollContent: {
    flex: 1,
  },
});
