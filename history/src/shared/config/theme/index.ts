/**
 * 主题系统统一导出
 * 基于 React Native Paper 的主题配置和玻璃态效果
 */

// === React Native Paper 主题 ===
export * from './paper-theme';
export type { ExtendedTheme } from './paper-theme';

// === 颜色系统 ===
export { palette, lightColors, darkColors, getThemeColors } from './colors';

// === 玻璃态效果 ===
export * from './glass';

// === 设计令牌 ===
export {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  borderWidth,
  colors,
  duration,
  iconSizes,
  platform,
  tabBar
} from './tokens';

// === 类型定义 ===
export type {
  ColorScheme,
  Theme,
  ThemeColors,
  ThemeConfig,
  ColorKey,
  SpacingKey,
  FontSizeKey,
  FontWeightKey,
  BorderRadiusKey,
  ButtonVariant,
  ButtonSize,
  InputState,
  TextAlign,
} from './types';

// === 默认导出 ===
export { extendedLightTheme as defaultTheme } from './paper-theme';