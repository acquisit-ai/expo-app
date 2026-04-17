/**
 * BlurProvider - 模糊态效果提供器
 * 独立的模糊态样式管理，与主题系统解耦
 */

import React, { createContext, useContext, useMemo, ReactNode, useRef, useEffect } from 'react';
import { blurStyleFactory, blurism, type PrecomputedBlurStyles } from '@/shared/config/theme/blur';
import { log, LogType } from '@/shared/lib/logger';
import { useMountedState } from '@/shared/hooks/useMountedState';

/**
 * 模糊态上下文类型
 */
interface BlurContextType {
  /** 预计算的样式集合 */
  styles: PrecomputedBlurStyles;
  /** 预计算的颜色值 */
  colors: PrecomputedBlurStyles['colors'];
  /** 原始配置对象 */
  config: typeof blurism;
  /** 当前主题模式 */
  isDark: boolean;
  /** 刷新样式缓存 */
  refreshStyles: () => void;
}

/**
 * 模糊态上下文
 */
const BlurContext = createContext<BlurContextType | undefined>(undefined);

/**
 * BlurProvider 属性接口
 */
interface BlurProviderProps {
  /** 子组件 */
  children: ReactNode;
  /** 是否为深色模式 */
  isDark: boolean;
}

/**
 * 模糊态效果提供器
 * 管理模糊态样式的预计算和缓存
 */
export function BlurProvider({ children, isDark }: BlurProviderProps) {
  const isMounted = useMountedState();

  // 预计算样式，只在主题模式切换时重新计算
  const styles = useMemo(() => {
    const startTime = Date.now();
    const computedStyles = blurStyleFactory.getStyles(isDark);
    const endTime = Date.now();

    log('blur', LogType.DEBUG, `Blur styles computed in ${endTime - startTime}ms`);

    return computedStyles;
  }, [isDark]);

  // 刷新样式缓存的方法
  const refreshStyles = useMemo(() => {
    return () => {
      if (!isMounted()) {
        log('blur', LogType.DEBUG, 'BlurProvider已卸载，跳过样式刷新');
        return;
      }

      log('blur', LogType.INFO, 'Clearing blur style cache');
      blurStyleFactory.clearCache();
    };
  }, []);

  // Context 值缓存
  const contextValue = useMemo(() => ({
    styles,
    colors: styles.colors,
    config: blurism,
    isDark,
    refreshStyles,
  }), [styles, isDark, refreshStyles]);

  // 开发模式下的性能监控
  useEffect(() => {
    if (__DEV__) {
      const stats = blurStyleFactory.getCacheStats();
      if (stats.styleCache > 10 || stats.colorCache > 50) {
        log('blur', LogType.WARNING, 'Blur cache size is growing large');
      }
    }
  }, [styles]);

  return (
    <BlurContext.Provider value={contextValue}>
      {children}
    </BlurContext.Provider>
  );
}

/**
 * 使用模糊态效果的 Hook
 * 提供优化的模糊态样式和配置访问
 */
export function useBlur(): BlurContextType {
  const context = useContext(BlurContext);

  if (!context) {
    throw new Error('useBlur must be used within a BlurProvider');
  }

  return context;
}

/**
 * 模糊态样式选择器 Hooks
 * 提供特定组件样式的快捷访问
 */

/**
 * 获取卡片样式
 */
export function useBlurCard() {
  const { styles, colors, config } = useBlur();

  return useMemo(() => ({
    styles: styles.card,
    colors,
    blur: styles.blur,
    shadow: styles.shadow,
    highlightBorder: styles.highlightBorder,
    getWidthVariant: (widthRatio: number) => {
      if (widthRatio <= 0.8) return 'small';
      if (widthRatio <= 0.9) return 'medium';
      return 'large';
    },
  }), [styles.card, colors, styles.blur, styles.shadow, styles.highlightBorder]);
}

/**
 * 获取按钮样式
 */
export function useBlurButton() {
  const { styles, colors } = useBlur();

  return useMemo(() => ({
    styles: styles.button,
    colors,
    blur: styles.blur,
    shadow: styles.shadow,
    highlightBorder: styles.highlightBorder,
    animation: blurism.animation,
  }), [styles.button, colors, styles.blur, styles.shadow, styles.highlightBorder]);
}

/**
 * 获取列表样式
 */
export function useBlurList() {
  const { styles, colors } = useBlur();

  return useMemo(() => ({
    styles: styles.list,
    colors,
    blur: styles.blur,
    shadow: styles.shadow,
    highlightBorder: styles.highlightBorder,
    getWidthVariant: (widthRatio: number) => {
      if (widthRatio <= 0.8) return 'small';
      if (widthRatio <= 0.9) return 'medium';
      return 'large';
    },
  }), [styles.list, colors, styles.blur, styles.shadow, styles.highlightBorder]);
}

/**
 * 高阶组件：为组件注入模糊态样式
 */
export function withBlur<T extends object>(
  Component: React.ComponentType<T & { blur?: BlurContextType }>
) {
  const WrappedComponent = React.memo((props: T) => {
    const blur = useBlur();
    return <Component {...props} blur={blur} />;
  });

  WrappedComponent.displayName = `withBlur(${Component.displayName || Component.name})`;

  return WrappedComponent;
}