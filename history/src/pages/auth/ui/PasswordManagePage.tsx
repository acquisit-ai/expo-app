import React, { useState, useCallback } from 'react';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { PasswordManageScreenProps } from '@/shared/navigation/types';
import { useAuthOperations } from '@/features/auth/lib/auth-operations';
import { AuthResetPasswordCard } from '@/features/auth/ui';
import { log, LogType } from '@/shared/lib/logger';
import { AuthPageLayout } from './AuthPageLayout';

// 简化的状态类型定义
type SimpleStatus = 'idle' | 'loading' | 'error';

/**
 * 统一的密码管理页面
 * 通过 mode 参数区分设置密码和重置密码两种模式
 * - mode="set": 新用户设置初始密码，成功后跳转主应用
 * - mode="reset": 忘记密码后重置，成功后跳转主应用
 */
export function PasswordManagePage() {
  const navigation = useNavigation<PasswordManageScreenProps['navigation']>();
  const route = useRoute<PasswordManageScreenProps['route']>();
  const { mode = 'set' } = route.params;

  // ✅ 使用新的业务逻辑 Hook
  const { setPassword, signOut, isSettingPassword, isSigningOut } = useAuthOperations();
  
  // 简化的派生状态 - 使用业务逻辑状态
  const isLoading = isSettingPassword || isSigningOut;
  const modeText = mode === 'set' ? '设置' : '重置';

  // 简化的密码操作处理器
  const handlePasswordAction = useCallback(async (password: string): Promise<boolean> => {
    log('auth', LogType.INFO, `开始${modeText}密码流程`);

    const success = await setPassword(password, mode);

    if (success) {
      log('auth', LogType.INFO, `${modeText}密码成功，清空导航栈并进入主应用`);
      // ✅ setPassword 成功后，清空导航栈，直接进入 MainTabs > Feed
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
      return true;
    } else {
      log('auth', LogType.WARNING, `${modeText}密码失败，停留在当前页面`);
      return false;
    }
  }, [modeText, setPassword, mode, navigation]);

  // 简化的返回操作处理器
  const handleBack = useCallback(async () => {
    log('auth', LogType.INFO, '开始执行返回操作');

    log('auth', LogType.INFO, '密码管理页面返回：执行静默 logout');
    await signOut(true);

    // ✅ 无论 signOut 成功与否，都清空导航栈回到登录页
    // ✅ 这和退出登录的行为完全一致
    log('auth', LogType.INFO, '密码管理页面返回：清空导航栈并回到登录页');
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'AuthStack' }],
      })
    );
  }, [signOut, navigation]);

  return (
    <AuthPageLayout>
      <AuthResetPasswordCard
        mode={mode}
        onPasswordAction={handlePasswordAction}
        onBackToLogin={handleBack}
        isVerifying={isLoading}
      />
    </AuthPageLayout>
  );
}