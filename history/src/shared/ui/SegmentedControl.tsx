import React from 'react';
import { ViewStyle } from 'react-native';
import SegmentedControlLib from '@react-native-segmented-control/segmented-control';
import { useTheme } from '@/shared/providers/ThemeProvider';

interface SegmentedControlProps {
  /** 分段选项的标签 */
  values: string[];
  /** 当前选中的索引 */
  selectedIndex: number;
  /** 选择变化的回调函数 */
  onChange: (event: { nativeEvent: { selectedSegmentIndex: number } }) => void;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 是否禁用 */
  enabled?: boolean;
}

/**
 * 主题化的分段控制器组件
 * 自动适配应用主题，无需手动传递颜色参数
 */
export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  values,
  selectedIndex,
  onChange,
  style,
  enabled = true,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <SegmentedControlLib
      values={values}
      selectedIndex={selectedIndex}
      onChange={onChange}
      style={style}
      enabled={enabled}
      appearance={isDark ? 'dark' : 'light'}
      tintColor={theme.colors.primary}
      fontStyle={{ color: theme.colors.textMedium }}
      activeFontStyle={{ color: theme.colors.onPrimary }}
    />
  );
};