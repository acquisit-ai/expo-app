/**
 * ToastView 组件 - Paper 版本
 * 使用 React Native Paper 组件替代 styled-components
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { moderateScale } from '@/shared/lib/metrics';
import { getThemeColors } from '@/shared/config/theme/colors';
import type { ToastViewProps, ToastType } from '../types';

// 尺寸常量
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_MARGIN = moderateScale(35);
const ICON_SIZE = 24;
const BORDER_RADIUS = 24;
const ICON_PADDING = 8;
const CONTAINER_PADDING_HORIZONTAL = 16;
const CONTAINER_PADDING_VERTICAL = 12;
const CONTAINER_MIN_HEIGHT = 48;
const POSITION_MARGIN = 4;

// 文本行数限制常量
const TITLE_MAX_LINES = 1;
const MESSAGE_MAX_LINES = 2;

// 视觉效果常量
const BLUR_INTENSITY = 60;
const BACKGROUND_OPACITY = 0.2; // 20% 透明度
const TITLE_TEXT_OPACITY = 0.75; // 75% 不透明度
const MESSAGE_TEXT_OPACITY = 0.75; // 75% 不透明度
const ICON_OPACITY = 0.7; // 70% 不透明度

/**
 * Toast 类型对应的图标配置
 * 使用严格的类型约束
 */
const TOAST_TYPE_CONFIG: Record<
    ToastType,
    { readonly iconName: React.ComponentProps<typeof MaterialIcons>['name'] }
> = {
    success: { iconName: 'check-circle' },
    error: { iconName: 'error-outline' },
    info: { iconName: 'info' },
    warning: { iconName: 'warning' },
} as const;

/**
 * 获取 Toast 类型对应的颜色
 * 使用项目自定义主题颜色而不是Paper主题
 */
const getToastTypeColor = (type: ToastType, isDark: boolean): string => {
  const themeColors = getThemeColors(isDark);

  switch (type) {
    case 'success':
      return themeColors.success;
    case 'error':
      return themeColors.error;
    case 'warning':
      return themeColors.warning; // 使用项目定义的橙色警告色
    case 'info':
    default:
      return themeColors.info; // 使用项目定义的信息色
  }
};

/**
 * Toast 视图组件
 * 负责 Toast 的视觉呈现，使用 Paper 组件
 */
export const ToastView: React.FC<ToastViewProps> = React.memo(({
  type,
  title,
  message,
  isDark,
  position
}) => {
    const { iconName } = TOAST_TYPE_CONFIG[type];
    const iconSize = moderateScale(ICON_SIZE);
    const typeColor = getToastTypeColor(type, isDark);

    // 动态创建样式
    const styles = StyleSheet.create({
      container: {
        width: '100%',
        alignItems: 'center',
        marginTop: position === 'top' ? POSITION_MARGIN : 0,
        marginBottom: position === 'bottom' ? POSITION_MARGIN : 0,
      },
      blurContainer: {
        borderRadius: moderateScale(BORDER_RADIUS),
        overflow: 'hidden',
        width: SCREEN_WIDTH - HORIZONTAL_MARGIN * 2,
        alignSelf: 'center',
      },
      background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: moderateScale(BORDER_RADIUS),
        backgroundColor: `${typeColor}${Math.round(BACKGROUND_OPACITY * 255).toString(16).padStart(2, '0')}`,
      },
      content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(CONTAINER_PADDING_HORIZONTAL),
        paddingVertical: moderateScale(CONTAINER_PADDING_VERTICAL),
        minHeight: moderateScale(CONTAINER_MIN_HEIGHT),
      },
      iconContainer: {
        width: moderateScale(ICON_SIZE + ICON_PADDING),
        alignItems: 'center',
        justifyContent: 'center',
      },
      icon: {
        opacity: ICON_OPACITY,
      },
      textContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      },
      title: {
        textAlign: 'center',
        width: '100%',
        color: `${typeColor}${Math.round(TITLE_TEXT_OPACITY * 255).toString(16).padStart(2, '0')}`,
      },
      message: {
        textAlign: 'center',
        marginTop: 2,
        width: '100%',
        color: `${typeColor}${Math.round(MESSAGE_TEXT_OPACITY * 255).toString(16).padStart(2, '0')}`,
      },
      spacer: {
        width: moderateScale(ICON_SIZE + ICON_PADDING),
      },
    });

    return (
        <View style={styles.container}>
            <BlurView
                tint={isDark ? 'dark' : 'light'}
                intensity={BLUR_INTENSITY}
                style={styles.blurContainer}
            >
                <View style={styles.background} />

                <View style={styles.content}>
                    {/* 左边图标 */}
                    <View style={styles.iconContainer}>
                        <MaterialIcons
                            name={iconName}
                            size={iconSize}
                            color={typeColor}
                            style={styles.icon}
                        />
                    </View>

                    {/* 文字层：占据中心区域 */}
                    <View style={styles.textContainer}>
                        <Text
                            variant="bodyLarge"
                            style={styles.title}
                            numberOfLines={TITLE_MAX_LINES}
                            ellipsizeMode="tail"
                        >
                            {title}
                        </Text>
                        {message && (
                            <Text
                                variant="bodyMedium"
                                style={styles.message}
                                numberOfLines={MESSAGE_MAX_LINES}
                                ellipsizeMode="tail"
                            >
                                {message}
                            </Text>
                        )}
                    </View>

                    {/* 右边占位，保持对称 */}
                    <View style={styles.spacer} />
                </View>
            </BlurView>
        </View>
    );
});

// 设置 displayName 便于调试
ToastView.displayName = 'ToastView';