import React, { useEffect, useRef } from 'react';
import { Toasts } from '@backpackapp-io/react-native-toast';
import { useTheme } from './ThemeProvider';
import { initToast, updateToastConfig, TOAST_CONSTANTS } from '@/shared/lib/toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { isDark } = useTheme();
  const isInitialized = useRef(false);

  // 初始化 Toast（只执行一次，使用内置默认配置）
  if (!isInitialized.current) {
    initToast(isDark);
    isInitialized.current = true;
  }

  // 监听主题变化
  useEffect(() => {
    if (isInitialized.current) {
      updateToastConfig({ isDark });
    }
  }, [isDark]);

  return (
    <>
      {children}
      <Toasts extraInsets={{ top: TOAST_CONSTANTS.TOP_OFFSET }} />
    </>
  );
}