/**
 * 视频栈导航器
 * 🔑 关键特性：Detail 和 Fullscreen 使用自定义 Reanimated 转场动画
 */

import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import type { VideoStackParamList } from '@/shared/navigation/types';

// 引入实际的 Screen 组件
import { VideoDetailScreen } from '@/screens/video/VideoDetailScreen';
import { VideoFullscreenScreen } from '@/screens/video/VideoFullscreenScreen';

// 引入自定义转场动画
import { videoPlayerFadeTransition, videoTransitionSpec } from './videoStackTransitions';

const Stack = createStackNavigator<VideoStackParamList>();

/**
 * 视频栈导航器
 *
 * 🔑 架构说明：
 * - Detail 和 Fullscreen 在同一个栈中
 * - Detail ↔ Fullscreen 使用自定义 Fade 动画（250ms）
 * - Feed → VideoStack 使用默认 Stack 动画
 */
export function VideoStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="VideoFullscreen"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        // 为 VideoStack 内部切换配置自定义 Fade 动画
        cardStyleInterpolator: videoPlayerFadeTransition,
        transitionSpec: {
          open: videoTransitionSpec,
          close: videoTransitionSpec,
        },
        // 🎨 设置卡片背景色为透明，避免动画时显示白色背景
        cardStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen
        name="VideoDetail"
        component={VideoDetailScreen}
        options={{
          // 确保 replace 操作也有动画
          animationTypeForReplace: 'push',
        }}
      />

      <Stack.Screen
        name="VideoFullscreen"
        component={VideoFullscreenScreen}
        options={{
          // 确保 replace 操作也有动画
          animationTypeForReplace: 'push',
        }}
      />
    </Stack.Navigator>
  );
}
