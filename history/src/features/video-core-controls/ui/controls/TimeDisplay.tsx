/**
 * 时间显示组件
 * 显示当前播放时间或剩余时间
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { formatTime } from '@/shared/lib/time-format';
import { log, LogType } from '@/shared/lib/logger';
import { getTimeTextDimensions } from '../../model/constants';
import type { TimeDisplayProps } from '../../model/types';
import { useVideoCoreControls } from '../../hooks/VideoCoreControlsContext';

/**
 * 时间显示组件
 * 支持不同格式和显示模式
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = React.memo(({
  size,
  format = 'auto',
  showRemaining = false,
  disabled = false,
  testID = 'time-display',
  currentTime = 0,
  duration = 0,
}) => {
  const { theme } = useTheme();
  const { playbackControlsOpacity = 1, playbackControlsPointerEvents = 'auto' } = useVideoCoreControls();
  const dimensions = getTimeTextDimensions(size);

  // 格式化时间
  const formatDisplayTime = (time: number) => {
    try {
      // formatTime函数只接受一个参数，自动根据时长选择格式
      return formatTime(Math.max(0, time));
    } catch (error) {
      log('time-display', LogType.WARNING, `Error formatting time: ${error}`);
      return '0:00'; // 默认显示
    }
  };

  const displayTime = showRemaining
    ? formatDisplayTime(Math.max(0, duration - currentTime))
    : formatDisplayTime(currentTime);

  const textStyle = [
    styles.timeText,
    {
      fontSize: dimensions.fontSize,
      minWidth: dimensions.minWidth,
      color: disabled ? theme.colors.onSurface + '80' : '#FFFFFF',
      opacity: playbackControlsOpacity,
    },
  ];

  return (
    <Text
      style={textStyle}
      testID={testID}
      accessibilityLabel={`当前时间: ${displayTime}`}
      pointerEvents={playbackControlsPointerEvents}
    >
      {displayTime}
    </Text>
  );
});

const styles = StyleSheet.create({
  timeText: {
    fontWeight: '500',
    textAlign: 'center',
    // 添加文字阴影增强可读性
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

TimeDisplay.displayName = 'TimeDisplay';