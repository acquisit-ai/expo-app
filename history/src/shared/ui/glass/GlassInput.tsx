import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useGlassInput } from '@/shared/providers/GlassProvider';

interface GlassInputProps extends Omit<TextInputProps, 'placeholder' | 'value' | 'onChangeText'> {
  /** 占位符文本 */
  placeholder: string;
  /** 输入值 */
  value: string;
  /** 值变化回调 */
  onChangeText: (text: string) => void;
  /** 左侧图标 */
  icon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
}

/**
 * 玻璃态输入框组件
 * 具有半透明背景和精细边框的现代输入框
 */
export function GlassInput({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  keyboardType, 
  autoCapitalize, 
  icon,
  rightIcon,
  ...props 
}: GlassInputProps) {
  const { styles, colors, placeholderTextColor } = useGlassInput();

  return (
    <View style={styles.container.input}>
      {icon && <View style={styles.container.iconLeft}>{icon}</View>}
      <TextInput
        style={styles.text.input}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        {...props}
      />
      {rightIcon && <View style={styles.container.iconRight}>{rightIcon}</View>}
    </View>
  );
}