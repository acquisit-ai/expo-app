/**
 * 模糊态样式工厂
 * 预计算和缓存所有模糊态样式，避免运行时计算
 */

import { StyleSheet, Platform } from 'react-native';
import { moderateScale } from '@/shared/lib/metrics';
import { blurism, getBlurismColors, getBlurismShadow, getBlurismHighlightBorder, type ColorVariant, type PaddingSize } from './blurism';

/**
 * 模糊态样式缓存键类型
 */
type StyleCacheKey = `${boolean}_${string}`;

/**
 * 预计算的模糊态样式集合
 */
export interface PrecomputedBlurStyles {
  card: {
    container: any;
    content: any;
    variants: {
      small: any;
      medium: any;
      large: any;
    };
    padding: {
      none: any;
      sm: any;
      md: any;
      lg: any;
    };
  };
  button: {
    container: any;
    content: any;
    text: any;
    loading: any;
  };
  list: {
    container: any;
    content: any;
    item: any;
    textContainer: any;
    titleText: any;
    subtitleText: any;
    iconContainer: any;
    chevronContainer: any;
    chevron: any;
    rightControlContainer: any;
    divider: any;
    customContentContainer: any;
    disabled: any;
    variants: {
      small: any;
      medium: any;
      large: any;
    };
    padding: {
      none: any;
      sm: any;
      md: any;
      lg: any;
    };
  };
  colors: {
    [K in ColorVariant]: string;
  };
  shadow: any;
  highlightBorder: string;
  blur: {
    intensity: number;
    tint: 'light' | 'dark' | 'extraLight' | 'regular' | 'prominent' | 'systemMaterial';
  };
}

/**
 * 模糊态样式工厂类
 * 使用单例模式确保全局唯一实例
 */
class BlurStyleFactory {
  private static instance: BlurStyleFactory;
  private styleCache = new Map<StyleCacheKey, PrecomputedBlurStyles>();
  private colorCache = new Map<string, string>();

  private constructor() { }

  public static getInstance(): BlurStyleFactory {
    if (!BlurStyleFactory.instance) {
      BlurStyleFactory.instance = new BlurStyleFactory();
    }
    return BlurStyleFactory.instance;
  }

  /**
   * 预计算颜色值
   */
  private precomputeColors(isDark: boolean): PrecomputedBlurStyles['colors'] {
    return getBlurismColors(isDark);
  }

  /**
   * 创建卡片样式
   */
  private createCardStyles(isDark: boolean, colors: PrecomputedBlurStyles['colors']) {
    const shadow = getBlurismShadow(isDark);
    const highlightBorder = getBlurismHighlightBorder(isDark);

    return {
      container: StyleSheet.create({
        base: {
          borderRadius: moderateScale(blurism.components.card.borderRadius),
          alignSelf: 'center',
          ...(!isDark && Platform.select({
            ios: {
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
            },
            android: {
              elevation: shadow.elevation,
              backgroundColor: 'rgba(0,0,0,0.01)',
            },
          })),
        },
      }),
      content: StyleSheet.create({
        base: {
          borderRadius: moderateScale(blurism.components.card.borderRadius),
          overflow: 'hidden',
          width: '100%',
        },
        highlight: isDark ? {
          position: 'absolute',
          top: 1,
          left: 1,
          right: 1,
          bottom: 1,
          borderRadius: moderateScale(blurism.components.card.borderRadius - 1),
          borderWidth: 1,
          borderColor: highlightBorder,
          pointerEvents: 'none',
        } : {},
      }),
      variants: {
        small: { width: blurism.width.small },
        medium: { width: blurism.width.medium },
        large: { width: blurism.width.large },
      },
      padding: {
        none: { padding: moderateScale(blurism.components.card.padding.none) },
        sm: { padding: moderateScale(blurism.components.card.padding.sm) },
        md: { padding: moderateScale(blurism.components.card.padding.md) },
        lg: { padding: moderateScale(blurism.components.card.padding.lg) },
      },
    };
  }

