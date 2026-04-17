import React, { useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useBlurList } from '@/shared/providers/BlurProvider';
import type { ColorVariant, PaddingSize } from '@/shared/config/theme/blur';

export interface BlurListItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** 自定义内容组件，显示在标题和副标题下方 */
  customContent?: React.ReactNode;
  /** 右侧控件，显示在右侧替代箭头 */
  rightControl?: React.ReactNode;
}

interface BlurListProps {
  /** 列表项数据 */
  items: BlurListItem[];
  /** 自定义样式 */
  style?: any;
  /** 卡片宽度比例 (0-1) */
  widthRatio?: number;
  /** 内边距级别 */
  padding?: PaddingSize;
  /** 颜色变体 */
  variant?: ColorVariant;
  /** 是否显示分割线 */
  showDivider?: boolean;
}

/**
 * 模糊态列表组件
 * 使用新的 BlurProvider 架构，提供预计算样式和优化渲染
 */
export const BlurList = React.memo(({
  items,
  style,
  widthRatio = 0.9,
  padding = 'md',
  variant = 'default',
  showDivider = true
}: BlurListProps) => {
  const { theme } = useTheme();
  const { styles, colors, blur, getWidthVariant } = useBlurList();

  const backgroundColor = colors[variant] || colors.default;
  const widthVariant = getWidthVariant(widthRatio);

  const renderItem = (item: BlurListItem, index: number) => {
    const isLast = index === items.length - 1;
    const ItemWrapper = item.onPress && !item.disabled ? TouchableOpacity : View;

    // 包装 onPress 函数，添加震动反馈
    const handlePress = useCallback(() => {
      if (item.onPress && !item.disabled) {
        // 触发选择反馈 - 轻快的"嘀嗒"感
        Haptics.selectionAsync();
        item.onPress();
      }
    }, [item.onPress, item.disabled]);

    return (
      <View key={item.id}>
        <ItemWrapper
          style={[
            styles.item.base,
            item.disabled && styles.disabled.item
          ]}
          onPress={item.onPress && !item.disabled ? handlePress : undefined}
          activeOpacity={0.7}
        >
          {item.icon && (
            <View style={styles.iconContainer.base}>
              {item.icon}
            </View>
          )}

          <View style={styles.textContainer.base}>
            <Text style={[
              styles.titleText.base,
              { color: theme.colors.textMedium },
              item.disabled && { color: theme.colors.textSecondary }
            ]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[
                styles.subtitleText.base,
                { color: theme.colors.textSecondary },
                item.disabled && { color: theme.colors.textSecondary }
              ]}>
                {item.subtitle}
              </Text>
            )}
            {item.customContent && (
              <View style={styles.customContentContainer.base}>
                {item.customContent}
              </View>
            )}
          </View>

          {item.rightControl ? (
            <View style={styles.rightControlContainer.base}>
              {item.rightControl}
            </View>
          ) : item.onPress && !item.disabled && (
            <View style={styles.chevronContainer.base}>
              <Text style={[styles.chevron.base, { color: theme.colors.textMedium }]}>›</Text>
            </View>
          )}
        </ItemWrapper>

        {showDivider && !isLast && (
          <View style={[styles.divider.base, { backgroundColor: theme.colors.outline }]} />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container.base, styles.variants[widthVariant], { alignSelf: 'center' }, style]}>
      <View style={{
        borderWidth: 1,
        borderColor: theme.colors.borderCream,
        borderRadius: styles.content.base.borderRadius || 16,
      }}>
        <BlurView
          style={[styles.content.base, { backgroundColor }]}
          tint={blur.tint}
          intensity={blur.intensity}
        >
          <View style={styles.content.highlight} />
          <View style={styles.padding[padding]}>
            {items.map((item, index) => renderItem(item, index))}
          </View>
        </BlurView>
      </View>
    </View>
  );
});

