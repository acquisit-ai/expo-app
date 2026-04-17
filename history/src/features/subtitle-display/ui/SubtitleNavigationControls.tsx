/**
 * 字幕导航控件
 *
 * 提供上一句/下一句导航按钮
 * 通过Context获取数据，与外部hook/entity解耦
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useSubtitleDisplayContext } from '../hooks';

/**
 * 字幕导航控件Props（简化版）
 */
interface SubtitleNavigationControlsProps {
  /** 控件配置 */
  config?: {
    showLabels?: boolean;
    iconSize?: number;
    spacing?: number;
  };
  /** 样式覆盖 */
  style?: any;
}

/**
 * 字幕导航控件组件
 */
export function SubtitleNavigationControls({
  config = {},
  style,
}: SubtitleNavigationControlsProps) {
  const { actions, state, theme } = useSubtitleDisplayContext();

  const {
    showLabels = false,
    iconSize = 24,
    spacing = 16,
  } = config;

  if (state.sentences.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { gap: spacing }, style]}>
      {/* 上一句按钮 */}
      <View style={styles.buttonContainer}>
        <IconButton
          icon="skip-previous"
          size={iconSize}
          iconColor={state.hasPrevious ? theme.colors.onSurface : theme.colors.outline}
          disabled={!state.hasPrevious}
          onPress={actions.goToPrevious}
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.surface,
              opacity: state.hasPrevious ? 1 : 0.5,
            },
          ]}
        />
        {showLabels && (
          <Text
            variant="bodySmall"
            style={[
              styles.label,
              { color: state.hasPrevious ? theme.colors.onSurface : theme.colors.outline },
            ]}
          >
            上一句
          </Text>
        )}
      </View>


      {/* 下一句按钮 */}
      <View style={styles.buttonContainer}>
        <IconButton
          icon="skip-next"
          size={iconSize}
          iconColor={state.hasNext ? theme.colors.onSurface : theme.colors.outline}
          disabled={!state.hasNext}
          onPress={actions.goToNext}
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.surface,
              opacity: state.hasNext ? 1 : 0.5,
            },
          ]}
        />
        {showLabels && (
          <Text
            variant="bodySmall"
            style={[
              styles.label,
              { color: state.hasNext ? theme.colors.onSurface : theme.colors.outline },
            ]}
          >
            下一句
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    margin: 0,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
  },
});