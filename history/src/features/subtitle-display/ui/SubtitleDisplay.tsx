/**
 * 字幕显示组件
 *
 * 展示当前字幕句子，支持自定义样式和渲染
 * 通过Context获取数据，与外部hook/entity解耦
 *
 * 性能优化：使用 React.memo 避免不必要的重渲染
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSubtitleDisplayContext } from '../hooks';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useGlobalSettings, selectShowSubtitles, selectShowTranslation } from '@/entities/global-settings';
import type { Sentence, SubtitleToken } from '@/entities/subtitle';
import { shouldAddSpaceBefore, isClickableToken } from './SubtitleToken';

/**
 * 字幕显示组件Props
 */
interface SubtitleDisplayProps {
  /** 样式覆盖 */
  style?: any;
}

/**
 * 字幕显示组件
 */
export const SubtitleDisplay = React.memo(function SubtitleDisplay({
  style,
}: SubtitleDisplayProps) {
  const { state, actions, config: finalConfig } = useSubtitleDisplayContext();
  const { theme } = useTheme();
  const showSubtitles = useGlobalSettings(selectShowSubtitles);
  const showTranslation = useGlobalSettings(selectShowTranslation);

  // 如果字幕和翻译都不显示，或没有当前句子，不渲染
  // 两个开关是独立的：只要有一个开启就需要渲染组件
  if ((!showSubtitles && !showTranslation) || !state.currentSentence) {
    return null;
  }

  // 渲染token化的句子
  const getTokenKey = (token: SubtitleToken, sentenceIndex: number): string => {
    const elementId = token.semanticElement?.id;
    if (elementId !== undefined && elementId !== null) {
      return String(elementId);
    }
    return `${sentenceIndex}:${token.index}`;
  };

  const renderTokenizedSentence = (sentence: Sentence, isActive: boolean) => {
    const baseTextStyle = [
      styles.subtitleText,
      {
        fontSize: finalConfig.fontSize,
        color: finalConfig.fontColor,
      },
      isActive && styles.activeText,
    ];

    // 展平样式对象供Token使用
    const flattenedTextStyle = StyleSheet.flatten(baseTextStyle);

    return (
      <Text style={baseTextStyle}>
        {sentence.tokens?.map((token: SubtitleToken, index: number) => {
          const needsSpace = shouldAddSpaceBefore(token, index);
          const tokenKey = getTokenKey(token, sentence.index);
          const isSelected = state.selectedTokens.has(tokenKey);
          const isModalHighlighted = state.modalHighlightedToken === tokenKey;
          const isClickable = isClickableToken(token);

          // 构建嵌套Text的样式
          const nestedTextStyle = [
            flattenedTextStyle,
            // Modal高亮优先级最高
            isModalHighlighted && isClickable && {
              color: theme.colors.primary,
            },
            // 普通选中状态
            !isModalHighlighted && isSelected && isClickable && {
              color: theme.colors.primary,
            },
          ];

          return (
            <React.Fragment key={`${tokenKey}-${index}`}>
              {needsSpace && ' '}
              <Text
                style={nestedTextStyle}
                onPress={isClickable ? () => {
                  Haptics.selectionAsync();
                  actions.showTokenExplanation(token, sentence.index);
                } : undefined}
                suppressHighlighting={true}
              >
                {token.text}
              </Text>
            </React.Fragment>
          );
        })}
      </Text>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: finalConfig.backgroundOpacity === 0 ? 'transparent' : `${finalConfig.backgroundColor}${Math.round(finalConfig.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
        },
        getPositionStyle(finalConfig.position),
        style,
      ]}
    >
      {/* 可点击的字幕文本 - 受 showSubtitles 控制 */}
      {showSubtitles && renderTokenizedSentence(state.currentSentence, true)}

      {/* 不可点击的句子翻译 - 受 showTranslation 控制 */}
      {showTranslation && state.currentSentence.explanation && (
        <Text
          style={[
            styles.translationText,
            {
              fontSize: finalConfig.fontSize * 0.85, // 稍小于主字幕
              color: finalConfig.fontColor,
            }
          ]}
        >
          {state.currentSentence.explanation}
        </Text>
      )}
    </View>
  );
}, () => {
  // 自定义比较函数：SubtitleDisplay 从 Context 获取数据，不依赖 props
  // 只有 style prop，但它通常是静态的
  // 始终返回 true 表示永远不因 props 变化重渲染
  // 组件会因 Context 变化或 useGlobalSettings 变化而重渲染
  return true;
});

/**
 * 获取位置样式
 * 使用屏幕高度百分比，适配不同尺寸设备
 */
function getPositionStyle(position: 'top' | 'center' | 'bottom') {
  switch (position) {
    case 'top':
      return {
        position: 'absolute' as const,
        top: '10%',  // 基于屏幕高度的10%
        left: 20,
        right: 20,
      };
    case 'center':
      return {
        position: 'absolute' as const,
        top: '50%',
        left: 20,
        right: 20,
        transform: [{ translateY: -20 }],
      };
    case 'bottom':
    default:
      return {
        position: 'absolute' as const,
        bottom: '10%',  // 基于屏幕高度的10%，适配所有设备
        left: 20,
        right: 20,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: 40,
  },
  subtitleText: {
    textAlign: 'left',
    fontWeight: '500',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  activeText: {
    fontWeight: '600',
  },
  translationText: {
    textAlign: 'left',
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 6,
    opacity: 0.85, // 半透明，区分主字幕
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
