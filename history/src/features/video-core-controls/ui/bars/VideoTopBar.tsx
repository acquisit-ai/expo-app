/**
 * 视频顶部控制栏
 * 集成导航控制功能的标准化组件
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ControlBar } from '../shared/ControlBar';
import { ControlBarSection } from '../shared/ControlBarSection';
import { ControlGroup } from '../shared/ControlGroup';
import { BackButton } from '../controls/BackButton';
import { AnimatedButton } from '../shared/AnimatedButton';
import { useTheme } from '@/shared/providers/ThemeProvider';
import type { VideoTopBarProps } from '../../model/types';

/**
 * 视频顶部控制栏
 * 重构自原有VideoTopBar，提供标准化接口
 */
export const VideoTopBar: React.FC<VideoTopBarProps> = React.memo(({
  showBack = true,
  onBack,
  title,
  showTitle = false,
  showSettings = false,
  onSettings,
  size,
  transparent = false,
  onInteraction,
  topPadding = 0,
}) => {
  const { theme } = useTheme();

  return (
    <ControlBar
      position="top"
      size={size}
      transparent={transparent}
      gradient={transparent ? 'none' : 'top'}
      topPadding={topPadding}
    >
      {/* 左侧：导航控制 */}
      <ControlBarSection align="left">
        <ControlGroup align="left" spacing="sm">
          {showBack && (
            <BackButton
              size={size}
              onPress={onBack}
              onInteraction={onInteraction}
            />
          )}
        </ControlGroup>
      </ControlBarSection>

      {/* 中心：标题（可选） */}
      <ControlBarSection align="center" flex={1}>
        {showTitle && title && (
          <Text style={[styles.title, { color: '#FFFFFF' }]}>
            {title}
          </Text>
        )}
      </ControlBarSection>

      {/* 右侧：设置等附加功能 */}
      <ControlBarSection align="right">
        <ControlGroup align="right" spacing="sm">
          {showSettings && (
            <AnimatedButton
              icon="cog"
              size={size}
              onPress={() => {
                onSettings?.();
                onInteraction?.();
              }}
              testID="settings-button"
            />
          )}
        </ControlGroup>
      </ControlBarSection>
    </ControlBar>
  );
});

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    // 添加文字阴影
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

VideoTopBar.displayName = 'VideoTopBar';