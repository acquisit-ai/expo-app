/**
 * LoadingScreen - 加载屏幕组件
 * 
 * 在应用初始化和认证状态检查时显示
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useGlass } from '@/shared/providers/GlassProvider';
import { moderateScale } from '@/shared/lib/metrics';

export function LoadingScreen() {
  const { isDark } = useTheme();
  const { config, colors } = useGlass();

  // 根据主题选择背景渐变
  const backgroundColors = isDark 
    ? config.backgrounds.midnight 
    : config.backgrounds.aurora;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loader: {
      // 使用主题色
    },
  });

  return (
    <LinearGradient
      colors={backgroundColors}
      start={config.gradient.start}
      end={config.gradient.end}
      style={styles.container}
    >
      <ActivityIndicator 
        size="large" 
        color={colors.textPrimary}
        style={styles.loader}
      />
    </LinearGradient>
  );
}