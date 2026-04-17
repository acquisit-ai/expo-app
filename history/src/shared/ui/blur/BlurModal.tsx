import React from 'react';
import { View, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useBlurCard } from '@/shared/providers/BlurProvider';
import { useTheme } from '@/shared/providers/ThemeProvider';
import type { ColorVariant, PaddingSize } from '@/shared/config/theme/blur';

type ModalType = 'square' | 'bottom-sheet' | 'custom';

interface BlurModalProps {
  children: React.ReactNode;
  /** 自定义样式 */
  style?: any;
  /** 模态框类型 */
  type?: ModalType;
  /** 模态框尺寸比例 (0-1)，基于屏幕宽度。type为'custom'时必需 */
  sizeRatio?: number;
  /** 内边距级别 */
  padding?: PaddingSize;
  /** 颜色变体 */
  variant?: ColorVariant;
  /** 自定义宽度，type为'custom'时使用 */
  width?: number | string;
  /** 自定义高度，type为'custom'时使用 */
  height?: number | string;
  /** 是否显示顶部拖拽手柄，仅在bottom-sheet类型时有效 */
  showHandle?: boolean;
  /** 自定义圆角配置 */
  borderRadius?: {
    topLeft?: number;
    topRight?: number;
    bottomLeft?: number;
    bottomRight?: number;
  } | number;
}

/**
 * 通用模糊态模态框组件
 * 支持多种模态框类型：正方形、底部抽屉、自定义
 */
export const BlurModal = React.memo(({
  children,
  style,
  type = 'square',
  sizeRatio = 0.85,
  padding = 'lg',
  variant = 'default',
  width,
  height,
  showHandle = true,
  borderRadius: customBorderRadius
}: BlurModalProps) => {
  const { styles, colors, blur } = useBlurCard();
  const { theme } = useTheme();

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // 根据类型计算容器样式
  const getContainerStyle = () => {
    switch (type) {
      case 'square':
        // 响应式计算：基于较小的维度确保Modal在任何方向下都能适配
        const maxDimension = Math.min(screenWidth, screenHeight);
        const size = maxDimension * sizeRatio;
        return {
          width: size,
          height: size,
          alignSelf: 'center',
        };

      case 'bottom-sheet':
        return {
          width: screenWidth,
          alignSelf: 'center',
        };

      case 'custom':
        return {
          width: width || screenWidth * (sizeRatio || 0.85),
          height: height,
          alignSelf: 'center',
        };

      default:
        return {
          width: screenWidth * sizeRatio,
          alignSelf: 'center',
        };
    }
  };

  // 根据类型计算圆角
  const getBorderRadius = () => {
    if (customBorderRadius) {
      if (typeof customBorderRadius === 'number') {
        return customBorderRadius;
      }
      // 对于复杂圆角，我们返回一个基础值，具体的圆角在BlurView中单独处理
      return 0;
    }

    switch (type) {
      case 'square':
        return 24;
      case 'bottom-sheet':
        return 0; // 底部抽屉只有顶部圆角
      case 'custom':
        return styles.content.base.borderRadius || 16;
      default:
        return 20;
    }
  };

  // 根据类型计算BlurView样式
  const getBlurViewStyle = () => {
    const baseRadius = getBorderRadius();

    if (type === 'bottom-sheet') {
      return {
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      };
    }

    if (customBorderRadius && typeof customBorderRadius === 'object') {
      return {
        borderTopLeftRadius: customBorderRadius.topLeft || 0,
        borderTopRightRadius: customBorderRadius.topRight || 0,
        borderBottomLeftRadius: customBorderRadius.bottomLeft || 0,
        borderBottomRightRadius: customBorderRadius.bottomRight || 0,
      };
    }

    return {
      borderRadius: baseRadius,
    };
  };

  // 获取内容布局样式
  const getContentStyle = () => {
    if (type === 'square') {
      return {
        flex: 1,
        justifyContent: 'space-between', // 三段式布局
      };
    }

    return {
      // bottom-sheet 和 custom 使用自然流式布局
    };
  };

  const containerStyle = getContainerStyle();
  const borderRadius = getBorderRadius();
  const blurViewStyle = getBlurViewStyle();
  const contentStyle = getContentStyle();

  return (
    <View style={[containerStyle, style]}>
      <View style={{
        flex: type === 'bottom-sheet' ? undefined : 1,
        borderWidth: type === 'bottom-sheet' ? 0 : 1,
        borderColor: theme.colors.borderCream,
        ...blurViewStyle,
      }}>
        <BlurView
          style={[
            styles.content.base,
            {
              backgroundColor: colors[variant] || colors.default,
              flex: type === 'bottom-sheet' ? undefined : 1,
              minHeight: type === 'square' ? containerStyle.height : undefined,
            },
            blurViewStyle
          ]}
          tint={blur.tint}
          intensity={blur.intensity}
        >
          <View style={styles.content.highlight} />

          {/* 底部抽屉的拖拽手柄 */}
          {type === 'bottom-sheet' && showHandle && (
            <View style={{
              marginVertical: 20,
              alignItems: 'center',
            }}>
              <View style={{
                width: 40,
                height: 6,
                borderRadius: 4,
                marginBottom: 10,
                backgroundColor: theme.colors.textMedium,
                opacity: 0.3,
              }} />
            </View>
          )}

          <View style={[
            styles.padding[padding],
            contentStyle
          ]}>
            {children}
          </View>

          {/* 底部抽屉的底部间距 */}
          {type === 'bottom-sheet' && (
            <View style={{ height: 30 }} />
          )}
        </BlurView>
      </View>
    </View>
  );
});

BlurModal.displayName = 'BlurModal';