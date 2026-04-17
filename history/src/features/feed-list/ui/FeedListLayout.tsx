import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useGlass } from '@/shared/providers/GlassProvider';

interface FeedListLayoutProps {
  children: React.ReactNode;
  /** 是否应用顶部安全区 padding。Defaults to true. */
  useTopSafeInset?: boolean;
}

/**
 * Feed 列表专用布局组件
 * 专门为 Feed 列表设计，不包含 ScrollView
 * 避免嵌套虚拟化列表的性能问题
 */
export function FeedListLayout({ children, useTopSafeInset = true }: FeedListLayoutProps) {
  const { isDark } = useTheme();
  const { config } = useGlass();
  const insets = useSafeAreaInsets();

  // 使用 Glass Provider 的背景配置
  const backgroundColors = isDark
    ? config.backgrounds.midnight
    : config.backgrounds.creamyWhite;

  return (
    <LinearGradient
      colors={backgroundColors}
      start={config.gradient.start}
      end={config.gradient.end}
      style={styles.container}
    >
      {/* 只为顶部提供安全区域 */}
      <View style={[styles.topSafeArea, useTopSafeInset ? { paddingTop: insets.top } : null]}>
        {children}
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
});
