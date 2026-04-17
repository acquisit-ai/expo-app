/**
 * 认证栈导航器
 */

import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import type { AuthStackParamList } from '@/shared/navigation/types';

// 引入实际的 Screen 组件
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { VerifyCodeScreen } from '@/screens/auth/VerifyCodeScreen';
import { PasswordManageScreen } from '@/screens/auth/PasswordManageScreen';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * 认证栈导航器
 */
export function AuthStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        ...TransitionPresets.SlideFromRightIOS,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
      <Stack.Screen
        name="VerifyCode"
        component={VerifyCodeScreen}
      />
      <Stack.Screen
        name="PasswordManage"
        component={PasswordManageScreen}
      />
    </Stack.Navigator>
  );
}
