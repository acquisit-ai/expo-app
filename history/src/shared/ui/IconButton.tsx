/**
 * 纯图标按钮组件
 *
 * 专门用于只显示图标的场景，如控制栏、工具栏等
 * 比ActionButton更轻量，专注于图标展示
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { iconSizes } from '@/shared/config/theme/tokens';

/**
 * 支持的图标库类型
 */
export type IconLibrary = 'MaterialCommunityIcons' | 'Ionicons';

/**
 * Material Community Icons 图标名称类型
 */
export type MaterialIconName =
  | 'star'
  | 'star-outline'
  | 'translate'
  | 'subtitles'
  | 'subtitles-outline';

/**
 * Ionicons 图标名称类型
 */
export type IoniconsIconName =
  | 'heart'
  | 'heart-outline';

/**
 * 图标按钮组件的属性接口
 */
export interface IconButtonProps {
  /** 图标名称（激活状态） */
  iconName: MaterialIconName | IoniconsIconName;
  /** 图标名称（非激活状态，可选） */
  iconNameOutline?: MaterialIconName | IoniconsIconName;
  /** 是否处于激活状态 */
  isActive?: boolean;
  /** 点击事件处理函数 */
  onPress: () => void;
  /** 激活状态下的颜色（可选，默认使用主题色） */
  activeColor?: string;
  /** 图标库类型 */
  iconLibrary?: IconLibrary;
  /** 图标大小 */
  iconSize?: number;
  /** 是否禁用按钮 */
  disabled?: boolean;
  /** 自定义样式 */
  style?: ViewStyle;
}

/**
 * 图标按钮组件
 *
 * 专门用于只显示图标的按钮，适用于控制栏、工具栏等紧凑场景
 *
 * @example
 * ```tsx
 * <IconButton
 *   iconName="heart"
 *   iconNameOutline="heart-outline"
 *   isActive={isLiked}
 *   onPress={handleLike}
 *   activeColor={theme.colors.error}
 *   iconLibrary="Ionicons"
 * />
 * ```
 */
export const IconButton: React.FC<IconButtonProps> = ({
  iconName,
  iconNameOutline,
  isActive = false,
  onPress,
  activeColor,
  iconLibrary = 'MaterialCommunityIcons',
  iconSize = iconSizes.lg,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();

  // 确定使用的图标名称
  const displayIconName = isActive ? iconName : (iconNameOutline || iconName);

  // 确定图标颜色
  const iconColor = isActive
    ? (activeColor || theme.colors.primary)
    : theme.colors.onSurfaceVariant;

  // 渲染图标
  const renderIcon = () => {
    const iconProps = {
      name: displayIconName as any,
      size: iconSize,
      color: disabled ? theme.colors.disabled : iconColor,
    };

    if (iconLibrary === 'Ionicons') {
      return <Ionicons {...iconProps} />;
    }

    return <MaterialCommunityIcons {...iconProps} />;
  };

  return (
    <TouchableOpacity
      style={[styles.iconButton, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {renderIcon()}
    </TouchableOpacity>
  );
};

/**
 * 组件样式
 */
const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20, // 圆形按钮
  },
});