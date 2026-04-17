import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoginHeader } from '@/features/auth/ui/LoginHeader';

interface BaseAuthCardProps {
  /** 卡片标题 */
  title: string;
  /** 卡片副标题 */
  subtitle: string;
  /** 头部图标名称 */
  iconName: keyof typeof Ionicons.glyphMap;
  /** 卡片内容 */
  children: ReactNode;
}

/**
 * 认证卡片基础组件
 * 提供统一的头部和容器样式
 * 减少各认证卡片的重复代码
 */
export function BaseAuthCard({
  title,
  subtitle,
  iconName,
  children
}: BaseAuthCardProps) {
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
    },
    formContainer: {
      backgroundColor: 'transparent',
    }
  });

  return (
    <View style={styles.container}>
      {/* 统一头部 */}
      <LoginHeader 
        title={title}
        subtitle={subtitle}
        iconName={iconName}
      />

      {/* 表单容器 */}
      <View style={styles.formContainer}>
        {/* 子组件内容 */}
        {children}
      </View>
    </View>
  );
}