import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import type { WordItem } from '@/entities/word-collection';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { spacing } from '@/shared/config/theme';
import { BlurCard, LinearProgress } from '@/shared/ui';

export interface WordListItemProps {
  item: WordItem;
  onPress?: (item: WordItem) => void;
}

export const WordListItem = memo(function WordListItem({ item, onPress }: WordListItemProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    onPress?.(item);
  };

  const progress = useMemo(() => Math.max(0, Math.min(100, item.progress)), [item.progress]);
  const progressText = useMemo(() => `${progress}%`, [progress]);

  return (
    <BlurCard widthRatio={1} padding="none" borderRadius={14} style={styles.cardWrapper}>
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: theme.colors.outlineVariant ?? theme.colors.outline, borderless: false }}
        style={({ pressed }) => [
          styles.pressable,
          {
            backgroundColor: theme.colors.surface,
            opacity: pressed ? 0.94 : 1,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={[styles.wordText, { color: theme.colors.onSurface }]}>
            {item.label}
          </Text>
          <View style={styles.headerRight}>
            <Text
              variant="bodyMedium"
              style={[styles.progressValue, { color: theme.colors.textMedium }]}
            >
              {progressText}
            </Text>
            <Ionicons
              name={item.source === 'custom' ? 'star' : 'book'}
              size={18}
              color={item.source === 'custom' ? '#FFC740' : theme.colors.textMedium}
              style={styles.sourceIcon}
            />
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaInfo}>
            <Text
              variant="bodySmall"
              style={[styles.meaningText, { color: theme.colors.textMedium }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.chineseLabel || '暂无释义'}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <LinearProgress
              progress={progress / 100}
              height={6}
              trackColor={theme.colors.surfaceVariant ?? 'rgba(255,255,255,0.12)'}
              borderWidth={1}
              borderColor={theme.colors.outlineVariant ?? 'rgba(255,255,255,0.25)'}
            />
          </View>
        </View>
      </Pressable>
    </BlurCard>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: spacing.xs,
    width: '100%',
  },
  pressable: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    width: '100%',
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  wordText: {
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  meaningText: {
    flexShrink: 1,
  },
  progressValue: {
    minWidth: 48,
    textAlign: 'right',
  },
  progressContainer: {
    flexShrink: 0,
    width: 160,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sourceIcon: {
    marginLeft: spacing.xs,
  },
});
