/**
 * GlassProvider - 玻璃态效果提供器
 * 独立的玻璃态样式管理，与主题系统解耦
 */

import React, { createContext, useContext, useMemo, ReactNode, useRef, useEffect } from 'react';
import { glassStyleFactory, glassmorphism, type PrecomputedGlassStyles } from '@/shared/config/theme/glass';
import { log, LogType } from '@/shared/lib/logger';
import { useMountedState } from '@/shared/hooks/useMountedState';

/**
 * 玻璃态上下文类型
 */
interface GlassContextType {
  /** 预计算的样式集合 */
  styles: PrecomputedGlassStyles;
  /** 预计算的颜色值 */
  colors: PrecomputedGlassStyles['colors'];
  /** 原始配置对象 */
  config: typeof glassmorphism;
  /** 当前主题模式 */
  isDark: boolean;
  /** 刷新样式缓存 */
  refreshStyles: () => void;
}

/**
 * 玻璃态上下文
 */
const GlassContext = createContext<GlassContextType | undefined>(undefined);

/**
 * GlassProvider 属性接口
 */
interface GlassProviderProps {
  /** 子组件 */
  children: ReactNode;
  /** 是否为深色模式 */
  isDark: boolean;
}

/**
 * 玻璃态效果提供器
 * 管理玻璃态样式的预计算和缓存
 */
export function GlassProvider({ children, isDark }: GlassProviderProps) {
  const isMounted = useMountedState();

  // 预计算样式，只在主题模式切换时重新计算
  const styles = useMemo(() => {
    const startTime = Date.now();
    const computedStyles = glassStyleFactory.getStyles(isDark);
    const endTime = Date.now();
    
    log('glass', LogType.DEBUG, `Glass styles computed in ${endTime - startTime}ms`);
    
    return computedStyles;
  }, [isDark]);

  // 刷新样式缓存的方法
  const refreshStyles = useMemo(() => {
    return () => {
      if (!isMounted()) {
        log('glass', LogType.DEBUG, 'GlassProvider已卸载，跳过样式刷新');
        return;
      }
      
      log('glass', LogType.INFO, 'Clearing glass style cache');
      glassStyleFactory.clearCache();
    };
  }, []);

  // Context 值缓存
  const contextValue = useMemo(() => ({
    styles,
    colors: styles.colors,
    config: glassmorphism,
    isDark,
    refreshStyles,
  }), [styles, isDark, refreshStyles]);

  // 开发模式下的性能监控
  useEffect(() => {
    if (__DEV__) {
      const stats = glassStyleFactory.getCacheStats();
      if (stats.styleCache > 10 || stats.colorCache > 50) {
        log('glass', LogType.WARNING, 'Glass cache size is growing large');
      }
    }
  }, [styles]);

  return (
    <GlassContext.Provider value={contextValue}>
      {children}
    </GlassContext.Provider>
  );
}

/**
 * 使用玻璃态效果的 Hook
 * 提供优化的玻璃态样式和配置访问
 */
export function useGlass(): GlassContextType {
  const context = useContext(GlassContext);
  
  if (!context) {
    throw new Error('useGlass must be used within a GlassProvider');
  }
  
  return context;
}

/**
 * 玻璃态样式选择器 Hooks
 * 提供特定组件样式的快捷访问
 */

/**
 * 获取卡片样式
 */
export function useGlassCard() {
  const { styles, config } = useGlass();
  
  return useMemo(() => ({
    styles: styles.card,
    colors: styles.colors,
    blur: {
      intensity: config.blur.intensity,
      tint: config.blur.tint,
    },
    gradient: {
      start: config.gradient.start,
      end: config.gradient.end,
    },
  }), [styles.card, styles.colors, config]);
}

/**
 * 获取按钮样式
 */
export function useGlassButton() {
  const { styles, config } = useGlass();
  
  return useMemo(() => ({
    styles: styles.button,
    colors: styles.colors,
  }), [styles.button, styles.colors]);
}

/**
 * 获取输入框样式
 */
export function useGlassInput() {
  const { styles, config } = useGlass();
  
  return useMemo(() => ({
    styles: styles.input,
    colors: styles.colors,
    placeholderTextColor: styles.colors.placeholder,
  }), [styles.input, styles.colors]);
}

/**
 * 获取社交按钮样式
 */
export function useGlassSocial() {
  const { styles, config } = useGlass();
  
  return useMemo(() => ({
    styles: styles.social,
    colors: styles.colors,
  }), [styles.social, styles.colors]);
}

/**
 * 高阶组件：为组件注入玻璃态样式
 */
export function withGlass<T extends object>(
  Component: React.ComponentType<T & { glass?: GlassContextType }>
) {
  const WrappedComponent = React.memo((props: T) => {
    const glass = useGlass();
    return <Component {...props} glass={glass} />;
  });

  WrappedComponent.displayName = `withGlass(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}