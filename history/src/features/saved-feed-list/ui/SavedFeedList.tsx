import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  View,
} from 'react-native';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { FeedVideoCard } from '@/features/feed-list/ui/FeedVideoCard';
import { FeedListLayout } from '@/features/feed-list/ui/FeedListLayout';
import { useVideoMetaStore } from '@/entities/video-meta';
import { SAVED_FEED_LIST_CONSTANTS } from '../lib/constants';
import type { SavedFeedListProps, SavedFeedListRef } from '../model/types';
import type { VideoMetaData } from '@/shared/types';

export const SavedFeedList = forwardRef<SavedFeedListRef, SavedFeedListProps>(
  function SavedFeedList(
    {
      videoIds,
      onVideoPress,
      onEndReached,
      onRefresh,
      isRefreshing = false,
      isLoadingMore = false,
      disabled = false,
      ListEmptyComponent,
    },
    ref,
  ) {
    const flatListRef = useRef<FlatList<string>>(null);
    const { theme } = useTheme();

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: params => flatListRef.current?.scrollToIndex(params),
        scrollToOffset: params => flatListRef.current?.scrollToOffset(params),
      }),
      [],
    );

    const renderItem = useCallback(
      ({ item: videoId }: ListRenderItemInfo<string>) => {
        const video = useVideoMetaStore.getState().getVideo(videoId);
        if (!video) {
          return null;
        }

        const handlePress = () => {
          if (!disabled && onVideoPress) {
            onVideoPress(video);
          }
        };

        return (
          <FeedVideoCard
            video={video}
            disabled={disabled || !onVideoPress}
            onPress={onVideoPress ? handlePress : undefined}
          />
        );
      },
      [disabled, onVideoPress],
    );

    const keyExtractor = useCallback((videoId: string) => videoId, []);

    const getItemLayout = useCallback(
      (_data: ArrayLike<string> | null | undefined, index: number) => ({
        length: SAVED_FEED_LIST_CONSTANTS.cardHeight,
        offset: SAVED_FEED_LIST_CONSTANTS.itemHeight * index,
        index,
      }),
      [],
    );

    const ItemSeparator = useCallback(
      () => <View style={{ height: SAVED_FEED_LIST_CONSTANTS.itemGap }} />,
      [],
    );

    const refreshControl = useMemo(() => {
      if (!onRefresh) {
        return undefined;
      }

      return (
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.onSurfaceVariant]}
          tintColor={theme.colors.onSurfaceVariant}
          titleColor={theme.colors.onSurface}
          progressBackgroundColor={theme.colors.surface}
        />
      );
    }, [isRefreshing, onRefresh, theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.surface]);

    const ListFooterComponent = useMemo(() => {
      if (!isLoadingMore) {
        return null;
      }

      return (
        <View
          style={{
            paddingVertical: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator
            size="small"
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      );
    }, [isLoadingMore, theme.colors.onSurfaceVariant]);

    const contentContainerStyle = useMemo(() => ({
      ...SAVED_FEED_LIST_CONSTANTS.contentStyle,
      paddingTop: 0,
    }), []);

    return (
      <FeedListLayout useTopSafeInset={false}>
        <FlatList
          ref={flatListRef}
          data={videoIds}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={contentContainerStyle}
          getItemLayout={getItemLayout}
          refreshControl={refreshControl}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={ListEmptyComponent}
          {...SAVED_FEED_LIST_CONSTANTS.flatListConfig}
        />
      </FeedListLayout>
    );
  },
);
