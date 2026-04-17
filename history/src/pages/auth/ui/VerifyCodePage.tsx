import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { VerifyCodeScreenProps } from '@/shared/navigation/types';
import { useAuthOperations } from '@/features/auth/lib/auth-operations';
import { useSession, useHasPassword } from '@/entities/user';
import { AuthEmailCodeCard } from '@/features/auth/ui';
import { AuthPageLayout } from './AuthPageLayout';
import { log, LogType } from '@/shared/lib/logger';

/**
 * 统一的验证码页面
 * 通过 mode 参数区分登录和忘记密码两种模式
 * - mode="login": 验证码登录，成功后根据用户状态跳转
 * - mode="forgotPassword": 忘记密码验证，成功后跳转重置密码
 */
export function VerifyCodePage() {
  const navigation = useNavigation<VerifyCodeScreenProps['navigation']>();
  const route = useRoute<VerifyCodeScreenProps['route']>();
  const { mode = 'login', email } = route.params;

  // ✅ 数据状态来源于 entities/user
  const session = useSession();
  const hasPassword = useHasPassword();

  // ✅ 业务逻辑来源于 features/auth
  const {
    sendCode,
    verifyCode,
    sendCodeCooldown,
    isVerifyingCode,
    isSendingCode
  } = useAuthOperations();

  // 跟踪是否已经导航到密码管理页面，防止重复导航
  const hasNavigatedRef = useRef(false);

  // 简化的路由处理逻辑 - 认证成功后自动跳转
  useEffect(() => {
    if (!session || isVerifyingCode) return;

    // 忘记密码模式：无论 hasPassword 状态如何，都需要重置密码
    if (mode === 'forgotPassword') {
      // ✅ 防止重复导航：只在第一次触发时导航
      if (!hasNavigatedRef.current) {
        navigation.navigate('PasswordManage', { mode: 'reset' });
        hasNavigatedRef.current = true;
      }
      return;
    }

    // 登录模式：根据密码状态决定跳转
    if (mode === 'login') {
      if (hasPassword) {
        // ✅ 老用户：清空导航栈，直接进入主应用
        // ✅ 防止重复导航：只在第一次触发时导航
        if (!hasNavigatedRef.current) {
          log('auth', LogType.INFO, '验证码登录成功（老用户），清空导航栈并进入主应用');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            })
          );
          hasNavigatedRef.current = true;
        }
      } else {
        // ✅ 新用户需要设置密码
        // ✅ 防止重复导航：只在第一次触发时导航
        if (!hasNavigatedRef.current) {
          log('auth', LogType.INFO, '验证码登录成功（新用户），导航到密码设置页面');
          navigation.navigate('PasswordManage', { mode: 'set' });
          hasNavigatedRef.current = true;
        }
      }
    }
  }, [session, hasPassword, mode, isVerifyingCode, navigation]);

  // 返回登录页面的处理器
  const handleBackToLogin = useCallback(() => {
    // ✅ 使用 goBack 返回到之前的 Login 实例，避免重复推送
    navigation.goBack();
  }, [navigation]);

  return (
    <AuthPageLayout>
      <AuthEmailCodeCard
        mode={mode}
        onEmailCodeAction={(emailParam, code) => verifyCode(emailParam, code, mode)}
        onSendCode={(emailParam) => sendCode(emailParam, mode)}
        onBackToLogin={handleBackToLogin}
        isVerifying={isVerifyingCode}
        isSendingCode={isSendingCode}
        initialEmail={email}
        sendCodeCooldown={sendCodeCooldown}
      />
    </AuthPageLayout>
  );
}