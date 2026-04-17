import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { InputIcon } from '@/shared/ui';
import { iconSizes } from '@/shared/config/theme';

interface PasswordToggleIconProps {
  /** 密码是否可见 */
  showPassword: boolean;
  /** 切换密码可见性的回调 */
  onToggle: () => void;
  /** 图标大小 */
  size?: number;
}

/**
 * 密码可见性切换图标组件
 * 使用memo优化，避免不必要的重渲染
 */
export const PasswordToggleIcon = memo<PasswordToggleIconProps>(({ 
  showPassword, 
  onToggle, 
  size = iconSizes.md 
}) => (
  <TouchableOpacity onPress={onToggle}>
    <InputIcon
      name={showPassword ? "eye-off-outline" : "eye-outline"}
      size={size}
    />
  </TouchableOpacity>
));