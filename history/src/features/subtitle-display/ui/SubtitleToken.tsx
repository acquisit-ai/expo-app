/**
 * 字幕Token组件
 *
 * 统一容器结构，确保可点击和不可点击token完美对齐
 */

import React from 'react';
import { Text, TouchableOpacity, TextStyle } from 'react-native';
import type { SubtitleToken } from '@/entities/subtitle';
import { useTheme } from '@/shared/providers/ThemeProvider';

interface SubtitleTokenProps {
  token: SubtitleToken;
  isSelected?: boolean;
  isModalHighlighted?: boolean;
  onPress?: (token: SubtitleToken) => void;
  baseStyle?: TextStyle;
}

/**
 * 统一的Token容器组件
 * 所有token使用相同的容器结构确保完美对齐
 */
function TokenContainer({
  token,
  isSelected,
  isModalHighlighted,
  onPress,
  baseStyle,
  isClickable,
}: SubtitleTokenProps & { isClickable: boolean }) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (isClickable && onPress) {
      onPress(token);
    }
  };

  const textStyle = [
    baseStyle,
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
    <TouchableOpacity
      disabled={!isClickable}
      onPress={handlePress}
      activeOpacity={isClickable ? 0.7 : 1}
      hitSlop={isClickable ? { top: 4, bottom: 4, left: 2, right: 2 } : { top: 0, bottom: 0, left: 0, right: 0 }}
    >
      <Text style={textStyle}>
        {token.text}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * 判断token是否可点击
 */
export function isClickableToken(token: SubtitleToken): boolean {
  return Boolean(token.explanation?.trim());
}

/**
 * 判断是否需要在token前添加空格
 */
export function shouldAddSpaceBefore(token: SubtitleToken, index: number): boolean {
  if (index === 0) return false; // 第一个token前不加空格

  // 标点符号前不加空格
  const punctuation = ['.', ',', '!', '?', ';', ':', ')', ']', '}', '"', "'"];
  if (punctuation.includes(token.text?.trim() || '')) {
    return false;
  }

  return true; // 其他情况都加空格
}

/**
 * 字幕Token组件
 * 使用统一容器确保所有token完美对齐
 */
export function SubtitleToken({
  token,
  isSelected,
  isModalHighlighted,
  onPress,
  baseStyle,
}: SubtitleTokenProps) {
  const clickable = isClickableToken(token);

  return (
    <TokenContainer
      token={token}
      isSelected={isSelected || false}
      isModalHighlighted={isModalHighlighted || false}
      onPress={onPress}
      baseStyle={baseStyle}
      isClickable={clickable}
    />
  );
}