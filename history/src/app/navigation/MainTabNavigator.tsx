/**
 * 主标签页导航器
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurTabBar, LiquidGlassTabBar } from '@/widgets/tab-bar';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import type { MainTabParamList } from '@/shared/navigation/types';

// 引入实际的 Screen 组件
import { FeedScreen } from '@/screens/feed/FeedScreen';
import { CollectionsScreen } from '@/screens/collections/CollectionsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * 主标签页导航器
 */
export function MainTabNavigator() {
  // 检查液态玻璃效果是否可用（iOS 18+ 且支持）
  const useLiquidGlass = isLiquidGlassAvailable();

  return (
    <Tab.Navigator
      initialRouteName="Feed"
      tabBar={(props) =>
        useLiquidGlass ? (
          <LiquidGlassTabBar {...props} />
        ) : (
          <BlurTabBar {...props} />
        )
      }
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{
          title: '单词本',
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: '动态',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
        }}
      />
    </Tab.Navigator>
  );
}
