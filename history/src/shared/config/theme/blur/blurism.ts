/**
 * 模糊态效果系统
 * 独立的模糊态设计配置，与主题系统解耦
 */

import { moderateScale } from '@/shared/lib/metrics';

/**
 * 颜色变体类型
 */
export type ColorVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary' | 'secondary' | 'neutral' | 'highlight' | 'disabled';

/**
 * 内边距大小类型
 */
export type PaddingSize = 'none' | 'sm' | 'md' | 'lg';

/**
 * 模糊态效果配置
 * 定义模糊态设计的所有视觉属性
 */
export const blurism = {
  /** 浅色模式颜色预设 */
  colors: {
    light: {
      // 默认白色 - 更不透明，更白
      default: 'rgba(255, 255, 255, 0.5)',

      // 功能色系 - 淡色版本
      success: 'rgba(76, 175, 80, 0.15)',   // 淡绿色
      error: 'rgba(239, 119, 111, 0.2)',     // 淡红色
      warning: 'rgba(255, 152, 0, 0.15)',   // 淡橙色
      info: 'rgba(33, 150, 243, 0.15)',     // 淡蓝色

      // 其他淡色系
      primary: 'rgba(103, 58, 183, 0.15)',  // 淡紫色
      secondary: 'rgba(0, 150, 136, 0.15)', // 淡青色
      neutral: 'rgba(158, 158, 158, 0.35)', // 淡灰色

      // 特殊用途
      highlight: 'rgba(255, 235, 59, 0.10)', // 很淡的黄色
      disabled: 'rgba(189, 189, 189, 0.20)', // 禁用状态
    },
    dark: {
      // 默认深色 - 轻微增加白色透明度
      default: 'rgba(0, 0, 0, 0.5)',

      // 功能色系 - 深色版本
      success: 'rgba(76, 175, 80, 0.2)',    // 深色绿
      error: 'rgba(239, 119, 111, 0.25)',   // 深色红
      warning: 'rgba(255, 152, 0, 0.2)',    // 深色橙
      info: 'rgba(33, 150, 243, 0.2)',      // 深色蓝

      // 其他深色系
      primary: 'rgba(103, 58, 183, 0.2)',   // 深色紫
      secondary: 'rgba(0, 150, 136, 0.2)',  // 深色青
      neutral: 'rgba(158, 158, 158, 0.45)',  // 深色灰

      // 特殊用途
      highlight: 'rgba(255, 235, 59, 0.15)', // 深色黄
      disabled: 'rgba(158, 158, 158, 0.15)', // 深色禁用状态
    },
  },

  /** 模糊效果配置 */
  blur: {
    intensity: {
      light: 50,  // 降低浅色模式的模糊强度，让背景更清晰
      dark: 50,   // 轻微降低深色模式的模糊强度
    },
    tint: {
      /** 使用自动模式：浅色主题用light，深色主题用dark */
      auto: true,
      /** 强制指定tint（当auto为false时生效） */
      fixed: 'light' as const,
    },
    /** 可选的tint值 */
    tintOptions: {
      light: 'light' as const,
      dark: 'dark' as const,
      extraLight: 'extraLight' as const,
      regular: 'regular' as const,
      prominent: 'prominent' as const,
      systemMaterial: 'systemMaterial' as const,
    },
  },

  /** 阴影系统 */
  shadow: {
    light: {
      color: 'rgba(0,0,0,0.06)',
      offset: { width: 0, height: 2 },
      opacity: 1,
      radius: 8,
      elevation: 3,
    },
    dark: {
      color: 'rgba(0,0,0,0.3)',
      offset: { width: 0, height: 2 },
      opacity: 1,
      radius: 8,
      elevation: 3,
    },
  },

  /** 高亮边框配置 */
  highlightBorder: {
    light: 'rgba(255, 255, 255, 0.20)',
    dark: 'rgba(255, 255, 255, 0.10)',
  },

  /** 组件配置 */
  components: {
    button: {
      borderRadius: 20,
      height: 50,
      horizontalPadding: 20,
    },
    card: {
      borderRadius: moderateScale(24),
      padding: {
        none: 0,
        sm: 12,
        md: 20,
        lg: 24,
      },
    },
    list: {
      borderRadius: moderateScale(24),
      padding: {
        none: 0,
        sm: 12,
        md: 20,
        lg: 24,
      },
      itemHeight: 56,
      itemPadding: {
        vertical: 0,
        horizontal: 0,
      },
    },
  },

  /** 宽度预设 */
  width: {
    small: '80%',
    medium: '90%',
    large: '95%',
  },

  /** 动画配置 */
  animation: {
    pressIn: {
      scale: 0.96,
      duration: 150,
    },
    pressOut: {
      scale: 1,
      duration: 200,
    },
  },
} as const;

/**
 * 模糊态效果类型
 */
export type BlurismConfig = typeof blurism;

/**
 * 背景主题类型
 */
export type ColorPresets = typeof blurism.colors.light;

/**
 * 获取主题颜色
 */
export const getBlurismColors = (isDark: boolean) => {
  return isDark ? blurism.colors.dark : blurism.colors.light;
};

/**
 * 获取阴影配置
 */
export const getBlurismShadow = (isDark: boolean) => {
  return isDark ? blurism.shadow.dark : blurism.shadow.light;
};

/**
 * 获取高亮边框颜色
 */
export const getBlurismHighlightBorder = (isDark: boolean): string => {
  return isDark ? blurism.highlightBorder.dark : blurism.highlightBorder.light;
};