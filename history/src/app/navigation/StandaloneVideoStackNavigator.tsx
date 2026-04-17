/**
 * 独立视频播放栈导航器
 * 供收藏/历史列表使用，复用现有的 Detail/Fullscreen 页面
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { StandaloneVideoStackParamList } from '@/shared/navigation/types';
import { StandaloneVideoDetailScreen } from '@/screens/standalone-video/StandaloneVideoDetailScreen';
import { StandaloneVideoFullscreenScreen } from '@/screens/standalone-video/StandaloneVideoFullscreenScreen';
import { videoPlayerFadeTransition, videoTransitionSpec } from './videoStackTransitions';

const Stack = createStackNavigator<StandaloneVideoStackParamList>();

export function StandaloneVideoStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="StandaloneVideoDetail"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: videoPlayerFadeTransition,
        transitionSpec: {
          open: videoTransitionSpec,
          close: videoTransitionSpec,
        },
        cardStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen
        name="StandaloneVideoDetail"
        component={StandaloneVideoDetailScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen
        name="StandaloneVideoFullscreen"
        component={StandaloneVideoFullscreenScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
    </Stack.Navigator>
  );
}