  /**
   * 创建按钮样式
   */
  private createButtonStyles(isDark: boolean, colors: PrecomputedBlurStyles['colors']) {
    const shadow = getBlurismShadow(isDark);
    const highlightBorder = getBlurismHighlightBorder(isDark);

    return {
      container: StyleSheet.create({
        base: {
          borderRadius: moderateScale(blurism.components.button.borderRadius),
          ...(!isDark && Platform.select({
            ios: {
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
            },
            android: {
              elevation: shadow.elevation,
              backgroundColor: 'rgba(0,0,0,0.01)',
            },
          })),
        },
      }),
      content: StyleSheet.create({
        base: {
          borderRadius: moderateScale(blurism.components.button.borderRadius),
          overflow: 'hidden',
          width: '100%',
          height: moderateScale(blurism.components.button.height),
        },
        highlight: isDark ? {
          position: 'absolute',
          top: 1,
          left: 1,
          right: 1,
          bottom: 1,
          borderRadius: moderateScale(blurism.components.button.borderRadius - 1),
          borderWidth: 1,
          borderColor: highlightBorder,
          pointerEvents: 'none',
        } : {},
      }),
      text: StyleSheet.create({
        base: {
          fontSize: moderateScale(16),
          fontWeight: '600',
        },
      }),
      loading: StyleSheet.create({
        container: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: moderateScale(blurism.components.button.horizontalPadding),
        },
      }),
    };
  }

  /**
   * 创建列表样式
   */
  private createListStyles(isDark: boolean, colors: PrecomputedBlurStyles['colors']) {
    const shadow = getBlurismShadow(isDark);
    const highlightBorder = getBlurismHighlightBorder(isDark);

    return {
      container: StyleSheet.create({
        base: {
          borderRadius: moderateScale(blurism.components.list.borderRadius),
          alignSelf: 'center',
          ...(!isDark && Platform.select({
            ios: {
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
            },
            android: {
              elevation: shadow.elevation,
              backgroundColor: 'rgba(0,0,0,0.01)',
            },
          })),
        },
      }),
      content: StyleSheet.create({
        base: {
          borderRadius: moderateScale(blurism.components.list.borderRadius),
          overflow: 'hidden',
          width: '100%',
        },
        highlight: isDark ? {
          position: 'absolute',
          top: 1,
          left: 1,
          right: 1,
          bottom: 1,
          borderRadius: moderateScale(blurism.components.list.borderRadius - 1),
          borderWidth: 1,
          borderColor: highlightBorder,
          pointerEvents: 'none',
        } : {},
      }),
      item: StyleSheet.create({
        base: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: moderateScale(blurism.components.list.itemHeight),
          paddingVertical: moderateScale(blurism.components.list.itemPadding.vertical),
        },
      }),
      textContainer: StyleSheet.create({
        base: {
          flex: 1,
          justifyContent: 'center',
        },
      }),
      titleText: StyleSheet.create({
        base: {
          fontSize: moderateScale(16),
          fontWeight: '500',
          lineHeight: moderateScale(24),
        },
      }),
      subtitleText: StyleSheet.create({
        base: {
          fontSize: moderateScale(14),
          marginTop: moderateScale(2),
          lineHeight: moderateScale(20),
        },
      }),
      iconContainer: StyleSheet.create({
        base: {
          width: moderateScale(40),
          height: moderateScale(40),
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: moderateScale(12),
        },
      }),
      chevronContainer: StyleSheet.create({
        base: {
          width: moderateScale(24),
          height: moderateScale(24),
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
      chevron: StyleSheet.create({
        base: {
          fontSize: moderateScale(20),
          fontWeight: '300',
        },
      }),
      rightControlContainer: StyleSheet.create({
        base: {
          justifyContent: 'center',
          alignItems: 'flex-end',
        },
      }),
      divider: StyleSheet.create({
        base: {
          height: 1,
          opacity: 0.3,
          marginVertical: 0,
        },
      }),
      customContentContainer: StyleSheet.create({
        base: {
          marginTop: moderateScale(8),
          width: '100%',
        },
      }),
      disabled: StyleSheet.create({
        item: {
          opacity: 0.5,
        },
      }),
      variants: {
        small: { width: blurism.width.small },
        medium: { width: blurism.width.medium },
        large: { width: blurism.width.large },
      },
      padding: {
        none: { paddingHorizontal: moderateScale(blurism.components.list.padding.none), paddingVertical: moderateScale(5) },
        sm: { paddingHorizontal: moderateScale(blurism.components.list.padding.sm), paddingVertical: moderateScale(5) },
        md: { paddingHorizontal: moderateScale(blurism.components.list.padding.md), paddingVertical: moderateScale(5) },
        lg: { paddingHorizontal: moderateScale(blurism.components.list.padding.lg), paddingVertical: moderateScale(5) },
      },
    };
  }

  /**
   * 预计算所有样式
   */
  private precomputeAllStyles(isDark: boolean): PrecomputedBlurStyles {
    const colors = this.precomputeColors(isDark);
    const shadow = getBlurismShadow(isDark);
    const highlightBorder = getBlurismHighlightBorder(isDark);

    return {
      colors,
      shadow,
      highlightBorder,
      blur: {
        intensity: isDark ? blurism.blur.intensity.dark : blurism.blur.intensity.light,
        tint: blurism.blur.tint.auto
          ? (isDark ? 'dark' : 'light')  // 自动模式
          : blurism.blur.tint.fixed,     // 固定模式
      },
      card: this.createCardStyles(isDark, colors),
      button: this.createButtonStyles(isDark, colors),
      list: this.createListStyles(isDark, colors),
    };
  }

  /**
   * 获取预计算的样式
   */
  public getStyles(isDark: boolean): PrecomputedBlurStyles {
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
export const blurStyleFactory = BlurStyleFactory.getInstance();

/**
 * 导出类型
 */
