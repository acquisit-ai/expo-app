import React, { useCallback } from 'react';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useGlass } from '@/shared/providers/GlassProvider';
import { GlassCard } from '@/shared/ui';
import { moderateScale } from '@/shared/lib/metrics';
import { log, LogType } from '@/shared/lib/logger';
import { useBackHandler, useFocusState } from '@/shared/hooks';

interface AuthPageLayoutProps {
  children: React.ReactNode;
}

/**
 * 认证页面通用布局组件
 * 提供统一的背景、安全区域、玻璃卡片容器、键盘收起功能和硬件返回键禁用
 */
export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  const { isDark } = useTheme();
  const { config } = useGlass();

  // 跟踪页面焦点状态（使用 shared hook）
  const isFocused = useFocusState();

  // 禁用所有认证页面的 Android 硬件返回键（使用 shared hook）
  useBackHandler(
    useCallback(() => {
      log('auth-layout', LogType.INFO, '认证页面：拦截硬件返回键');
      return true; // 返回 true 阻止默认行为
    }, []),
    isFocused // 只在页面聚焦时启用
  );

  const backgroundColors = isDark
    ? config.backgrounds.midnight
    : config.backgrounds.aurora;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={backgroundColors}
        start={config.gradient.start}
        end={config.gradient.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.heroSection}>
            <GlassCard widthRatio={0.95}>
              {children}
            </GlassCard>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    backgroundColor: 'transparent',
  },
});