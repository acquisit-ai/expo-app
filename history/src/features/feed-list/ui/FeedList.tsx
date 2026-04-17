import React, { useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { View, FlatList, ListRenderItemInfo, ViewToken, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useFeedStore, feedSelectors } from '@/entities/feed';
import { useVideoMetaStore } from '@/entities/video-meta';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { FeedListLayout } from './FeedListLayout';
import { FeedVideoCard } from './FeedVideoCard';
import { FEED_CONSTANTS } from '../lib/constants';
import type { VideoMetaData } from '@/shared/types';
import type { FeedListProps } from '../model/types';

/**
 * FeedList 暴露的方法
 */
export interface FeedListRef {
  /** 滚动到指定索引 */
  scrollToIndex: (params: {
    index: number;
    animated?: boolean;
    viewPosition?: number;
  }) => void;
  /** 滚动到指定偏移量 */
  scrollToOffset: (params: {
    offset: number;
    animated?: boolean;
  }) => void;
}

/**
 * Feed 列表组件
 * 基于 FlatList 实现的高性能视频列表
 * 连接 feed entity，支持完整的交互功能
 */
export const FeedList = forwardRef<FeedListRef, FeedListProps>(
  function FeedList({
    onVideoPress,
    onViewableItemsChanged,
    onScrollEnd,
    onEndReached,
    onRefresh,
    disabled
  }, ref) {
    const flatListRef = useRef<FlatList<string>>(null);

    // 🆕 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      scrollToIndex: (params) => {
        flatListRef.current?.scrollToIndex(params);
      },
      scrollToOffset: (params) => {
        flatListRef.current?.scrollToOffset(params);
      },
    }), []);
  const { theme } = useTheme();

  // 连接 feed entity 数据
  const videoIds = useFeedStore(feedSelectors.getVideoIds);
  const { isLoading, loadingType } = useFeedStore(feedSelectors.getLoadingState);

  // 渲染单个视频卡片 - 使用 useCallback 优化
  const renderVideoItem = useCallback(({ item: videoId }: ListRenderItemInfo<string>) => {
    // 从 Video Meta Entity 获取视频数据
    const video = useVideoMetaStore.getState().getVideo(videoId);

    if (!video) {
      return null;
    }

    return (
      <FeedVideoCard
        video={video}
        disabled={disabled}
        onPress={() => onVideoPress?.(video)}
      />
    );
  }, [disabled, onVideoPress]);

  // Key 提取器 - 使用 useCallback 优化
  const keyExtractor = useCallback((videoId: string) => videoId, []);

  // 🆕 getItemLayout 优化 - 提升 scrollToIndex 性能和可靠性
  const getItemLayout = useCallback(
    (data: ArrayLike<string> | null | undefined, index: number) => ({
      length: FEED_CONSTANTS.cardHeight,  // 卡片高度（不含间距）
      offset: FEED_CONSTANTS.itemHeight * index,  // 偏移量 = (卡片 + 间距) * 索引
      index,
    }),
    []
  );

  // 分隔器组件 - 使用 useCallback 优化
  const ItemSeparator = useCallback(() => (
    <View style={{ height: FEED_CONSTANTS.itemGap }} />
  ), []);

  // 可见项目变化处理
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleIndexes = viewableItems
          .map(item => item.index)
          .filter((idx): idx is number => idx !== null);
        onViewableItemsChanged?.(visibleIndexes);
      }
    },
    [onViewableItemsChanged]
  );

  // 滑动停止处理 - 用于优化播放切换
  const handleMomentumScrollEnd = useCallback(() => {
    onScrollEnd?.();
  }, [onScrollEnd]);

  // 可见项目配置 - 优化：增加 minimumViewTime 减少频繁触发
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50, // 50% 可见才算可见
    minimumViewTime: 300, // 最小可见时间 300ms（从 100ms 增加，减少滑动时的频繁触发）
  }), []);

  // 主题感知的下拉刷新控件
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={isLoading}
      onRefresh={onRefresh}
      colors={[theme.colors.onSurfaceVariant]} // Android - 使用中性色
      tintColor={theme.colors.onSurfaceVariant} // iOS - 使用中性色
      titleColor={theme.colors.onSurface} // iOS 标题颜色
      progressBackgroundColor={theme.colors.surface} // Android 背景色
    />
  ), [isLoading, onRefresh, theme.colors.onSurfaceVariant, theme.colors.onSurface, theme.colors.surface]);

  // 底部加载指示器 - 仅在加载更多时显示
  const ListFooterComponent = useCallback(() => {
    // 只在加载更多时显示底部指示器（排除初始加载和下拉刷新）
    if (loadingType !== 'loadMore') {
      return null;
    }

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator
          size="small"
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    );
  }, [loadingType, theme.colors.onSurfaceVariant]);

  // FlatList 配置 - 使用 useMemo 优化
  const flatListProps = useMemo(() => ({
    ...FEED_CONSTANTS.flatListConfig,
    contentContainerStyle: FEED_CONSTANTS.contentStyle,

    // 🆕 性能优化：提供 getItemLayout 提升 scrollToIndex 可靠性
    getItemLayout: getItemLayout,

    // 添加交互功能
    refreshControl: refreshControl,
    onEndReached: onEndReached,
    onEndReachedThreshold: 0.5, // 距离底部 50% 屏幕时触发，减少敏感度

    // 底部加载指示器
    ListFooterComponent: ListFooterComponent,

    // 可见项目变化
    onViewableItemsChanged: handleViewableItemsChanged,
    viewabilityConfig: viewabilityConfig,

    // 滑动事件处理
    onMomentumScrollEnd: handleMomentumScrollEnd,

    // 滚动锚点：只在有数据时启用，避免初始加载时的滚动异常
    // 用于在滑动窗口删除头部数据时保持用户视野不变
    ...(videoIds.length > 0 && {
      maintainVisibleContentPosition: {
        minIndexForVisible: 0, // 保持第一个可见 item 的位置不变
      },
    }),
  }), [refreshControl, onEndReached, ListFooterComponent, handleViewableItemsChanged, viewabilityConfig, handleMomentumScrollEnd, videoIds.length, getItemLayout]);

  return (
    <FeedListLayout>
      <FlatList
        ref={flatListRef}
        data={videoIds}
        renderItem={renderVideoItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        {...flatListProps}
      />
    </FeedListLayout>
  );
});

const styles = StyleSheet.create({
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});