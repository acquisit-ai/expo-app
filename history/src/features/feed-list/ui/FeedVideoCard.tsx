import React, { memo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { BlurCard } from '@/shared/ui/blur';
import { useBlurCard } from '@/shared/providers/BlurProvider';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { blurism } from '@/shared/config/theme/blur';
import { spacing, fontSize, fontWeight, borderRadius, colors as tokenColors } from '@/shared/config/theme/tokens';
import { formatTime } from '@/shared/lib/time-format';
import type { ColorVariant } from '@/shared/config/theme/blur';
import type { VideoMetaData } from '@/shared/types';

interface FeedVideoCardProps {
  /** 视频数据 */
  video: VideoMetaData;
  /** 点击回调 */
  onPress?: () => void;
  /** 自定义样式 */
  style?: any;
  /** 卡片宽度比例 (0-1) */
  widthRatio?: number;
  /** 颜色变体 */
  variant?: ColorVariant;
  /** 是否禁用点击 */
  disabled?: boolean;
}

/**
 * Feed 视频卡片组件
 * 专门为 Feed 列表设计的视频卡片，支持 16:9 比例的视频缩略图显示
 * 直接使用 API 提供的 thumbnail_url (WebP 格式)
 */

// 渐变配置
const GRADIENT_CONFIG = {
  colors: ['transparent', 'rgba(0, 0, 0, 0.17)'],
  height: '25%',
} as const;

export const FeedVideoCard = memo(({
  video,
  onPress,
  style,
  widthRatio = 0.9,
  variant = 'default',
  disabled = false
}: FeedVideoCardProps) => {
  // 扁平化的 VideoMetaData 结构
  const { title, tags, thumbnail_url, duration } = video;
  const { colors } = useBlurCard();
  const { theme } = useTheme();

  // 将秒数转换为时长格式 (mm:ss)
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '00:00';
    return formatTime(seconds);
  };

  // 将所有标签组合成字符串并限制长度
  const getDisplayTags = (tags?: string[], maxLength: number = 30): string => {
    if (!tags || tags.length === 0) return '';
    const combinedTags = tags.join(', ');
    if (combinedTags.length <= maxLength) return combinedTags;
    return combinedTags.substring(0, maxLength) + '...';
  };

  // 处理点击事件
  const handlePress = () => {
    if (!disabled && onPress) {
      // 触发轻微震动反馈
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <BlurCard
      style={style}
      widthRatio={widthRatio}
      padding="none"
      variant={variant}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.8}
        style={styles.container}
      >
        {/* 视频缩略图 */}
        <View style={styles.imageContainer}>
          {thumbnail_url ? (
            <Image
              source={{ uri: thumbnail_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <Ionicons
                name="videocam-outline"
                size={spacing.xxxl}
                color={colors.neutral}
              />
              <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
                暂无缩略图
              </Text>
            </View>
          )}

          {/* 底部向上渐变遮罩 */}
          <LinearGradient
            colors={GRADIENT_CONFIG.colors}
            style={styles.gradientOverlay}
          />

          {/* 标签显示 */}
          {getDisplayTags(tags) && (
            <View style={[styles.tagContainer, { backgroundColor: colors.neutral }]}>
              <Text style={styles.tagText}>{getDisplayTags(tags)}</Text>
            </View>
          )}

          {/* 时长显示 */}
          {duration && (
            <View style={[styles.durationContainer, { backgroundColor: colors.neutral }]}>
              <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            </View>
          )}
        </View>

        {/* 视频信息 */}
        <View style={styles.contentContainer}>
          <Text style={[styles.titleText, { color: theme.colors.textMedium }]} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </BlurCard>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，优化重渲染 - 扁平化的 VideoMetaData 结构
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.widthRatio === nextProps.widthRatio &&
    prevProps.variant === nextProps.variant
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderTopLeftRadius: blurism.components.card.borderRadius,
    borderTopRightRadius: blurism.components.card.borderRadius,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GRADIENT_CONFIG.height,
  },
  tagContainer: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: tokenColors.white, // 固定白色，因为背景是深色半透明
  },
  durationContainer: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
  },
  durationText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: tokenColors.white, // 固定白色，因为背景是深色半透明
  },
  contentContainer: {
    padding: blurism.components.card.padding.md,
  },
  titleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fallbackText: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});