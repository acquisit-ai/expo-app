import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@/shared/navigation/types';
import { useAuthOperations } from '../lib/auth-operations';
import { useIsAuthenticated } from '@/entities/user';
import { GlassInput, GlassButton, InputIcon } from '@/shared/ui';
import { Text } from 'react-native-paper';
import { EmailInput } from './EmailInput';
import { BaseAuthCard } from '@/shared/ui';
import { PasswordToggleIcon } from './PasswordToggleIcon';
import { COMMON_TEXTS, CARD_TEXTS, UI_TEXTS } from '../lib/config';
import { loginSchema, AuthLoginData } from '../model/validation';
import { useFormValidation } from '../lib/useFormValidation';
import { useGlass } from '@/shared/providers/GlassProvider';
import { moderateScale } from '@/shared/lib/metrics';
import { log, LogType } from '@/shared/lib/logger';

/**
 * 登录卡片组件
 */
export function AuthLoginCard() {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();

  // ✅ 数据状态来源于 entities/user
  const isAuthenticated = useIsAuthenticated();

  // ✅ 业务逻辑来源于 features/auth
  const { signIn, isSigningIn } = useAuthOperations();

  const { colors } = useGlass();
  
  // 简化状态管理
  const [showPassword, setShowPassword] = useState(false);
  
  // 表单管理 - 使用增强的 Hook
  const form = useFormValidation<AuthLoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // 计算组合状态
  const isFormDisabled = form.formState.isSubmitting || isSigningIn;

  // 登录表单处理器
  const onSubmit = async (data: AuthLoginData) => {
    try {
      const success = await signIn(data.email, data.password);
      if (success) {
        // ✅ 密码登录成功，清空导航栈，直接进入 MainTabs > Feed
        log('auth-card', LogType.INFO, '密码登录成功，清空导航栈并进入主应用');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          })
        );
      }
    } catch (error) {
      // 冷却限制等预期错误已在内部处理（显示toast），这里不再记录日志避免重复
    }
  };

  // 验证码登录处理器
  const handleEmailCodeLogin = () => {
    if (isFormDisabled) return;

    // ✅ Login 已在 AuthStack 内部，直接导航到同级的 VerifyCode
    navigation.navigate('VerifyCode', { mode: 'login' });
  };

  // 忘记密码处理器
  const handleForgotPassword = useCallback(() => {
    if (isFormDisabled) return;
    log('auth', LogType.INFO, UI_TEXTS.actions.forgotPasswordClick);
    // ✅ Login 已在 AuthStack 内部，直接导航到同级的 VerifyCode
    navigation.navigate('VerifyCode', { mode: 'forgotPassword' });
  }, [isFormDisabled, navigation]);

  return (
    <BaseAuthCard
      title={CARD_TEXTS.login.title}
      subtitle={CARD_TEXTS.login.subtitle}
      iconName={CARD_TEXTS.login.icon}
    >
      {/* 邮箱输入框 */}
      <Controller
        control={form.control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <EmailInput
            placeholder={COMMON_TEXTS.placeholders.email}
            value={value || ''}
            onChangeText={onChange}
            editable={!isFormDisabled}
          />
        )}
      />

      {/* 密码输入框 */}
      <Controller
        control={form.control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <GlassInput
            placeholder={COMMON_TEXTS.placeholders.password}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            textContentType="password"
            icon={<InputIcon name="lock-closed-outline" />}
            rightIcon={
              <PasswordToggleIcon 
                showPassword={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />
            }
            value={value || ''}
            onChangeText={onChange}
            editable={!isFormDisabled}
          />
        )}
      />

      {/* 忘记密码链接 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        marginBottom: moderateScale(16),
        opacity: isFormDisabled ? 0.5 : 1
      }}>
        <TouchableOpacity onPress={handleForgotPassword} disabled={isFormDisabled}>
          <Text variant="bodySmall" style={{
            fontSize: moderateScale(14),
            color: colors.textSecondary
          }}>
            忘记密码？
          </Text>
        </TouchableOpacity>
      </View>

      {/* 主登录按钮 */}
      <GlassButton 
        title={isFormDisabled ? UI_TEXTS.loading.signin : CARD_TEXTS.login.buttons.signin}
        onPress={form.handleSubmitWithToast(onSubmit)}
        primary
        loading={isFormDisabled}
        disabled={isFormDisabled}
      />

      {/* 验证码登录按钮 */}
      <GlassButton 
        title={CARD_TEXTS.login.buttons.emailCodeLogin}
        onPress={handleEmailCodeLogin}
        disabled={isFormDisabled}
      />
    </BaseAuthCard>
  );
}