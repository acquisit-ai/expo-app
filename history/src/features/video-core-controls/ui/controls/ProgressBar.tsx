/**
 * 视频进度条组件
 * 纯UI进度条组件，不包含状态管理逻辑
 *
 * 架构原则：
 * - 纯UI组件，零业务逻辑
 * - 状态管理由外部Hook处理
 * - 只负责显示和用户交互事件
 */

import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { useSharedValue } from 'react-native-reanimated';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { log, LogType } from '@/shared/lib/logger';
import { getProgressBarDimensions } from '../../model/constants';
import type { ProgressBarProps } from '../../model/types';
import { useVideoCoreControls } from '../../hooks/VideoCoreControlsContext';

/**
 * 纯UI进度条组件
 * 只负责显示和交互事件，状态管理由外部Hook处理
 *
 * 性能优化：使用 React.memo 和自定义比较函数
 */
export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  size,
  disabled = false,
  draggable = true,
  showBuffer = true,
  testID = 'progress-bar',
  onInteraction,
  onDragStart,
  onDragEnd,
  onValueChange,
  // 数据props
  currentTime = 0,
  bufferedTime = 0,
  duration = 0,
  onSeek,
}) => {
  const { theme } = useTheme();
  const { playbackControlsOpacity = 1, playbackControlsPointerEvents = 'auto' } = useVideoCoreControls();
  const dimensions = getProgressBarDimensions(size);

  // Reanimated shared values - 纯UI状态
  const progress = useSharedValue(0);
  const cache = useSharedValue(0);
  const min = useSharedValue(0);
  const max = useSharedValue(1);

  // 同步数据到UI状态 - currentTime现在是Hook的displayTime，包含了正确的状态管理
  useEffect(() => {
    try {
      max.value = duration > 0 ? duration : 1;
      progress.value = Math.max(0, Math.min(currentTime, duration || 0));
    } catch (error) {
      log('progress-bar', LogType.WARNING, `Error updating progress values: ${error}`);
    }
  }, [currentTime, duration, max, progress]);

  // 同步缓冲进度
  useEffect(() => {
    try {
      if (showBuffer) {
        cache.value = Math.max(0, Math.min(bufferedTime, duration || 0));
      }
    } catch (error) {
      log('progress-bar', LogType.WARNING, `Error updating cache: ${error}`);
    }
  }, [bufferedTime, showBuffer, cache, duration]);

  // 简化的交互回调 - 直接委托给外部Hook
  const handleSlidingStart = useCallback(() => {
    onInteraction?.();
    onDragStart?.();
  }, [onInteraction, onDragStart]);

  const handleValueChange = useCallback((value: number) => {
    onValueChange?.(value);
  }, [onValueChange]);

  const handleSlidingComplete = useCallback((value: number) => {
    try {
      const clampedValue = Math.max(0, Math.min(value, duration || 0));
      onInteraction?.();
      onDragEnd?.(clampedValue);
      onSeek?.(clampedValue);
    } catch (error) {
      log('progress-bar', LogType.WARNING, `Error in handleSlidingComplete: ${error}`);
    }
  }, [onInteraction, onDragEnd, onSeek, duration]);

  const containerStyle = [
    styles.container,
    {
      height: dimensions.height,
      paddingVertical: dimensions.paddingVertical,
      opacity: playbackControlsOpacity,
    },
  ];

  const sliderStyle = [
    styles.slider,
    {
      height: dimensions.sliderHeight,
    },
  ];

  return (
    <View style={containerStyle} pointerEvents={playbackControlsPointerEvents}>
      <Slider
        style={sliderStyle}
        progress={progress}
        cache={showBuffer ? cache : undefined}
        minimumValue={min}
        maximumValue={max}
        disable={disabled || !draggable}
        onSlidingStart={handleSlidingStart}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        containerStyle={styles.sliderContainer}
        renderBubble={() => <View />} // 空白bubble
        theme={{
          minimumTrackTintColor: 'white',
          maximumTrackTintColor: 'rgba(255, 255, 255, 0.3)',
          cacheTrackTintColor: showBuffer ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
          heartbeatColor: 'transparent',
        }}
        testID={testID}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 0,
  },
  slider: {
    width: '100%',
  },
  sliderContainer: {
    borderRadius: 4,
  },
});

ProgressBar.displayName = 'ProgressBar';