/**
 * 动画播放按钮组件
 * 专用于视频控件覆盖层的播放按钮，带有100ms渐变动画
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useVideoCoreControls } from '@/features/video-core-controls';

interface AnimatedPlayButtonProps {
  /** 是否显示播放按钮 */
  visible: boolean;
}

/**
 * 动画播放按钮
 * 根据播放状态和可见性自动切换显示，带有渐变动画效果
 */
export const AnimatedPlayButton: React.FC<AnimatedPlayButtonProps> = React.memo(({ visible }) => {
  const { isPlaying } = useVideoCoreControls();

  // 可见性动画值
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  // 始终显示播放图标，因为暂停功能由控件层的按钮处理
  const iconName = 'play-circle';

  // 更新动画值
  useEffect(() => {
    if (visible && !isPlaying) {
      // 显示动画：200ms渐变 + 轻微缩放效果
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    } else {
      // 隐藏动画：200ms淡出
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible, isPlaying, opacity, scale]);

  // 动画样式
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {
          scale: interpolate(
            opacity.value,
            [0, 1],
            [0.8, 1],
            Extrapolate.CLAMP
          )
        }
      ],
    };
  });

  // 容器动画样式（用于快速隐藏）
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0 ? 'none' : 'none' as const,
  }));

  return (
    <Animated.View style={[styles.playButtonOverlay, containerAnimatedStyle]}>
      <Animated.View style={[styles.playButton, animatedStyle]}>
        <Ionicons
          name={iconName}
          size={80}
          color="rgba(255, 255, 255, 0.9)"
          style={styles.playIcon}
        />
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none', // 让触摸事件穿透到父组件
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
    // 添加阴影效果增强视觉层次
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android阴影
  },
  playIcon: {
    // 图标自身已经包含了正确的尺寸和挖空效果
  },
});

AnimatedPlayButton.displayName = 'AnimatedPlayButton';
