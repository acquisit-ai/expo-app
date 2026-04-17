import React from 'react';
import { TextInputProps } from 'react-native';
import { GlassInput } from '@/shared/ui/glass/GlassInput';
import { InputIcon } from '@/shared/ui';

interface EmailInputProps extends Omit<TextInputProps, 'keyboardType' | 'autoCapitalize'> {
  /** 邮箱值 */
  value: string;
  /** 值变化回调 */
  onChangeText: (text: string) => void;
  /** 占位符文本 */
  placeholder?: string;
}

/**
 * 邮箱输入框组件
 * 封装了邮箱输入的通用配置和样式
 */
export function EmailInput({ 
  value,
  onChangeText,
  placeholder = "邮箱地址",
  ...props
}: EmailInputProps) {
  return (
    <GlassInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      returnKeyType="done"
      textContentType="emailAddress"
      icon={<InputIcon name="mail-outline" />}
      {...props}
    />
  );
}