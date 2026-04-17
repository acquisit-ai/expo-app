import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SavedFeedList } from '@/features/saved-feed-list';
import type { VideoMetaData } from '@/shared/types';
import { TabPageLayout, BlurCard } from '@/shared/ui';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useForceStatusBarStyle } from '@/shared/hooks/useForceStatusBarStyle';
import { useDebounce } from '@/shared/hooks';
import { spacing } from '@/shared/config/theme';
import { log, LogType } from '@/shared/lib/logger';
import { toast } from '@/shared/lib/toast';
import type { SavedFeedKind } from '../model/types';
import { useSavedFeedController } from '../model/useSavedFeedController';
import type { RootStackParamList } from '@/shared/navigation/types';

const LOAD_MORE_DEBOUNCE_MS = 800;

type SavedFeedRoute = RouteProp<RootStackParamList, 'Favorites'> | RouteProp<RootStackParamList, 'History'>;

type SavedFeedPageProps = {
  kind: SavedFeedKind;
};

export function SavedFeedPage({ kind }: SavedFeedPageProps) {
  const { theme } = useTheme();
  const controller = useSavedFeedController(kind);
  const { title, emptyState, videoIds, loading, initialize, loadMore, refresh } = controller;
  const [isInitialized, setIsInitialized] = useState(false);

  useForceStatusBarStyle('auto');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      initialize()
        .then(() => {
          if (isActive) {
            setIsInitialized(true);
          }
        })
        .catch(() => {
          // 失败情况已由 service 内日志 + toast 处理
        });

      return () => {
        isActive = false;
      };
    }, [initialize]),
  );

  useEffect(() => {
    if (!isInitialized && videoIds.length > 0) {
      setIsInitialized(true);
    }
  }, [isInitialized, videoIds.length]);

  const defaultVideoPress = useCallback((video: VideoMetaData) => {
    log('saved-feed-page', LogType.INFO, `Saved feed item clicked (kind=${kind}, video=${video.id})`);
    toast.show({
      type: 'info',
      title: '敬请期待',
      message: '播放功能即将上线',
      duration: 2000,
    });
  }, [kind]);

  const onVideoPress = controller.onItemPress ?? defaultVideoPress;

  const handleRefresh = useCallback(() => {
    refresh().catch(() => {
      // service 已处理
    });
  }, [refresh]);

  const handleEndReachedCore = useCallback(() => {
    if (loading.isLoading && loading.loadingType !== null && loading.loadingType !== 'loadMore') {
      return;
    }

    if (!loading.hasMore) {
      return;
    }

    loadMore().catch(() => {
      // service 已处理
    });
  }, [loadMore, loading.hasMore, loading.isLoading, loading.loadingType]);

  const handleEndReached = useDebounce(handleEndReachedCore, LOAD_MORE_DEBOUNCE_MS);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerContainer: {
          width: '100%',
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
        },
        headerTitle: {
          fontSize: 24,
          fontWeight: '600',
        },
        listContainer: {
          flex: 1,
        },
        emptyContainer: {
          width: '100%',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
        },
        emptyCard: {
          width: '90%',
          paddingVertical: spacing.xl,
          alignItems: 'center',
          gap: spacing.md,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: '600',
        },
        emptySubtitle: {
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        },
      }),
    [],
  );

  const EmptyComponent = useMemo(() => {
    if (loading.isLoading && videoIds.length === 0) {
      return () => null;
    }

    return () => (
      <View style={styles.emptyContainer}>
        <BlurCard style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: theme.colors.textMedium }]}>{emptyState.title}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{emptyState.description}</Text>
        </BlurCard>
      </View>
    );
  }, [emptyState.description, emptyState.title, loading.isLoading, styles.emptyCard, styles.emptyContainer, styles.emptySubtitle, styles.emptyTitle, theme.colors.textMedium, theme.colors.textSecondary, videoIds.length]);

  return (
    <TabPageLayout scrollable={false}>
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.colors.textMedium }]}>{title}</Text>
      </View>
      <View style={styles.listContainer}>
        <SavedFeedList
          videoIds={videoIds}
          onVideoPress={onVideoPress}
          onEndReached={isInitialized ? handleEndReached : undefined}
          onRefresh={handleRefresh}
          isRefreshing={loading.isLoading && loading.loadingType === 'refresh'}
          isLoadingMore={loading.isLoading && loading.loadingType === 'loadMore'}
          ListEmptyComponent={controller.listEmptyComponent ?? EmptyComponent}
        />
      </View>
    </TabPageLayout>
  );
}

export function useSavedFeedRouteKind(): SavedFeedKind {
  const route = useRoute<SavedFeedRoute>();
  if (route.name === 'Favorites') {
    return 'favorites';
  }
  return 'history';
}
