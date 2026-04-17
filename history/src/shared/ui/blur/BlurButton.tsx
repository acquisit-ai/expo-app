import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/providers/ThemeProvider';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useBlurButton } from '@/shared/providers/BlurProvider';
import type { ColorVariant } from '@/shared/config/theme/blur';

interface BlurButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** 自定义样式 */
  style?: any;
  textStyle?: any;
  /** 是否为主要按钮 */
  primary?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 颜色变体 */
  variant?: ColorVariant;
}

/**
 * 模糊态按钮组件
 * 使用新的 BlurProvider 架构，提供预计算样式和动画
 */
export const BlurButton = React.memo(({
  children,
  onPress,
  style,
  textStyle,
  primary = false,
  loading = false,
  variant = 'default'
}: BlurButtonProps) => {
  const { theme } = useTheme();
  const { styles, colors, blur, animation } = useBlurButton();

  const backgroundColor = colors[variant] || colors.default;

  // Reanimated shared value for scale
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(animation.pressIn.scale, {
      duration: animation.pressIn.duration
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(animation.pressOut.scale, {
      duration: animation.pressOut.duration
    });
  };

  // 包装 onPress 函数，添加震动反馈
  const handlePress = useCallback(() => {
    if (onPress && !loading) {
      // 触发选择反馈 - 轻快的"嘀嗒"感
      Haptics.selectionAsync();
      onPress();
    }
  }, [onPress, loading]);

  // Reanimated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const content = typeof children === 'string'
    ? <Text style={[styles.text.base, { color: theme.colors.textMedium }, textStyle]}>{children}</Text>
    : children;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
    >
      <Animated.View style={[styles.container.base, style, animatedStyle]}>
        <BlurView
          style={[styles.content.base, { backgroundColor }]}
          tint={blur.tint}
          intensity={blur.intensity}
        >
          <View style={styles.content.highlight} />
          <View style={styles.loading.container}>
            {content}
          </View>
        </BlurView>
      </Animated.View>
    </Pressable>
  );
});