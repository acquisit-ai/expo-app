import React from 'react';
import { Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GlassButton, InputIcon } from '@/shared/ui';
import { OTPInputWithButton } from './OTPInputWithButton';
import { EmailInput } from './EmailInput';
// OTP倒计时现在使用全局状态管理
import { emailCodeSchema, type EmailCodeFormData } from '@/features/auth/model';
import { BaseAuthCard, FormField } from '@/shared/ui';
import { COMMON_TEXTS, CARD_TEXTS } from '@/features/auth/lib/config';
import { useFormValidation } from '../lib/useFormValidation';
import { log, LogType } from '@/shared/lib/logger';
import { maskEmail } from '@/shared/lib/private-data-masking';

interface AuthEmailCodeCardProps {
  /** 模式：登录或忘记密码 */
  mode: 'login' | 'forgotPassword';
  /** 邮箱验证码操作回调 */
  onEmailCodeAction: (email: string, code: string) => Promise<boolean>;
  /** 发送验证码回调 */
  onSendCode: (email: string) => Promise<boolean>;
  /** 返回登录页面回调 */
  onBackToLogin: () => void;
  /** 验证状态 */
  isVerifying: boolean;
  /** 发送验证码加载状态 */
  isSendingCode: boolean;
  /** 初始邮箱值 */
  initialEmail?: string;
  /** 全局发送验证码倒计时（秒） */
  sendCodeCooldown: number;
}

/**
 * 邮箱验证码卡片组件
 * 支持登录和忘记密码两种模式
 * 包含邮箱输入、验证码输入、发送验证码等功能
 */
export function AuthEmailCodeCard({
  mode,
  onEmailCodeAction,
  onSendCode,
  onBackToLogin,
  isVerifying,
  isSendingCode,
  initialEmail = '',
  sendCodeCooldown
}: AuthEmailCodeCardProps) {
  // 使用统一的布尔状态字段
  const isCountingDown = sendCodeCooldown > 0;
  
  // 使用增强的表单验证 Hook
  const form = useFormValidation<EmailCodeFormData>({
    resolver: zodResolver(emailCodeSchema),
    mode: 'onSubmit', // 只在提交时验证，避免输入过程中的错误提示
    reValidateMode: 'onBlur', // 提交后在失焦时重新验证
    defaultValues: {
      email: initialEmail,
      code: ''
    }
  });

  // 发送验证码处理器 - 任何时候可点击，会验证邮箱字段
  const handleSendCode = async () => {
    // 如果正在倒计时或正在发送，直接返回
    if (isCountingDown || isSendingCode) return;
    
    // 触发邮箱字段验证，自动显示错误
    const isEmailValid = await form.triggerWithToast('email');
    if (!isEmailValid) return;
    
    const email = form.getValues('email');
    
    try {
      const success = await onSendCode(email);
      
      if (success) {
        // 倒计时现在由 sendCode 方法自动启动
        log('auth', LogType.INFO, `OTP sent to ${maskEmail(email)}`);
      } else {
        log('auth', LogType.WARNING, `Failed to send OTP to ${maskEmail(email)}`);
        // API失败时不启动倒计时，用户可以立即重试
      }
    } catch (error) {
      // 冷却限制等预期错误已在内部处理（显示toast），这里只记录日志
      log('auth', LogType.DEBUG, `AuthEmailCodeCard: 发送验证码被阻止 - ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 表单提交处理器 - 任何时候可点击，会验证所有字段
  const handleSubmitAction = async () => {
    // 触发所有字段验证，自动显示错误
    const isFormValid = await form.triggerWithToast();
    if (!isFormValid) return;
    
    // 如果表单有效，执行提交
    const data = form.getValues();
    
    try {
      const success = await onEmailCodeAction(data.email, data.code);
      
      if (!success) {
        // 错误已经在 onEmailCodeAction 内部处理和显示
        log('auth', LogType.DEBUG, 'AuthEmailCodeCard: 验证码验证失败，错误已在内部处理');
      }
    } catch (error) {
      // 冷却限制等预期错误已在内部处理（显示toast），这里只记录日志
      log('auth', LogType.DEBUG, `AuthEmailCodeCard: 验证操作被阻止 - ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  // 获取当前模式的文案配置
  const currentTexts = CARD_TEXTS.emailCode[mode];

  return (
    <BaseAuthCard
      title={currentTexts.title}
      subtitle={currentTexts.subtitle}
      iconName={currentTexts.icon}
    >
      {/* 邮箱输入框 */}
      <FormField
        control={form.control}
        name="email"
        Component={EmailInput}
        componentProps={{
          placeholder: COMMON_TEXTS.placeholders.email
        }}
      />

      {/* 验证码输入框 */}
      <Controller
        control={form.control}
        name="code"
        render={({ field: { onChange, value } }) => (
          <OTPInputWithButton
            value={value || ''}
            onChangeText={onChange}
            onSendCode={handleSendCode}
            loading={isSendingCode}
            countdown={sendCodeCooldown}
            placeholder={COMMON_TEXTS.placeholders.verificationCode}
            icon={<InputIcon name="shield-checkmark-outline" />}
          />
        )}
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