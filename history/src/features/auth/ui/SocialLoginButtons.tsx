import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useGlass } from '@/shared/providers/GlassProvider';
import { moderateScale } from '@/shared/lib/metrics';
import { SocialButton } from './SocialButton';
import { iconSizes } from '@/shared/config/theme';

interface SocialLoginButtonsProps {
  /** 社交登录回调 */
  onSocialLogin: (provider: string) => void;
  /** 是否禁用按钮 */
  disabled?: boolean;
}

/**
 * 社交登录按钮组
 * 包含 Apple 和 Google 登录按钮
 */
export function SocialLoginButtons({ 
  onSocialLogin, 
  disabled = false 
}: SocialLoginButtonsProps) {
  const { colors } = useGlass();

  const styles = StyleSheet.create({
    socialButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 0,
      backgroundColor: 'transparent',
    },
  });

  return (
    <View style={styles.socialButtons}>
      <SocialButton 
        icon={
          <AntDesign 
            name="apple" 
            size={moderateScale(iconSizes.lg)} 
            color={colors.textSecondary}
          />
        }
        onPress={() => onSocialLogin('apple')}
        disabled={disabled}
      />
      <SocialButton 
        icon={
          <AntDesign 
            name="google" 
            size={moderateScale(iconSizes.lg)} 
            color={colors.textSecondary}
          />
        }
        onPress={() => onSocialLogin('google')}
        disabled={disabled}
      />
    </View>
  );
}