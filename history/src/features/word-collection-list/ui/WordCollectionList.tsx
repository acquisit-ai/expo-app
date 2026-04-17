import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { WordListItem } from './WordListItem';
import type { WordItem } from '@/entities/word-collection';
import { BlurCard } from '@/shared/ui';
import { spacing } from '@/shared/config/theme';
import { log, LogType } from '@/shared/lib/logger';

export interface WordCollectionListProps {
  items: WordItem[];
  loading: boolean;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  onItemPress?: (item: WordItem) => void;
  headerComponent?: React.ReactElement | null;
  contentPaddingBottom?: number;
  contentPaddingHorizontal?: number;
}

export function WordCollectionList({
  items,
  loading,
  isRefreshing,
  error,
  onRefresh,
  onItemPress,
  headerComponent,
  contentPaddingBottom = spacing.xl,
  contentPaddingHorizontal = 0,
}: WordCollectionListProps) {
  const showEmpty = !loading && items.length === 0 && !error;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={[
        styles.listContent,
        {
          paddingBottom: contentPaddingBottom,
          paddingHorizontal: contentPaddingHorizontal,
        },
        showEmpty && styles.emptyContent,
      ]}
      refreshControl={(
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      )}
      ListHeaderComponent={headerComponent}
      renderItem={({ item }) => (
        <WordListItem
          item={item}
          onPress={(word) => {
            log('word-collection', LogType.DEBUG, `word item pressed: ${word.id}`);
            onItemPress?.(word);
          }}
        />
      )}
      ListEmptyComponent={showEmpty ? (
        <BlurCard style={styles.emptyCard}>
          <Text variant="titleMedium">暂无单词</Text>
          <Text variant="bodyMedium">下拉刷新试试吧～</Text>
        </BlurCard>
      ) : null}
      ListFooterComponent={loading && items.length > 0 ? (
        <View style={styles.footer}>
          <Text variant="bodySmall">加载中…</Text>
        </View>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 0,
    gap: spacing.xs,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
