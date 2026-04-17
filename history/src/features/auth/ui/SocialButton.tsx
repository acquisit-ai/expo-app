import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { useGlassSocial } from '@/shared/providers/GlassProvider';

interface SocialButtonProps extends TouchableOpacityProps {
  /** 图标元素 */
  icon: React.ReactNode;
}

/**
 * 社交登录按钮组件
 * 用于社交媒体登录的紧凑型玻璃态按钮
 */
export function SocialButton({ 
  icon, 
  style,
  ...props 
}: SocialButtonProps) {
  const { styles } = useGlassSocial();

  return (
    <TouchableOpacity style={style} {...props}>
      <View style={styles.button.container}>
        <View style={styles.button.icon}>{icon}</View>
      </View>
    </TouchableOpacity>
  );
}