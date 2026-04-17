import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { moderateScale } from '@/shared/lib/metrics';
import { fontSize, fontWeight, borderRadius, borderWidth } from '@/shared/config/theme/tokens';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const themeOptions: ThemeOption[] = [
  { mode: 'light', label: '浅色', icon: 'sunny-outline' },
  { mode: 'dark', label: '深色', icon: 'moon-outline' },
  { mode: 'auto', label: '跟随系统', icon: 'phone-portrait-outline' },
];

interface ThemeToggleProps {
  /** 自定义样式 */
  style?: ViewStyle;
}

export function ThemeToggle({ style }: ThemeToggleProps) {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();

  // 使用 useCallback 优化事件处理函数
  const handleThemeSelect = useCallback(async (mode: ThemeMode) => {
    try {
      await setThemeMode(mode);
    } catch (error) {
      console.warn('主题切换失败:', error);
    }
  }, [setThemeMode]);

  // 预计算样式以提升性能，使用类型安全的主题对象
  const dynamicStyles = useMemo(() =>
    createDynamicStyles(theme, isDark), [theme, isDark]
  );

  return (
    <View style={[dynamicStyles.container, style]}>
      {themeOptions.map((option) => {
        const isSelected = themeMode === option.mode;

        return (
          <ThemeOption
            key={option.mode}
            option={option}
            isSelected={isSelected}
            onPress={handleThemeSelect}
            styles={dynamicStyles}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

// 主题选项组件，拆分职责以提高可读性和性能
interface ThemeOptionProps {
  option: ThemeOption;
  isSelected: boolean;
  onPress: (mode: ThemeMode) => void;
  styles: any;
  theme: any;
}

const ThemeOption = React.memo(({ option, isSelected, onPress, styles, theme }: ThemeOptionProps) => {
  const handlePress = useCallback(() => {
    // 触发选择反馈 - 轻快的"嘀嗒"感，适合主题切换
    Haptics.selectionAsync();
    onPress(option.mode);
  }, [onPress, option.mode]);

  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        isSelected ? styles.selectedButton : styles.unselectedButton
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={option.icon}
        size={moderateScale(20)}
        color={isSelected ? theme.colors.primary : theme.colors.textMedium}
      />
      <Text
        style={[
          styles.optionText,
          isSelected ? styles.selectedText : styles.unselectedText
        ]}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );
});

ThemeOption.displayName = 'ThemeOption';

// 样式缓存，避免重复创建 StyleSheet
const styleCache = new Map<string, any>();

// 动态样式创建函数，基于主题，使用设计令牌
const createDynamicStyles = (theme: any, isDark: boolean) => {
  // 创建缓存键，基于主题的关键属性
  const cacheKey = `${theme.colors.primary}-${theme.colors.textMedium}-${theme.colors.outline}`;

  if (styleCache.has(cacheKey)) {
    return styleCache.get(cacheKey);
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      borderRadius: moderateScale(borderRadius.lg),
      padding: moderateScale(3),
      gap: moderateScale(15),
    },
    optionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: moderateScale(10),
      paddingHorizontal: moderateScale(8),
      borderRadius: moderateScale(borderRadius.lg),
      borderWidth: borderWidth.normal,
      gap: moderateScale(5),
      minHeight: moderateScale(36),
    },
    selectedButton: {
      backgroundColor: theme.colors.primary + '15',
      borderColor: theme.colors.primary,
    },
    unselectedButton: {
      backgroundColor: 'transparent',
      borderColor: isDark ? theme.colors.outline : theme.colors.borderCream,
    },
    optionText: {
      fontSize: moderateScale(fontSize.xs),
      textAlign: 'center',
      includeFontPadding: false,
    },
    selectedText: {
      color: theme.colors.primary,
      fontWeight: fontWeight.semibold,
    },
    unselectedText: {
      color: theme.colors.textMedium,
      fontWeight: fontWeight.medium,
    },
  });

  // 缓存样式以提升性能
  styleCache.set(cacheKey, styles);
  return styles;
};