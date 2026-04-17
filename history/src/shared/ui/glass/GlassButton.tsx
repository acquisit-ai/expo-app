import React, { useCallback } from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useGlassButton } from '@/shared/providers/GlassProvider';

interface GlassButtonProps extends TouchableOpacityProps {
  /** 按钮文本 */
  title: string;
  /** 是否为主要按钮 */
  primary?: boolean;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 玻璃态按钮组件
 * 具有半透明背景和精细边框的现代按钮
 */
export function GlassButton({
  title,
  onPress,
  primary = false,
  loading = false,
  style,
  ...props
}: GlassButtonProps) {
  const { styles, colors } = useGlassButton();

  // 选择按钮样式变体
  const buttonStyles = primary ? styles.primary : styles.secondary;
  
  // 获取加载指示器颜色，与文本颜色保持一致
  const indicatorColor = primary ? colors.textPrimary : colors.textSecondary;

  // 包装 onPress 函数，添加震动反馈
  const handlePress = useCallback((event: any) => {
    if (onPress && !loading) {
      // 触发选择反馈 - 轻快的"嘀嗒"感
      Haptics.selectionAsync();
      onPress(event);
    }
  }, [onPress, loading]);

  return (
    <TouchableOpacity
      onPress={loading ? undefined : handlePress}
      style={style}
      disabled={loading}
      {...props}
    >
      <View style={buttonStyles.button}>
        <View style={buttonStyles.content}>
          <Text variant="labelLarge" style={[buttonStyles.text, { opacity: loading ? 0 : 1 }]}>
            {title}
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
                color={indicatorColor}
              />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}