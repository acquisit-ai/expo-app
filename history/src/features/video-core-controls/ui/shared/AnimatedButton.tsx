/**
 * 统一的动画按钮组件
 * 基于原有AnimatedIconButton重构，提供标准化接口
 */

import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from 'react-native-paper';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { getButtonDimensions } from '../../model/constants';
import type { ControlSize } from '../../model/types';

interface AnimatedButtonProps {
  /** 图标名称 */
  icon: string;
  /** 按钮尺寸 */
  size: ControlSize;
  /** 点击回调 */
  onPress: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 图标颜色 */
  iconColor?: string;
  /** 测试ID */
  testID?: string;
}

/**
 * 统一的动画按钮组件
 * 提供一致的动画效果和尺寸系统
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  icon,
  size,
  onPress,
  disabled = false,
  iconColor = '#FFFFFF',
  testID,
}) => {
  const { theme } = useTheme();
  const dimensions = getButtonDimensions(size);

  // 动画值
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePressIn = () => {
    if (disabled) return;

    // 按下动画：缩放 + 轻微旋转
    scale.value = withSpring(0.8, {
      damping: 12,
      stiffness: 300,
    });

    opacity.value = withTiming(0.6, { duration: 120 });

    // 微妙的旋转效果
    rotation.value = withSpring(-5, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    if (disabled) return;

    // 释放动画：弹性回弹
    scale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 500 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );

    opacity.value = withTiming(1, { duration: 250 });

    // 旋转回原位
    rotation.value = withSpring(0, {
      damping: 15,
      stiffness: 400,
    });
  };

  // 容器动画样式
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    width: dimensions.width,
    height: dimensions.height,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent',
    opacity: disabled ? 0.5 : 1,
  }));

  // 图标动画样式
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onPress}
      testID={testID}
    >
      <Animated.View style={containerAnimatedStyle}>
        <Animated.View style={iconAnimatedStyle}>
          <Icon
            source={icon}
            color={iconColor}
            size={dimensions.iconSize}
          />
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

AnimatedButton.displayName = 'AnimatedButton';