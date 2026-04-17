import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useGlass } from '@/shared/providers/GlassProvider';
import { moderateScale } from '@/shared/lib/metrics';

interface InputIconProps {
  /** 图标名称 */
  name: keyof typeof Ionicons.glyphMap;
  /** 图标大小 */
  size?: number;
  /** 自定义颜色（可选） */
  color?: string;
}

/**
 * 输入框图标组件
 * 统一的输入框图标样式，自动应用主题颜色
 */
export function InputIcon({ 
  name, 
  size = 16,
  color
}: InputIconProps) {
  const { colors } = useGlass();
  
  const defaultColor = colors.textSecondary;
  
  return (
    <Ionicons 
      name={name}
      size={moderateScale(size)}
      color={color || defaultColor}
    />
  );
}