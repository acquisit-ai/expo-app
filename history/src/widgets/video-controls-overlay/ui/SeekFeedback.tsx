/**
 * 快进回退视觉反馈组件 - 性能优化版
 * 在屏幕左右对称位置显示快进/回退反馈动画
 *
 * 🚀 性能优化：
 * - 使用 useDerivedValue 预计算位置（UI线程）
 * - 减少动画嵌套层级
 * - 使用 useMemo 缓存屏幕宽度
 * - 优化动画配置，减少重绘
 */

import React, { useMemo } from 'react';
import { StyleSheet, Dimensions, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface SeekFeedbackProps {
  /** 快进反馈透明度动画值 */
  forwardOpacity: SharedValue<number>;
  /** 回退反馈透明度动画值 */
  backwardOpacity: SharedValue<number>;
}

// 常量配置
const FEEDBACK_SIZE = 120;
// 🚀 优化动画配置 - 使用线性缓动减少计算
const ANIMATION_CONFIG = {
  duration: 120,  // 减少到120ms，更快响应
  easing: Easing.linear,  // 线性缓动性能最佳
};

// 反馈项配置
interface FeedbackItemConfig {
  opacity: SharedValue<number>;
  positionRatio: number;
  iconName: 'chevron-left' | 'chevron-right';
  text: string;
}

/**
 * 单个反馈项组件 - 性能优化版
 */
const FeedbackItem: React.FC<{ config: FeedbackItemConfig; leftPosition: number }> = React.memo(({
  config,
  leftPosition,
}) => {
  // 🚀 优化1：预计算scale值（UI线程）
  const scale = useDerivedValue(() => {
    return config.opacity.value > 0 ? 1 : 0.8;
  }, [config.opacity]);

  // 🚀 优化2：直接使用 SharedValue，无额外动画（动画在触发时已处理）
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: config.opacity.value,  // 直接使用，不加 withTiming
      transform: [
        {
          scale: scale.value,  // 直接使用，不加 withTiming
        },
      ],
    };
  }, [config.opacity, scale]);

  return (
    <Animated.View style={[styles.feedbackCircle, animatedStyle, { left: leftPosition }]}>
      {/* 🚀 优化3：移除嵌套Animated.View，直接使用View */}
      <MaterialCommunityIcons
        name={config.iconName}
        size={48}
        color="#FFFFFF"
        style={styles.icon}
      />
      {/* 🚀 优化4：使用普通Text替代Animated.Text */}
      <Text style={[styles.feedbackText, styles.textBottom]}>
        {config.text}
      </Text>
    </Animated.View>
  );
});

FeedbackItem.displayName = 'FeedbackItem';

/**
 * 快进回退视觉反馈组件 - 性能优化版
 */
export const SeekFeedback: React.FC<SeekFeedbackProps> = React.memo(({
  forwardOpacity,
  backwardOpacity,
}) => {
  // 🚀 优化5：useMemo 缓存屏幕宽度和位置计算
  const screenWidth = useMemo(() => Dimensions.get('window').width, []);
  const leftPositionForward = useMemo(() => screenWidth * 0.8 - FEEDBACK_SIZE / 2, [screenWidth]);
  const leftPositionBackward = useMemo(() => screenWidth * 0.2 - FEEDBACK_SIZE / 2, [screenWidth]);

  // 🚀 优化6：稳定的配置对象，避免每次渲染重建
  const feedbackConfigs = useMemo(() => [
    {
      opacity: forwardOpacity,
      iconName: 'chevron-right' as const,
      text: '下一句',
      leftPosition: leftPositionForward,
    },
    {
      opacity: backwardOpacity,
      iconName: 'chevron-left' as const,
      text: '上一句',
      leftPosition: leftPositionBackward,
    },
  ], [forwardOpacity, backwardOpacity, leftPositionForward, leftPositionBackward]);

  return (
    <Animated.View style={styles.container}>
      {feedbackConfigs.map((config, index) => (
        <FeedbackItem
          key={index}
          config={{
            opacity: config.opacity,
            iconName: config.iconName,
            text: config.text,
            positionRatio: 0, // 不再使用，仅为兼容类型
          }}
          leftPosition={config.leftPosition}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 10,
  },
  feedbackCircle: {
    position: 'absolute',
    width: FEEDBACK_SIZE,
    height: FEEDBACK_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 🚀 优化7：将阴影样式直接应用到图标
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  textBottom: {
    position: 'absolute',
    bottom: 20,
  },
});

SeekFeedback.displayName = 'SeekFeedback';
