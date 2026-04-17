import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useBlurCard } from '@/shared/providers/BlurProvider';
import { useTheme } from '@/shared/providers/ThemeProvider';
import type { ColorVariant, PaddingSize } from '@/shared/config/theme/blur';

interface BlurCardProps {
  children: React.ReactNode;
  /** 自定义样式 */
  style?: any;
  /** 卡片宽度比例 (0-1) */
  widthRatio?: number;
  /** 内边距级别 */
  padding?: PaddingSize;
  /** 颜色变体 */
  variant?: ColorVariant;
  /** 自定义圆角 */
  borderRadius?: number;
}

/**
 * 模糊态卡片组件
 * 使用新的 BlurProvider 架构，提供预计算样式和缓存优化
 */
export const BlurCard = React.memo(({
  children,
  style,
  widthRatio = 0.9,
  padding = 'md',
  variant = 'default',
  borderRadius,
}: BlurCardProps) => {
  const { styles, colors, blur, getWidthVariant } = useBlurCard();
  const { theme } = useTheme();

  const backgroundColor = colors[variant] || colors.default;
  const widthVariant = getWidthVariant(widthRatio);
  const resolvedRadius = borderRadius ?? (styles.content.base.borderRadius || 16);

  return (
    <View
      style={[
        styles.container.base,
        styles.variants[widthVariant],
        { alignSelf: 'center', borderRadius: resolvedRadius },
        style,
      ]}
    >
      <View style={{
        borderWidth: 1,
        borderColor: theme.colors.borderCream,
        borderRadius: resolvedRadius,
      }}>
        <BlurView
          style={[styles.content.base, { backgroundColor, borderRadius: resolvedRadius }]}
          tint={blur.tint}
          intensity={blur.intensity}
        >
          <View
            style={[styles.content.highlight, resolvedRadius ? { borderRadius: Math.max(resolvedRadius - 1, 0) } : null]}
          />
          <View style={styles.padding[padding]}>
            {children}
          </View>
        </BlurView>
      </View>
    </View>
  );
});
