/**
 * ThemeProvider - 主题供应器
 * 基于 React Native Paper 的主题系统，支持主题切换和持久化
 */

import React, { createContext, useContext, ReactNode, useEffect, useMemo, useRef } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperProvider } from 'react-native-paper';
import { paperThemes, getPaperTheme, type ExtendedTheme } from '@/shared/config/theme';
import { GlassProvider } from './GlassProvider';
import { log, LogType } from '@/shared/lib/logger';
import { useAsyncSafeState } from '@/shared/hooks/useAsyncSafeState';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: ExtendedTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  /**
   * 在浅色和深色主题之间简单切换，不包含自动模式
   */
  toggleLightDark: () => Promise<void>;
  /**
   * 获取主题模式的显示名称
   */
  getThemeModeLabel: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ 
  children, 
  defaultMode = 'auto' 
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useAsyncSafeState<ThemeMode>(defaultMode);
  const [isLoading, setIsLoading] = useAsyncSafeState(true);
  

  // 加载保存的主题模式
  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      log('theme', LogType.ERROR, `Failed to load theme mode: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 设置主题模式
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      setThemeModeState(mode);
    } catch (error) {
      log('theme', LogType.ERROR, `Failed to save theme mode [${mode}]: ${error}`);
      throw error;
    }
  };

  // 三模式主题循环切换
  const toggleTheme = async () => {
    try {
      const newMode = themeMode === 'light' ? 'dark' : 
                      themeMode === 'dark' ? 'auto' : 'light';
      await setThemeMode(newMode);
    } catch (error) {
      log('theme', LogType.WARNING, `主题切换失败: ${error}`);
    }
  };

  // 仅在浅色和深色之间切换
  const toggleLightDark = async () => {
    try {
      // 如果当前是auto模式，切换到与当前显示效果相反的模式
      if (themeMode === 'auto') {
        const newMode = isDark ? 'light' : 'dark';
        await setThemeMode(newMode);
      } else {
        // 直接在light和dark之间切换
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        await setThemeMode(newMode);
      }
    } catch (error) {
      log('theme', LogType.WARNING, `主题切换失败: ${error}`);
    }
  };

  // 获取主题模式的显示名称
  const getThemeModeLabel = () => {
    switch (themeMode) {
      case 'light':
        return '浅色';
      case 'dark':
        return '深色';
      case 'auto':
        return '跟随系统';
      default:
        return '未知';
    }
  };

  // 计算当前是否为深色模式
  const isDark = useMemo(() => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // 选择当前主题
  const theme = useMemo(() => {
    return getPaperTheme(isDark);
  }, [isDark]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDark,
      setThemeMode,
      toggleTheme,
      toggleLightDark,
      getThemeModeLabel,
    }),
    [theme, themeMode, isDark]
  );

  // 加载中时使用默认主题
  if (isLoading) {
    const defaultTheme = getPaperTheme(systemColorScheme === 'dark');
    const defaultIsDark = systemColorScheme === 'dark';
    
    return (
      <GlassProvider isDark={defaultIsDark}>
        <PaperProvider theme={defaultTheme}>
          <ThemeContext.Provider 
            value={{
              theme: defaultTheme,
              themeMode: 'auto',
              isDark: defaultIsDark,
              setThemeMode: async () => {},
              toggleTheme: async () => {},
              toggleLightDark: async () => {},
              getThemeModeLabel: () => '跟随系统',
            }}
          >
            {children}
          </ThemeContext.Provider>
        </PaperProvider>
      </GlassProvider>
    );
  }

  return (
    <GlassProvider isDark={isDark}>
      <PaperProvider theme={theme}>
        <ThemeContext.Provider value={value}>
          {children}
        </ThemeContext.Provider>
      </PaperProvider>
    </GlassProvider>
  );
}

/**
 * 使用主题的 Hook
 * @returns 主题上下文对象
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}