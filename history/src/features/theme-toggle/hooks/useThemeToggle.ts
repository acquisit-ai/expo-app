import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/providers/ThemeProvider';

type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * 主题切换逻辑 Hook
 * 提供主题选项数据和切换逻辑，不包含UI实现
 */
export const useThemeToggle = () => {
  const { themeMode, setThemeMode } = useTheme();

  const themeOptions: ThemeOption[] = [
    { mode: 'light', label: '浅色', icon: 'sunny-outline' },
    { mode: 'dark', label: '深色', icon: 'moon-outline' },
    { mode: 'auto', label: '跟随系统', icon: 'phone-portrait-outline' },
  ];

  // 计算当前选中的索引
  const selectedIndex = themeOptions.findIndex(option => option.mode === themeMode);

  // 提取标签数组，用于 SegmentedControl
  const labels = themeOptions.map(option => option.label);

  // 主题切换处理函数
  const handleThemeChange = useCallback(async (index: number) => {
    try {
      // 触发选择反馈 - 轻快的"嘀嗒"感，适合主题切换
      Haptics.selectionAsync();
      await setThemeMode(themeOptions[index].mode);
    } catch (error) {
      console.warn('主题切换失败:', error);
    }
  }, [setThemeMode, themeOptions]);

  return {
    themeOptions,
    selectedIndex: selectedIndex >= 0 ? selectedIndex : 2, // 默认选中"跟随系统"
    labels,
    handleThemeChange,
    currentThemeMode: themeMode
  };
};