/**
 * Feed 服务层 (简化版)
 *
 * 连接 API 层和 Entity 层，实现业务逻辑
 * 正确关系：Feature 获取数据 → Video Meta Entity + Feed Entity 存储
 */

import { fetchFeed } from '../api/feed-api';
import { useFeedStore } from '@/entities/feed';
import { useVideoMetaStore } from '@/entities/video-meta';
import { log, LogType } from '@/shared/lib/logger';

/**
 * 初始化 Feed
 * Feature 获取数据，存储到 Video Meta Entity 和 Feed Entity
 */
export async function initializeFeed(): Promise<void> {
  const feedStore = useFeedStore.getState();

  // 防止重复初始化
  if (feedStore.loading.isLoading || feedStore.videoIds.length > 0) {
    log('feed-service', LogType.DEBUG, 'Feed already initialized or loading');
    return;
  }

  log('feed-service', LogType.INFO, 'Initializing feed...');

  // 设置加载状态
  feedStore.setLoading(true);
  feedStore.clearError();

  try {
    // Feature 获取数据（初始化获取15个视频）
    const response = await fetchFeed(15);

    if (!response.videos?.length) {
      throw new Error('No videos received from API');
    }

    // 1. 添加到 Video Meta Entity（SSOT）- Map 自动处理重复
    const videoMetaStore = useVideoMetaStore.getState();
    videoMetaStore.addVideos(response.videos);

    // 2. 添加 ID 到 Feed Entity - Feed 内部自动去重
    feedStore.appendVideoIds(response.videos.map(v => v.id));

    log('feed-service', LogType.INFO,
      `Feed initialized successfully: ${response.videos.length} videos loaded`
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('feed-service', LogType.ERROR, `Failed to initialize feed: ${errorMessage}`);

    // Feature 设置错误到 Entity
    feedStore.setError(errorMessage);
    throw error;
  }
}

/**
 * 加载更多 Feed 数据
 * Feature 获取数据，存储到 Video Meta Entity 和 Feed Entity
 */
export async function loadMoreFeed(): Promise<void> {
  const feedStore = useFeedStore.getState();

  if (feedStore.loading.isLoading) {
    log('feed-service', LogType.DEBUG, 'Already loading');
    return;
  }

  log('feed-service', LogType.INFO, 'Loading more feed data...');

  // 设置加载状态
  feedStore.setLoading(true, 'loadMore');
  feedStore.clearError();

  try {
    // Feature 获取数据（加载更多获取10个视频）
    const response = await fetchFeed(10);

    if (!response.videos?.length) {
      log('feed-service', LogType.INFO, 'No more videos available');
      // 即使没有数据，也会清除加载状态
      feedStore.appendVideoIds([]);
      return;
    }

    // 1. 添加到 Video Meta Entity（SSOT）- Map 自动处理重复
    const videoMetaStore = useVideoMetaStore.getState();
    videoMetaStore.addVideos(response.videos);

    // 2. 添加 ID 到 Feed Entity（包含滑动窗口管理）- Feed 内部自动去重
    feedStore.appendVideoIds(response.videos.map(v => v.id));

    log('feed-service', LogType.INFO,
      `More feed data loaded: ${response.videos.length} videos received, total: ${useFeedStore.getState().videoIds.length}`
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('feed-service', LogType.ERROR, `Failed to load more feed: ${errorMessage}`);

    // Feature 设置错误到 Entity
    feedStore.setError(errorMessage);
    throw error;
  }
}

/**
 * 刷新 Feed 数据
 * 保留当前数据直到新数据加载完成，提供更好的用户体验
 */
export async function refreshFeed(): Promise<void> {
  const feedStore = useFeedStore.getState();

  if (feedStore.loading.isLoading) {
    log('feed-service', LogType.DEBUG, 'Already loading, ignoring refresh');
    return;
  }

  log('feed-service', LogType.INFO, 'Refreshing feed data...');

  // 设置加载状态，但保留当前数据
  feedStore.setLoading(true, 'refresh');
  feedStore.clearError();

  try {
    // Feature 获取新数据（刷新获取15个视频）
    const response = await fetchFeed(15);

    if (!response.videos?.length) {
      throw new Error('No videos received from API');
    }

    // 1. 添加到 Video Meta Entity（SSOT）- Map 自动处理重复
    const videoMetaStore = useVideoMetaStore.getState();
    videoMetaStore.addVideos(response.videos);

    // 2. 重置并添加所有视频 ID 到 Feed Entity - Feed 内部自动去重
    feedStore.resetFeed();
    feedStore.appendVideoIds(response.videos.map(v => v.id));

    log('feed-service', LogType.INFO,
      `Feed refreshed successfully: ${response.videos.length} videos loaded`
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('feed-service', LogType.ERROR, `Failed to refresh feed: ${errorMessage}`);

    // 刷新失败时保留原数据，只设置错误状态
    feedStore.setError(errorMessage);
    throw error;
  }
}