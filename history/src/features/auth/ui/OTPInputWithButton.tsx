import React from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGlass } from '@/shared/providers/GlassProvider';
import { moderateScale } from '@/shared/lib/metrics';
import { Text } from 'react-native-paper';

interface OTPInputWithButtonProps {
  /** OTP验证码值 */
  value: string;
  /** 值变化回调 */
  onChangeText: (text: string) => void;
  /** 发送验证码回调 */
  onSendCode: () => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 倒计时秒数 (0表示可以发送) */
  countdown?: number;
  /** 占位符文本 */
  placeholder?: string;
  /** 左侧图标 */
  icon?: React.ReactNode;
}

/**
 * 带发送按钮的OTP输入框组件
 * 基于GlassInput样式，右侧内嵌发送验证码按钮
 */
export function OTPInputWithButton({ 
  value,
  onChangeText,
  onSendCode,
  loading = false,
  countdown = 0,
  placeholder = "验证码",
  icon,
}: OTPInputWithButtonProps) {
  const { colors, config } = useGlass();

  // 按钮在倒计时或loading时禁用
  const canSend = countdown === 0 && !loading;
  const buttonText = countdown > 0 ? `${countdown}s` : "发送";


  const styles = StyleSheet.create({
    outerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: moderateScale(12),
      gap: moderateScale(8), // 输入框和按钮之间的间距
    },
    inputContainer: {
      flex: 1, // 占据剩余空间
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: moderateScale(16),
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(16),
      borderWidth: moderateScale(1.5),
      borderColor: colors.inputBorder,
    },
    inputIconContainer: {
      marginRight: moderateScale(12),
      backgroundColor: 'transparent',
    },
    textInput: {
      flex: 1,
      fontSize: moderateScale(16),
      color: colors.textPrimary,
      fontWeight: '500',
    },
    sendButton: {
      backgroundColor: canSend 
        ? colors.buttonPrimaryBackground
        : colors.buttonBackground,
      borderRadius: moderateScale(16),
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(16), // 与输入框高度一致
      borderWidth: moderateScale(1.5),
      borderColor: canSend
        ? colors.buttonPrimaryBorder
        : colors.buttonBorder,
      minWidth: moderateScale(80), // 最小宽度确保按钮不会太窄
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonText: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: canSend
        ? colors.textPrimary
        : colors.textSecondary,
    },
  });

  return (
    <View style={styles.outerContainer}>
      {/* 输入框部分 */}
      <View style={styles.inputContainer}>
        {icon && <View style={styles.inputIconContainer}>{icon}</View>}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="default"
        />
      </View>
      
      {/* 发送按钮部分 */}
      <TouchableOpacity 
        style={styles.sendButton}
        onPress={onSendCode}
        disabled={!canSend}
      >
        <Text variant="labelMedium" style={[styles.sendButtonText, { opacity: loading ? 0 : 1 }]}>
          {buttonText}
        </Text>
        {loading && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <ActivityIndicator 
              size="small" 
              color={canSend ? colors.textPrimary : colors.textSecondary}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}