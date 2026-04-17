/**
 * 根导航器
 * 整合所有子导航器：MainTabs, VideoStack, AuthStack
 */

import React, { useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabNavigator } from './MainTabNavigator';
import { VideoStackNavigator } from './VideoStackNavigator';
import { StandaloneVideoStackNavigator } from './StandaloneVideoStackNavigator';
import { AuthStackNavigator } from './AuthStackNavigator';
import { SavedFeedScreen } from '@/screens/saved-feed/SavedFeedScreen';
import { WordCollectionDetailScreen } from '@/screens/word-collection-detail/WordCollectionDetailScreen';
import type { RootStackParamList } from '@/shared/navigation/types';
import { useIsAuthenticated, useHasPassword } from '@/entities/user';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * 根导航器
 *
 * 架构：
 * - MainTabs: 主应用内容（Feed, Collections, Profile）- 认证后初始屏幕
 * - VideoStack: 视频播放栈（Detail ↔ Fullscreen）
 * - AuthStack: 认证流程栈（Login, VerifyCode, PasswordManage）- 未认证初始屏幕
 *
 * 导航策略：
 * - 仅在 App 初始化时根据认证状态决定 initialRouteName
 * - 之后的所有栈切换完全依赖各页面的手动导航（CommonActions.reset）
 * - 不响应运行时的状态变化，避免与手动导航冲突导致重复初始化
 *
 * 导航栈管理：
 * - 密码登录成功：AuthLoginCard 手动 reset → [MainTabs] → Feed
 * - 验证码登录成功（老用户）：VerifyCodePage 手动 reset → [MainTabs] → Feed
 * - 验证码登录成功（新用户）：VerifyCodePage → PasswordManage → 密码设置成功 → 手动 reset → [MainTabs] → Feed
 * - 忘记密码：VerifyCodePage → PasswordManage → 密码重置成功 → 手动 reset → [MainTabs] → Feed
 * - 退出登录：ProfilePage 手动 reset → [AuthStack] → Login
 */
export function RootNavigator() {
  const isAuthenticated = useIsAuthenticated();
  const hasPassword = useHasPassword();

  // ✅ 使用 useRef 记住初始路由，只在第一次渲染时决定
  // 之后即使认证状态变化，也不会触发栈结构改变
  const initialRouteRef = useRef<'MainTabs' | 'AuthStack' | null>(null);

  if (initialRouteRef.current === null) {
    // 只有已认证且有密码的用户才能进入主应用
    initialRouteRef.current = isAuthenticated && hasPassword ? 'MainTabs' : 'AuthStack';
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteRef.current || 'AuthStack'}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* ✅ 始终注册所有 Screen，不使用条件渲染 */}
      {/* 这样可以避免状态变化时导致栈结构改变和组件重新挂载 */}

      <Stack.Screen
        name="AuthStack"
        component={AuthStackNavigator}
      />

      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
      />

      <Stack.Screen
        name="VideoStack"
        component={VideoStackNavigator}
        options={{
          // 🎨 设置卡片背景色为透明，避免动画时显示白色背景
          cardStyle: {
            backgroundColor: 'transparent',
          },
        }}
      />
      <Stack.Screen
        name="StandaloneVideoStack"
        component={StandaloneVideoStackNavigator}
        options={{
          cardStyle: {
            backgroundColor: 'transparent',
          },
        }}
      />

      <Stack.Screen
        name="Favorites"
        component={SavedFeedScreen}
      />
      <Stack.Screen
        name="History"
        component={SavedFeedScreen}
      />

      <Stack.Screen
        name="WordCollectionDetail"
        component={WordCollectionDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
