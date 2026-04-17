/**
 * 状态栏样式控制 Hook
 * 支持三种模式：强制白色、强制黑色、跟随 App 主题
 *
 * ⚠️ 重要：完全不响应系统级主题切换
 * - 'light' / 'dark': 永远固定，完全忽略系统主题变化
 * - 'auto': 只响应 App 主题切换（ThemeProvider），完全忽略系统主题变化
 *
 * ⚠️ 实现原理：
 * - 使用 React Native 原生 StatusBar API（不使用 expo-status-bar）
 * - 监听系统主题变化事件（Appearance.addChangeListener）
 * - 检测到系统主题变化后，延迟300ms强制恢复为目标样式
 * - 性能友好，无持续轮询
 */

import { useMemo, useEffect, useRef, useCallback } from 'react';
import { StatusBar, Appearance } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useSingleTimer } from './useTimer';

/**
 * 强制设置状态栏样式的 Hook（支持拦截系统主题变化）
 *
 * @param mode - 状态栏模式：
 *   - 'light': 强制白色图标（用于深色背景）
 *   - 'dark': 强制黑色图标（用于浅色背景）
 *   - 'auto': 跟随 App 主题（不跟随系统主题）
 *
 * @example
 * ```tsx
 * // 视频播放页面：强制白色
 * useForceStatusBarStyle('light');
 *
 * // Feed 页面：跟随 App 主题
 * useForceStatusBarStyle('auto');
 * ```
 */
export function useForceStatusBarStyle(mode: 'light' | 'dark' | 'auto') {
  const { themeMode, isDark } = useTheme();
  const { setTimer, clearTimer } = useSingleTimer();

  const targetStyle = useMemo((): 'light-content' | 'dark-content' => {
    if (mode === 'light') {
      return 'light-content';
    } else if (mode === 'dark') {
      return 'dark-content';
    } else {
      if (themeMode === 'light') {
        return 'dark-content';
      } else if (themeMode === 'dark') {
        return 'light-content';
      } else {
        return isDark ? 'light-content' : 'dark-content';
      }
    }
  }, [mode, themeMode, isDark]);

  // 🔑 使用 ref 保存最新的 targetStyle，避免闭包陷阱
  const targetStyleRef = useRef(targetStyle);
  useEffect(() => {
    targetStyleRef.current = targetStyle;
  }, [targetStyle]);

  // 🔑 使用 useCallback 创建稳定的函数引用
  const forceSetStyle = useCallback(() => {
    StatusBar.setBarStyle(targetStyleRef.current, true);
  }, []);

  // 🎯 页面获得焦点时立即恢复样式（解决页面切换时状态栏不更新的问题）
  useFocusEffect(
    useCallback(() => {
      forceSetStyle();
    }, [forceSetStyle])
  );

  // 🔥 核心：精准拦截系统主题变化
  useEffect(() => {
    // 1️⃣ 初始设置
    forceSetStyle();

    // 2️⃣ 监听系统主题变化，延迟300ms后强制恢复
    const subscription = Appearance.addChangeListener(() => {
      // 延迟300ms后强制设置回目标样式（自动清除之前的定时器）
      setTimer(() => {
        forceSetStyle();
      }, 300);
    });

    return () => {
      subscription.remove();
      // timer 会自动清理
    };
  }, [targetStyle, forceSetStyle, setTimer]);
}
