/**
 * React Native Paper 主题配置
 * 基于 Material Design 3 主题系统，集成自定义颜色
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { spacing, fontSize, fontWeight, lineHeight, borderRadius, borderWidth, shadows, duration, typography } from './tokens';
import { lightColors, darkColors } from './colors';
import type { ThemeColors } from './types';

/**
 * 浅色主题
 * 继承 Material Design 3 浅色主题并自定义颜色
 */
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // 主色系
    primary: lightColors.primary,
    primaryContainer: lightColors.primaryContainer,
    onPrimary: lightColors.onPrimary,
    onPrimaryContainer: lightColors.onPrimaryContainer,

    // 功能色彩
    error: lightColors.error,
    errorContainer: lightColors.errorContainer,
    onError: lightColors.onError,
    onErrorContainer: lightColors.onErrorContainer,

    // 表面色彩
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceVariant,
    onSurface: lightColors.onSurface,
    onSurfaceVariant: lightColors.onSurfaceVariant,

    // 背景色彩
    background: lightColors.background,
    onBackground: lightColors.onBackground,

    // 边框和分割线
    outline: lightColors.outline,
    outlineVariant: lightColors.outlineVariant,
  },
};

/**
 * 深色主题
 * 继承 Material Design 3 深色主题并自定义颜色
 */
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // 主色系
    primary: darkColors.primary,
    primaryContainer: darkColors.primaryContainer,
    onPrimary: darkColors.onPrimary,
    onPrimaryContainer: darkColors.onPrimaryContainer,

    // 功能色彩
    error: darkColors.error,
    errorContainer: darkColors.errorContainer,
    onError: darkColors.onError,
    onErrorContainer: darkColors.onErrorContainer,

    // 表面色彩
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceVariant,
    onSurface: darkColors.onSurface,
    onSurfaceVariant: darkColors.onSurfaceVariant,

    // 背景色彩
    background: darkColors.background,
    onBackground: darkColors.onBackground,

    // 边框和分割线
    outline: darkColors.outline,
    outlineVariant: darkColors.outlineVariant,
  },
};

/**
 * 扩展的主题类型
 * 在 Paper 主题基础上添加自定义属性
 */
export interface ExtendedTheme extends MD3Theme {
  colors: MD3Theme['colors'] & ThemeColors;

  // 设计令牌
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
  borderRadius: typeof borderRadius;
  borderWidth: typeof borderWidth;
  shadows: typeof shadows;
  duration: typeof duration;
  typography: typeof typography;
}

/**
 * 创建扩展主题的辅助函数
 */
const createExtendedTheme = (baseTheme: MD3Theme, themeColors: any): ExtendedTheme => ({
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...themeColors,
  },

  // 设计令牌
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  borderRadius,
  borderWidth,
  shadows,
  duration,
  typography,
});

/**
 * 扩展的浅色主题
 */
export const extendedLightTheme: ExtendedTheme = createExtendedTheme(lightTheme, lightColors);

/**
 * 扩展的深色主题
 */
export const extendedDarkTheme: ExtendedTheme = createExtendedTheme(darkTheme, darkColors);

/**
 * 主题配置对象
 */
export const paperThemes = {
  light: extendedLightTheme,
  dark: extendedDarkTheme,
} as const;

/**
 * 获取 Paper 主题
 */
export const getPaperTheme = (isDark: boolean): ExtendedTheme => {
  return isDark ? paperThemes.dark : paperThemes.light;
};