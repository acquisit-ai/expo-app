/**
 * 主题颜色常量
 * 集中管理所有颜色值，避免重复定义
 */

/**
 * 基础调色板
 * 定义项目中使用的原始颜色值
 */
export const palette = {
  // 主色系
  blue: {
    primary: '#007AFF',
    light: '#0A84FF',
    container: '#E3F2FD',
    onContainer: '#001F25',
  },

  // 功能色系
  green: {
    primary: '#34C759',
    light: '#30D158',
    container: '#E8F5E8',
    darkContainer: '#1B5E20',
    onContainer: '#1B5E20',
    onDarkContainer: '#C8E6C9',
  },

  red: {
    primary: '#FF3B30',
    light: '#FF453A',
    container: '#FFEBEE',
    darkContainer: '#93000A',
    onContainer: '#410002',
    onDarkContainer: '#FFDAD6',
  },

  orange: {
    primary: '#FF9500',
    container: '#FFF3E0',
    darkContainer: '#E65100',
    onContainer: '#E65100',
    onDarkContainer: '#FFE0B2',
  },

  // 中性色系
  gray: {
    50: '#F2F2F7',
    100: '#E5E5EA',
    200: '#C6C6C8',
    300: '#8E8E93',
    400: '#636366',
    500: '#48484A',
    600: '#38383A',
    700: '#2C2C2E',
    800: '#1C1C1E',
    900: '#000000',
  },

  // 奶糖色系 (用于边框和细微装饰)
  cream: {
    border: '#e8e7e3', // RGB 232,231,227 - 奶糖色边框
  },

  // 纯色
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * 浅色主题颜色配置
 */
export const lightColors = {
  // 主色系
  primary: palette.blue.primary,
  primaryContainer: palette.blue.container,
  onPrimary: palette.white,
  onPrimaryContainer: palette.blue.onContainer,
  primaryPressed: '#0056CC',

  // 功能色彩
  success: palette.green.primary,
  successContainer: palette.green.container,
  onSuccess: palette.white,
  onSuccessContainer: palette.green.onContainer,

  error: palette.red.primary,
  errorContainer: palette.red.container,
  onError: palette.white,
  onErrorContainer: palette.red.onContainer,

  warning: palette.orange.primary,
  warningContainer: palette.orange.container,
  onWarning: palette.white,
  onWarningContainer: palette.orange.onContainer,

  info: palette.blue.primary,
  infoContainer: palette.blue.container,
  onInfo: palette.white,
  onInfoContainer: palette.blue.onContainer,

  // 表面色彩
  surface: palette.white,
  surfaceVariant: palette.gray[50],
  surfaceSecondary: palette.gray[50],
  onSurface: palette.black,
  onSurfaceVariant: palette.gray[400],

  // 背景色彩
  background: palette.white,
  backgroundSecondary: palette.gray[50],
  onBackground: palette.black,

  // 文本颜色
  text: palette.black,
  textSecondary: palette.gray[400],
  textTertiary: palette.gray[300],
  textMedium: 'rgba(0, 0, 0, 0.75)', // 自定义中等深度文本颜色
  textOnPrimary: palette.white,

  // 边框和分割线
  border: palette.gray[200],
  borderLight: palette.gray[100],
  borderFocus: palette.blue.primary,
  borderCream: palette.cream.border, // 奶糖色边框
  outline: palette.gray[200],
  outlineVariant: palette.gray[100],

  // 状态颜色
  disabled: palette.gray[300],
  disabledBackground: palette.gray[100],
  overlay: 'rgba(0, 0, 0, 0.5)',

  // 背景色别名
  successBackground: palette.green.container,
  errorBackground: palette.red.container,
  warningBackground: palette.orange.container,
  infoBackground: palette.blue.container,
} as const;

/**
 * 深色主题颜色配置
 */
export const darkColors = {
  // 主色系
  primary: palette.blue.light,
  primaryContainer: '#004B5C',
  onPrimary: palette.white,
  onPrimaryContainer: '#9ECAEF',
  primaryPressed: palette.blue.light,

  // 功能色彩
  success: palette.green.light,
  successContainer: palette.green.darkContainer,
  onSuccess: palette.white,
  onSuccessContainer: palette.green.onDarkContainer,

  error: palette.red.light,
  errorContainer: palette.red.darkContainer,
  onError: palette.white,
  onErrorContainer: palette.red.onDarkContainer,

  warning: palette.orange.primary,
  warningContainer: palette.orange.darkContainer,
  onWarning: palette.white,
  onWarningContainer: palette.orange.onDarkContainer,

  info: palette.blue.light,
  infoContainer: '#001F25',
  onInfo: palette.white,
  onInfoContainer: '#9ECAEF',

  // 表面色彩
  surface: palette.gray[800],
  surfaceVariant: palette.gray[700],
  surfaceSecondary: palette.gray[700],
  onSurface: palette.white,
  onSurfaceVariant: palette.gray[300],

  // 背景色彩
  background: palette.black,
  backgroundSecondary: palette.gray[700],
  onBackground: palette.white,

  // 文本颜色
  text: palette.white,
  textSecondary: palette.gray[300],
  textTertiary: palette.gray[400],
  textMedium: 'rgba(255, 255, 255, 0.85)', // 自定义中等深度文本颜色
  textOnPrimary: palette.white,

  // 边框和分割线
  border: palette.gray[400],
  borderLight: palette.gray[500],
  borderFocus: palette.blue.light,
  borderCream: 'transparent', // 深色模式下透明
  outline: palette.gray[400],
  outlineVariant: palette.gray[500],

  // 状态颜色
  disabled: palette.gray[500],
  disabledBackground: palette.gray[700],
  overlay: 'rgba(0, 0, 0, 0.7)',

  // 背景色别名
  successBackground: palette.green.darkContainer,
  errorBackground: palette.red.darkContainer,
  warningBackground: palette.orange.darkContainer,
  infoBackground: '#001F25',
} as const;

// 颜色类型定义已移至 ./types.ts，避免重复定义

/**
 * 获取主题颜色
 */
export const getThemeColors = (isDark: boolean) => {
  return isDark ? darkColors : lightColors;
};