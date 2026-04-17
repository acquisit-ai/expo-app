import React, { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  GlassButton, 
  GlassInput,
  InputIcon
} from '@/shared/ui';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/model';
import { BaseAuthCard, FormField } from '@/shared/ui';
import { PasswordToggleIcon } from './PasswordToggleIcon';
import { COMMON_TEXTS, CARD_TEXTS } from '@/features/auth/lib/config';
import { useFormValidation } from '../lib/useFormValidation';
import { log, LogType } from '@/shared/lib/logger';

interface AuthResetPasswordCardProps {
  /** 模式：重置密码或设置密码 */
  mode: 'reset' | 'set';
  /** 密码操作回调 */
  onPasswordAction: (password: string, confirmPassword: string) => Promise<boolean>;
  /** 返回登录页面回调 */
  onBackToLogin: () => void;
  /** 验证状态 */
  isVerifying: boolean;
}

/**
 * 密码设置/重置卡片组件
 * 支持重置密码和设置密码两种模式
 * 包含新密码输入、确认密码输入等功能
 */
export function AuthResetPasswordCard({
  mode,
  onPasswordAction,
  onBackToLogin,
  isVerifying
}: AuthResetPasswordCardProps) {
  
  // 密码可见性状态（新密码和确认密码同步）
  const [showPassword, setShowPassword] = useState(false);
  
  // 使用增强的表单验证 Hook
  const form = useFormValidation<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onSubmit', // 只在提交时验证，避免输入过程中的错误提示
    reValidateMode: 'onBlur', // 提交后在失焦时重新验证
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // 表单提交处理器 - 任何时候可点击，会验证所有字段
  const handleSubmitAction = useCallback(async () => {
    // 触发所有字段验证，自动显示错误
    const isFormValid = await form.triggerWithToast();
    if (!isFormValid) return;
    
    // 如果表单有效，执行提交
    const data = form.getValues();
    
    try {
      const success = await onPasswordAction(data.password, data.confirmPassword);
      
      if (!success) {
        // 错误已经在 onPasswordAction 内部处理和显示
        log('auth', LogType.DEBUG, 'AuthResetPasswordCard: 密码操作失败，错误已在内部处理');
      }
    } catch (error) {
      // 冷却限制等预期错误已在内部处理（显示toast），这里只记录日志
      log('auth', LogType.DEBUG, `AuthResetPasswordCard: 密码操作被阻止 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [form, onPasswordAction]);

  // 密码切换图标 - 简化版本，无需过度优化
  const passwordToggleIcon = (
    <PasswordToggleIcon 
      showPassword={showPassword}
      onToggle={() => setShowPassword(prev => !prev)}
    />
  );

  // 获取当前模式的文案配置
  const currentTexts = CARD_TEXTS.password[mode];

  return (
    <BaseAuthCard
      title={currentTexts.title}
      subtitle={currentTexts.subtitle}
      iconName={currentTexts.icon}
    >
      {/* 新密码输入框 */}
      <FormField
        control={form.control}
        name="password"
        Component={GlassInput}
        componentProps={{
          placeholder: COMMON_TEXTS.placeholders.password,
          secureTextEntry: !showPassword,
          returnKeyType: "done",
          textContentType: "newPassword",
          icon: <InputIcon name="lock-closed-outline" />,
          rightIcon: passwordToggleIcon
        }}
      />

      {/* 确认密码输入框 */}
      <FormField
        control={form.control}
        name="confirmPassword"
        Component={GlassInput}
        componentProps={{
          placeholder: COMMON_TEXTS.placeholders.confirmPassword,
          secureTextEntry: !showPassword,
          returnKeyType: "done",
          textContentType: "newPassword",
          icon: <InputIcon name="checkmark-outline" />,
          rightIcon: passwordToggleIcon
        }}
      />

      {/* 主操作按钮 */}
      <GlassButton 
        title={currentTexts.buttons.submit}
        onPress={handleSubmitAction}
        primary
        loading={isVerifying}
      />

      {/* 返回按钮 */}
      <GlassButton 
        title={COMMON_TEXTS.buttons.back}
        onPress={onBackToLogin}
        disabled={isVerifying}
      />
    </BaseAuthCard>
  );
}