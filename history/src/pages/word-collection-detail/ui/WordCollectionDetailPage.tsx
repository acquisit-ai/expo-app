import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabPageLayout, GlassCard, LinearProgress } from '@/shared/ui';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useForceStatusBarStyle } from '@/shared/hooks/useForceStatusBarStyle';
import { useWordCollectionEntity } from '@/entities/word-collection';
import type { WordItem } from '@/entities/word-collection';
import { spacing } from '@/shared/config/theme';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/shared/navigation/types';

interface WordCollectionDetailRouteParams {
  id: string;
}

export function WordCollectionDetailPage() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const params = (route.params as WordCollectionDetailRouteParams) ?? { id: '' };
  const { items, entities } = useWordCollectionEntity();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  useForceStatusBarStyle('auto');

  const item: WordItem | undefined = useMemo(() => {
    return entities[params.id] ?? items.find(word => word.id === params.id);
  }, [entities, items, params.id]);

  const progressValue = useMemo(() => (item ? Math.max(0, Math.min(item.progress, 100)) / 100 : 0), [item]);
  const addedAtText = useMemo(() => (
    item ? new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(item.addedAt)) : '未知时间'
  ), [item]);

  if (!item) {
    return (
      <TabPageLayout scrollable contentStyle={[styles.layout, { paddingBottom: insets.bottom + spacing.xl }]}> 
        <View style={styles.emptyWrapper}>
          <GlassCard widthRatio={0.9} padding="lg">
            <Text variant="headlineSmall" style={styles.emptyTitle}>未找到单词</Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              这个单词已经被移除或尚未同步。
            </Text>
            <Chip icon="arrow-left" onPress={() => navigation.goBack()} style={styles.backChip}>
              返回
            </Chip>
          </GlassCard>
        </View>
      </TabPageLayout>
    );
  }

  return (
    <TabPageLayout scrollable contentStyle={[styles.layout, { paddingBottom: insets.bottom + spacing.xl }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard widthRatio={0.92} padding="lg" style={styles.cardSpacing}>
          <Text variant="headlineMedium" style={styles.titleText}>{item.label}</Text>
          <View style={styles.badgeRow}>
            <Chip mode="outlined" compact>{item.kind === 'phrase' ? 'PHRASE' : item.kind.toUpperCase()}</Chip>
            {item.pos ? <Chip mode="outlined" compact>{item.pos}</Chip> : null}
            <Chip mode="outlined" compact>{item.source === 'custom' ? '自定义收藏' : '词书'}</Chip>
          </View>
        </GlassCard>

        <GlassCard widthRatio={0.92} padding="lg" style={styles.cardSpacing}>
          <Text variant="titleMedium" style={styles.sectionTitle}>中文释义</Text>
          <View style={styles.sectionBody}>
            <Text variant="bodyLarge" style={styles.chineseLabel}>
              {item.chineseLabel || '暂无简要释义'}
            </Text>
            <Text variant="bodyMedium" style={styles.chineseDef}>
              {item.chineseDef || '暂无详细释义'}
            </Text>
          </View>
        </GlassCard>

        <GlassCard widthRatio={0.92} padding="lg" style={styles.cardSpacing}>
          <Text variant="titleMedium" style={styles.sectionTitle}>学习进度</Text>
        <View style={styles.progressRow}>
          <Text variant="bodyMedium" style={styles.progressText}>{Math.round(progressValue * 100)}%</Text>
          <LinearProgress
            progress={progressValue}
            height={8}
            trackColor={theme.colors.surfaceVariant ?? 'rgba(255,255,255,0.12)'}
            borderWidth={0}
            style={styles.progressBar}
          />
        </View>
        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={styles.metaText}>收藏时间：{addedAtText}</Text>
          <Text variant="bodySmall" style={styles.metaText}>词性：{item.pos || '未知'}</Text>
        </View>
        </GlassCard>
      </ScrollView>
    </TabPageLayout>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  cardSpacing: {
    marginBottom: spacing.lg,
  },
  titleText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionBody: {
    gap: spacing.sm,
  },
  chineseLabel: {
    fontWeight: '600',
  },
  chineseDef: {
    lineHeight: 20,
    opacity: 0.9,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressText: {
    minWidth: 48,
    textAlign: 'right',
  },
  progressBar: {
    flex: 1,
  },
  metaRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  metaText: {
    opacity: 0.8,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: spacing.lg,
  },
  backChip: {
    alignSelf: 'center',
  },
});
