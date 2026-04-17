/**
 * 主题系统类型定义 - 简化版
 * 提供核心的 TypeScript 类型支持
 */

import type { ExtendedTheme } from './paper-theme';
import type { lightColors, darkColors } from './colors';

// === 基础类型 ===

export type ColorScheme = 'light' | 'dark';
export type Theme = ExtendedTheme;
export type ThemeColors = typeof lightColors;

// === 主题配置 ===

export interface ThemeConfig {
  light: Theme;
  dark: Theme;
}

// === 键名类型（直接从主题对象推导）===

export type ColorKey = keyof ExtendedTheme['colors'];
export type SpacingKey = keyof ExtendedTheme['spacing'];
export type FontSizeKey = keyof ExtendedTheme['fontSize'];
export type FontWeightKey = keyof ExtendedTheme['fontWeight'];
export type BorderRadiusKey = keyof ExtendedTheme['borderRadius'];

// === 组件样式类型 ===

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'focused' | 'error' | 'disabled';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';