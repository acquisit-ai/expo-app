/**
 * 应用入口组件
 * React Navigation 版本
 */

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Font from 'expo-font';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from '@/shared/providers/ThemeProvider';
import { GlassProvider } from '@/shared/providers/GlassProvider';
import { BlurProvider } from '@/shared/providers/BlurProvider';
import { ToastProvider } from '@/shared/providers/ToastProvider';
import { ModalProvider } from '@/shared/lib/modal';
import { modalStack } from '@/app/config/modal-registry';
import { LoadingScreen } from '@/shared/ui';
import { useSupabaseAuthSync } from '@/shared/lib/auth-sync';
import { useIsAuthInitialized } from '@/entities/user';
import { playerPoolManager } from '@/entities/player-pool';
import { useVideoEntitySync } from '@/entities/video';
import { useSubtitleAutoLoader } from '@/features/subtitle-fetching';
import { log, LogType } from '@/shared/lib/logger';
import { RootNavigator } from './navigation/RootNavigator';

/**
 * 应用内容组件
 * 包含所有 Provider 和导航器
 */
const queryClient = new QueryClient();

function AppContent() {
  const { isDark } = useTheme();

  // ✅ 等待认证初始化完成，避免 RootNavigator 在 getSession() 前渲染
  // 这确保 initialRouteName 基于正确的认证状态
  const isAuthInitialized = useIsAuthInitialized();

  // ✅ 全局同步入口：自动同步当前活动播放器的事件到 Entity Store
  // 这确保只有一个播放器的状态被同步，防止多播放器冲突
  useVideoEntitySync();

  // ✅ 全局字幕自动加载器：监听视频切换，自动加载字幕
  // 完全解耦，页面层无需手动调用字幕加载
  useSubtitleAutoLoader();

  // 在认证初始化完成前显示加载界面
  if (!isAuthInitialized) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GlassProvider isDark={isDark}>
        <BlurProvider isDark={isDark}>
          <ModalProvider stack={modalStack}>
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </View>
          </ModalProvider>
        </BlurProvider>
      </GlassProvider>
    </QueryClientProvider>
  );
}

/**
 * 应用初始化器
 * 负责预加载资源和初始化服务
 */
function AppInitializer({ children }: { children: React.ReactNode }) {
  const [appReady, setAppReady] = useState(false);

  // 🔄 初始化 Supabase 认证自动同步
  useSupabaseAuthSync();

  // 🎯 应用启动初始化
  useEffect(() => {
    const initializeApp = async () => {
      const startTime = Date.now();
      const maxInitTime = 5000; // 5秒超时保护

      // 超时保护：确保应用不会无限期卡在初始化
      const timeoutHandle = setTimeout(() => {
        log('app-init', LogType.WARNING, 'Initialization timeout, proceeding with partial initialization');
        setAppReady(true);
      }, maxInitTime);

      try {
        // 🎨 预加载字体以避免图标延迟显示
        try {
          await Font.loadAsync({
            ...MaterialCommunityIcons.font,
            ...Ionicons.font,
          });

          // 短暂等待确保字体注册完成
          await new Promise(resolve => setTimeout(resolve, 100));

          log('app-init', LogType.INFO, 'Icon fonts preloaded successfully');
        } catch (fontError) {
          log('app-init', LogType.WARNING, `Font loading failed, continuing with system fonts: ${fontError}`);
          // 字体加载失败不应阻止应用启动
        }

        // 初始化屏幕方向
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          log('app-init', LogType.INFO, 'Screen orientation locked');
        } catch (orientationError) {
          log('app-init', LogType.WARNING, `Screen orientation lock failed: ${orientationError}`);
        }

        // 🚀 初始化播放器池（双池架构：13个主池 + 4个available池）
        try {
          await playerPoolManager.init();
          log('app-init', LogType.INFO,
            'Player pool initialized successfully (13 main + 4 available)');
        } catch (videoError) {
          log('app-init', LogType.ERROR, `Player pool initialization failed: ${videoError}`);
          // 继续应用启动，但视频功能可能不可用
        }

        // 清除超时保护
        clearTimeout(timeoutHandle);

        // 标记应用已准备就绪
        const totalDuration = Date.now() - startTime;
        log('app-init', LogType.INFO, `App initialization completed in ${totalDuration}ms`);
        setAppReady(true);

      } catch (error) {
        clearTimeout(timeoutHandle);
        const totalDuration = Date.now() - startTime;
        log('app-init', LogType.ERROR, `App initialization failed after ${totalDuration}ms: ${error}`);
        // 即使失败也标记为就绪，避免白屏
        setAppReady(true);
      }
    };

    initializeApp();

    // 🧹 清理函数：组件卸载时释放播放器池资源
    return () => {
      try {
        playerPoolManager.destroy();
        log('app-init', LogType.INFO, 'Player pool destroyed on unmount');
      } catch (error) {
        log('app-init', LogType.WARNING, `Failed to destroy player pool: ${error}`);
      }
    };
  }, []);

  // 在应用未准备就绪时显示加载界面
  if (!appReady) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

/**
 * 应用根组件
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <ThemeProvider>
        <ToastProvider>
          <AppInitializer>
            <AppContent />
          </AppInitializer>
        </ToastProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
