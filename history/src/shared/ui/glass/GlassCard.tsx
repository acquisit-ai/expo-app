import React from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle } from 'react-native';
import { useGlassCard } from '@/shared/providers/GlassProvider';

interface GlassCardProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 卡片宽度比例 (0-1) */
  widthRatio?: number;
  /** 内边距级别 */
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * 玻璃态卡片组件
 * 提供美观的玻璃态效果，包含渐变背景和模糊效果
 */
export function GlassCard({ 
  children, 
  style,
  widthRatio = 0.9,
  padding = 'lg'
}: GlassCardProps) {
  const { styles, blur, gradient } = useGlassCard();

  // 获取对应的样式变体
  const widthVariant = widthRatio <= 0.8 ? 'small' : widthRatio <= 0.9 ? 'medium' : 'large';
  const paddingVariant = padding === 'sm' ? 'paddingSmall' : padding === 'md' ? 'paddingMedium' : 'paddingLarge';

  return (
    <LinearGradient
      colors={styles.gradientColors}
      start={gradient.start}
      end={gradient.end}
      style={[styles.gradient.container, styles.gradient[widthVariant], style]}
    >
      <BlurView 
        intensity={blur.intensity}
        tint={blur.tint}
        style={[styles.blur.container, styles.blur[paddingVariant]]}
      >
        {children}
      </BlurView>
    </LinearGradient>
  );
}