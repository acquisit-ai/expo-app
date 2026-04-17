/**
 * 玻璃态样式工厂
 * 预计算和缓存所有玻璃态样式，避免运行时计算
 */

import { StyleSheet } from 'react-native';
import { moderateScale } from '@/shared/lib/metrics';
import { glassmorphism } from './glassmorphism';
import { borderRadius, borderWidth, spacing, fontSize } from '../tokens';

/**
 * 玻璃态样式缓存键类型
 */
type StyleCacheKey = `${boolean}_${string}`;

/**
 * 预计算的玻璃态样式集合
 */
interface PrecomputedGlassStyles {
  card: {
    gradient: any;
    blur: any;
    gradientColors: readonly [string, string, string, string];
  };
  button: {
    primary: any;
    secondary: any;
  };
  input: {
    container: any;
    text: any;
  };
  social: {
    button: any;
  };
  colors: {
    cardBackground: string;
    cardBorder: string;
    buttonBackground: string;
    buttonPrimaryBackground: string;
    buttonBorder: string;
    buttonPrimaryBorder: string;
    inputBackground: string;
    inputBorder: string;
    socialBackground: string;
    socialBorder: string;
    textPrimary: string;
    textSecondary: string;
    placeholder: string;
  };
}

/**
 * 玻璃态样式工厂类
 * 使用单例模式确保全局唯一实例
 */
class GlassStyleFactory {
  private static instance: GlassStyleFactory;
  private styleCache = new Map<StyleCacheKey, PrecomputedGlassStyles>();
  private colorCache = new Map<string, string>();

  private constructor() {}

  public static getInstance(): GlassStyleFactory {
    if (!GlassStyleFactory.instance) {
      GlassStyleFactory.instance = new GlassStyleFactory();
    }
    return GlassStyleFactory.instance;
  }

  /**
   * 创建带透明度的颜色（带缓存）
   */
  private withOpacityCache(color: string, opacity: number): string {
    const key = `${color}_${opacity}`;
    
    if (this.colorCache.has(key)) {
      return this.colorCache.get(key)!;
    }

    let result = color;

    // 如果颜色已经包含透明度，直接返回
    if (color.includes('rgba') || color.includes('hsla')) {
      result = color;
    }
    // 处理十六进制颜色
    else if (color.startsWith('#')) {
      const hex = color.slice(1);
      const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
      result = `#${hex}${alpha}`;
    }
    // 处理 rgb 颜色
    else if (color.startsWith('rgb(')) {
      result = color.replace('rgb(', `rgba(`).replace(')', `, ${opacity})`);
    }

    this.colorCache.set(key, result);
    return result;
  }

  /**
   * 预计算颜色值
   */
  private precomputeColors(): PrecomputedGlassStyles['colors'] {
    const baseColor = 'rgb(255, 255, 255)';
    
    return {
      cardBackground: this.withOpacityCache(baseColor, glassmorphism.opacity.card),
      cardBorder: this.withOpacityCache(baseColor, glassmorphism.opacity.cardBorder),
      buttonBackground: this.withOpacityCache(baseColor, glassmorphism.opacity.button),
      buttonPrimaryBackground: this.withOpacityCache(baseColor, glassmorphism.opacity.buttonPrimary),
      buttonBorder: this.withOpacityCache(baseColor, glassmorphism.opacity.buttonBorder),
      buttonPrimaryBorder: this.withOpacityCache(baseColor, glassmorphism.opacity.buttonPrimaryBorder),
      inputBackground: this.withOpacityCache(baseColor, glassmorphism.opacity.input),
      inputBorder: this.withOpacityCache(baseColor, glassmorphism.opacity.inputBorder),
      socialBackground: this.withOpacityCache(baseColor, glassmorphism.opacity.socialButton),
      socialBorder: this.withOpacityCache(baseColor, glassmorphism.opacity.socialButtonBorder),
      textPrimary: this.withOpacityCache(baseColor, glassmorphism.opacity.textPrimary),
      textSecondary: this.withOpacityCache(baseColor, glassmorphism.opacity.textSecondary),
      placeholder: this.withOpacityCache(baseColor, glassmorphism.opacity.textSecondary),
    };
  }

  /**
   * 创建卡片样式
   */
  private createCardStyles(colors: PrecomputedGlassStyles['colors']) {
    const gradientColors = [
      this.withOpacityCache('rgb(255, 255, 255)', glassmorphism.opacity.card + 0.1),
      colors.cardBackground,
      this.withOpacityCache('rgb(255, 255, 255)', glassmorphism.opacity.card - 0.05),
      this.withOpacityCache('rgb(255, 255, 255)', glassmorphism.opacity.card + 0.05),
    ] as const;

    return {
      gradient: StyleSheet.create({
        container: {
          borderRadius: moderateScale(borderRadius.xl + 4),
          overflow: 'hidden',
          alignSelf: 'center',
        },
        small: { width: '80%' },
        medium: { width: '90%' },
        large: { width: '95%' },
      }),
      blur: StyleSheet.create({
        container: {
          width: '100%',
          borderRadius: moderateScale(borderRadius.xl + 4),
          backgroundColor: 'transparent',
          borderWidth: moderateScale(borderWidth.normal),
          borderColor: colors.cardBorder,
        },
        paddingSmall: { 
          paddingVertical: moderateScale(spacing.lg),
          paddingHorizontal: moderateScale(spacing.lg),
        },
        paddingMedium: { 
          paddingVertical: moderateScale(spacing.xl),
          paddingHorizontal: moderateScale(spacing.xl),
        },
        paddingLarge: { 
          paddingVertical: moderateScale(spacing.xl + spacing.xs),
          paddingHorizontal: moderateScale(spacing.xl + spacing.xs),
        },
      }),
      gradientColors,
    };
  }

