/**
 * 通用动画按钮组件
 * 支持自定义图标、样式和动画效果的可复用按钮
 */

import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { VIDEO_PLAYER_CONSTANTS } from '../../model/constants';

const { INTERACTION } = VIDEO_PLAYER_CONSTANTS;

/**
 * 图标类型
 */
export type IconType = 'paper' | 'ionicons';

/**
 * 动画按钮组件Props
 */
export interface AnimatedButtonProps {
  /** 图标类型 */
  iconType?: IconType;
  /** 图标名称 */
  icon: string;
  /** 图标颜色 */
  iconColor?: string;
  /** 图标大小 */
  size?: number;
  /** 是否可以按动 */
  disabled?: boolean;
  /** 点击处理器 */
  onPress?: () => void;
  /** 容器样式 */
  containerStyle?: StyleProp<ViewStyle>;
  /** 按钮样式 */
  buttonStyle?: StyleProp<ViewStyle>;
  /** 动画样式 */
  animatedStyle?: AnimatedStyle<ViewStyle>;
  /** 是否显示阴影 */
  showShadow?: boolean;
}

/**
 * 通用动画按钮组件
 * 可配置图标、样式和动画效果
 */
export const AnimatedButton = React.memo(function AnimatedButton({
  iconType = 'paper',
  icon,
  iconColor = INTERACTION.BUTTON_COLORS.WHITE_TRANSPARENT,
  size = 32,
  disabled = false,
  onPress,
  containerStyle,
  buttonStyle,
  animatedStyle,
  showShadow = false,
}: AnimatedButtonProps) {
  const shadowStyle = showShadow ? styles.shadow : undefined;

  const content = iconType === 'paper' ? (
    <IconButton
      icon={icon}
      iconColor={iconColor}
      size={size}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, buttonStyle]}
    />
  ) : (
    <Ionicons
      name={icon as any}
      size={size}
      color={iconColor}
      style={styles.ionicon}
    />
  );

  return (
    <Animated.View
      style={[
        styles.container,
        shadowStyle,
        containerStyle,
        animatedStyle
      ]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      {iconType === 'ionicons' && onPress && !disabled ? (
        <Animated.View
          style={styles.touchableArea}
          onTouchEnd={onPress}
        >
          {content}
        </Animated.View>
      ) : (
        content
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    margin: 0,
  },
  ionicon: {
    // Ionicons样式
  },
  touchableArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android阴影
  },
});