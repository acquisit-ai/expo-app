import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/providers/ThemeProvider';

interface LinearProgressProps {
  progress: number;          // 0 - 1
  height?: number;
  trackColor?: string;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LinearProgress({
  progress,
  height = 6,
  trackColor,
  fillColor,
  borderColor,
  borderWidth = 0,
  rounded = true,
  style,
}: LinearProgressProps) {
  const { theme } = useTheme();
  const clamped = Math.max(0, Math.min(progress, 1));

  const trackStyles: StyleProp<ViewStyle> = [
    styles.track,
    {
      height,
      backgroundColor: trackColor ?? theme.colors.surfaceVariant ?? 'rgba(255,255,255,0.12)',
      borderColor: borderColor ?? theme.colors.outlineVariant ?? 'rgba(255,255,255,0.25)',
      borderWidth,
      borderRadius: rounded ? height / 2 : 0,
    },
    style,
  ];

  const fillStyles: StyleProp<ViewStyle> = [
    styles.fill,
    {
      width: `${clamped * 100}%`,
      backgroundColor: fillColor ?? theme.colors.primary,
      borderRadius: rounded ? height / 2 : 0,
    },
  ];

  return (
    <View style={trackStyles}>
      <View style={fillStyles} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