  /**
   * 创建按钮样式
   */
  private createButtonStyles(colors: PrecomputedGlassStyles['colors']) {
    return {
      primary: StyleSheet.create({
        button: {
          borderRadius: moderateScale(borderRadius.lg),
          paddingVertical: moderateScale(spacing.lg),
          paddingHorizontal: moderateScale(spacing.xl),
          alignItems: 'center',
          backgroundColor: colors.buttonPrimaryBackground,
          borderWidth: moderateScale(borderWidth.thick * 0.75),
          borderColor: colors.buttonPrimaryBorder,
          marginBottom: moderateScale(spacing.sm + spacing.xs),
        },
        text: {
          fontSize: moderateScale(fontSize.lg - 1),
          fontWeight: '600' as const,
          color: colors.textPrimary,
        },
        content: {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        },
        loading: {
          marginRight: moderateScale(spacing.sm),
        },
      }),
      secondary: StyleSheet.create({
        button: {
          borderRadius: moderateScale(borderRadius.lg),
          paddingVertical: moderateScale(spacing.lg),
          paddingHorizontal: moderateScale(spacing.xl),
          alignItems: 'center',
          backgroundColor: colors.buttonBackground,
          borderWidth: moderateScale(borderWidth.thick * 0.75),
          borderColor: colors.buttonBorder,
          marginBottom: moderateScale(spacing.sm + spacing.xs),
        },
        text: {
          fontSize: moderateScale(fontSize.lg - 1),
          fontWeight: '600' as const,
          color: this.withOpacityCache('rgb(255, 255, 255)', glassmorphism.opacity.text + 0.1),
        },
        content: {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        },
        loading: {
          marginRight: moderateScale(spacing.sm),
        },
      }),
    };
  }

  /**
   * 创建输入框样式
   */
  private createInputStyles(colors: PrecomputedGlassStyles['colors']) {
    return {
      container: StyleSheet.create({
        input: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.inputBackground,
          borderRadius: moderateScale(borderRadius.lg),
          marginBottom: moderateScale(12),
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(16),
          borderWidth: moderateScale(borderWidth.thick),
          borderColor: colors.inputBorder,
        },
        iconLeft: {
          marginRight: moderateScale(12),
          backgroundColor: 'transparent',
        },
        iconRight: {
          marginLeft: moderateScale(12),
          backgroundColor: 'transparent',
        },
      }),
      text: StyleSheet.create({
        input: {
          flex: 1,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          fontWeight: '500',
        },
      }),
    };
  }

  /**
   * 创建社交按钮样式
   */
  private createSocialStyles(colors: PrecomputedGlassStyles['colors']) {
    return {
      button: StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.socialBackground,
          borderRadius: moderateScale(12),
          paddingVertical: moderateScale(12),
          paddingHorizontal: moderateScale(24),
          minWidth: moderateScale(120),
          borderWidth: moderateScale(1),
          borderColor: colors.socialBorder,
        },
        icon: {
          backgroundColor: 'transparent',
        },
      }),
    };
  }

  /**
   * 预计算所有样式
   */
  private precomputeAllStyles(isDark: boolean): PrecomputedGlassStyles {
    const colors = this.precomputeColors();
    
    return {
      colors,
      card: this.createCardStyles(colors),
      button: this.createButtonStyles(colors),
      input: this.createInputStyles(colors),
      social: this.createSocialStyles(colors),
    };
  }

  /**
   * 获取预计算的样式
   */
  public getStyles(isDark: boolean): PrecomputedGlassStyles {
    const key: StyleCacheKey = `${isDark}_default`;
    
    if (this.styleCache.has(key)) {
      return this.styleCache.get(key)!;
    }

    const styles = this.precomputeAllStyles(isDark);
    this.styleCache.set(key, styles);
    
    return styles;
  }

  /**
   * 清除缓存（用于内存管理）
   */
  public clearCache(): void {
    this.styleCache.clear();
    this.colorCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats() {
    return {
      styleCache: this.styleCache.size,
      colorCache: this.colorCache.size,
    };
  }
}

/**
 * 导出工厂实例
 */
export const glassStyleFactory = GlassStyleFactory.getInstance();

/**
 * 导出类型
 */
export type { PrecomputedGlassStyles };