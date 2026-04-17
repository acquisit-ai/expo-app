/**
 * 集成字幕视图
 *
 * 组合字幕显示和导航控件，提供完整的字幕交互体验
 * 作为Context Provider，只有此组件与外部hook/entity耦合
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSubtitleDisplay } from '../hooks/useSubtitleDisplay';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { SubtitleDisplayProvider } from '../hooks';
import { SubtitleDisplay } from './SubtitleDisplay';
import type { IntegratedSubtitleViewProps } from '../model/types';

/**
 * 集成字幕视图组件
 * 用于在视频播放器中展示完整的字幕功能
 */
export function IntegratedSubtitleView({
  config = {},
  containerStyle,
  subtitleStyle,
  controlsStyle,
}: IntegratedSubtitleViewProps) {
  const { state, actions, config: finalConfig } = useSubtitleDisplay(config);
  const { theme } = useTheme();

  // 构建Context值，包含所有子组件需要的数据
  const contextValue = useMemo(() => ({
    state,
    actions,
    config: finalConfig,
    theme: {
      colors: {
        onSurface: theme.colors.onSurface,
        outline: theme.colors.outline,
        surface: theme.colors.surface,
      },
    },
  }), [state, actions, finalConfig, theme]);

  // 如果字幕不可用或被禁用，不渲染
  if (!finalConfig.enabled || state.sentences.length === 0) {
    return null;
  }

  return (
    <SubtitleDisplayProvider value={contextValue}>
      <View style={[styles.container, containerStyle]} pointerEvents="box-none">
        {/* 字幕显示区域 */}
        <SubtitleDisplay style={subtitleStyle} />

        {/* 导航控件已移除，保留位置供未来功能使用 */}
      </View>
    </SubtitleDisplayProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    borderRadius: 8,
    marginHorizontal: 20,
  },
});