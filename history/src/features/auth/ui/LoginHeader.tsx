import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useGlass } from '@/shared/providers/GlassProvider';
import { moderateScale } from '@/shared/lib/metrics';

interface LoginHeaderProps {
  /** 主标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 图标名称 */
  iconName?: keyof typeof Ionicons.glyphMap;
}

/**
 * 登录页面头部组件
 * 显示图标、标题和副标题
 */
export function LoginHeader({ 
  title = 'Login',
  subtitle = 'Access your secure space',
  iconName = 'shield-checkmark'
}: LoginHeaderProps) {
  const { colors } = useGlass();

  const styles = StyleSheet.create({
    loginHeader: {
      alignItems: 'center',
      marginBottom: moderateScale(20),
      backgroundColor: 'transparent',
      minHeight: moderateScale(80),
      justifyContent: 'center',
    },
    logoIcon: {
      marginBottom: moderateScale(8),
    },
    loginTitle: {
      fontSize: moderateScale(28),
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: moderateScale(4),
      lineHeight: moderateScale(34),
      paddingVertical: moderateScale(2),
    },
    loginSubtitle: {
      fontSize: moderateScale(16),
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.loginHeader}>
      <Ionicons 
        name={iconName}
        size={moderateScale(32)} 
        color={colors.textSecondary}
        style={styles.logoIcon} 
      />
      <Text variant="headlineMedium" style={styles.loginTitle}>
        {title}
      </Text>
      <Text variant="bodyLarge" style={styles.loginSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}