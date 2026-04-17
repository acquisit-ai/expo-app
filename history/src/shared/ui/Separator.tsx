import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useGlass } from '@/shared/providers/GlassProvider';
import { moderateScale } from '@/shared/lib/metrics';
import { Text } from 'react-native-paper';
import { spacing as designSpacing, fontSize } from '@/shared/config/theme';

interface SeparatorProps {
  /** 分隔线中间的文本 */
  text?: string;
  /** 垂直间距 */
  spacing?: 'sm' | 'md' | 'lg';
}

/**
 * 分隔线组件
 * 显示带有可选中间文本的水平分隔线
 */
export function Separator({ text = 'or', spacing = 'md' }: SeparatorProps) {
  const { colors, config } = useGlass();

  const spacingValues = {
    sm: moderateScale(designSpacing.xs),
    md: moderateScale(designSpacing.sm),
    lg: moderateScale(designSpacing.md),
  };

  const styles = StyleSheet.create({
    separator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacingValues[spacing],
      backgroundColor: 'transparent',
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: `rgba(255, 255, 255, ${config.opacity.separator})`,
    },
    separatorText: {
      marginHorizontal: moderateScale(designSpacing.md),
      fontSize: moderateScale(fontSize.sm),
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.separator}>
      <View style={styles.separatorLine} />
      {text && <Text variant="bodySmall" style={styles.separatorText}>{text}</Text>}
      <View style={styles.separatorLine} />
    </View>
  );
}