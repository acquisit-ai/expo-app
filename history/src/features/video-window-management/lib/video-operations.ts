/**
 * 视频操作业务逻辑
 *
 * 职责：协调 player-pool Entity 与其他 Entities
 * - 从 video-meta, feed, video entities 读取数据
 * - 将数据作为参数传递给 player-pool manager
 */

import type { VideoPlayer } from 'expo-video';
import { playerPoolManager } from '@/entities/player-pool';
import { useFeedStore } from '@/entities/feed';
import { useVideoMetaStore } from '@/entities/video-meta';
import { useVideoStore } from '@/entities/video';
import type { PoolInfo } from '@/entities/player-pool/model/types';

/**
 * 🔑 获取视频URL的回调函数（复用）
 */
function createGetVideoUrl() {
  return (videoId: string) =>
    useVideoMetaStore.getState().getVideo(videoId)?.video_url || null;
}

/**
 * 获取播放器（包装 acquire）
 */
export async function acquirePlayerForVideo(videoId: string): Promise<VideoPlayer> {
  const videoUrl = useVideoMetaStore.getState().getVideo(videoId)?.video_url;
  if (!videoUrl) {
    throw new Error(`Video URL not found for: ${videoId}`);
  }
  return playerPoolManager.acquire(videoId, videoUrl);
}

/**
 * 预加载视频（底层实现）
 * 直接调用 player pool manager 执行预加载
 */
export async function performPreloadVideos(videoIds: string[]): Promise<void> {
  const videos = videoIds
    .map(id => ({
      videoId: id,
      videoUrl: useVideoMetaStore.getState().getVideo(id)?.video_url || '',
    }))
    .filter(v => v.videoUrl);

  return playerPoolManager.preloadVideos(videos);
}

/**
 * 进入全屏模式
 */
export function enterFullscreenMode(clickedVideoId: string): void {
  const feedVideoIds = useFeedStore.getState().videoIds;
  const getVideoUrl = createGetVideoUrl();

  playerPoolManager.enterFullscreenMode(
    clickedVideoId,
    feedVideoIds,
    getVideoUrl
  );
}

/**
 * 退出全屏模式
 */
export function exitFullscreenMode(): void {
  playerPoolManager.exitFullscreenMode();
}

/**
 * 窗口扩展（向后）
 */
export async function extendWindowNext(): Promise<void> {
  const feedVideoIds = useFeedStore.getState().videoIds;
  const getVideoUrl = createGetVideoUrl();
  const currentVideoId = useVideoStore.getState().currentPlayerMeta?.videoId || null;

  await playerPoolManager.extendWindowNext(
    feedVideoIds,
    getVideoUrl,
    currentVideoId
  );
}

/**
 * 窗口扩展（向前）
 */
export async function extendWindowPrev(): Promise<void> {
  const feedVideoIds = useFeedStore.getState().videoIds;
  const getVideoUrl = createGetVideoUrl();
  const currentVideoId = useVideoStore.getState().currentPlayerMeta?.videoId || null;

  await playerPoolManager.extendWindowPrev(
    feedVideoIds,
    getVideoUrl,
    currentVideoId
  );
}

/**
 * 加载待加载的视频
 */
export function loadPendingVideos(): void {
  const getVideoUrl = createGetVideoUrl();
  playerPoolManager.loadPendingVideos(getVideoUrl);
}

/**
 * 获取池信息
 */
export function getPoolInfo(): PoolInfo {
  const currentVideoId = useVideoStore.getState().currentPlayerMeta?.videoId || null;
  return playerPoolManager.getPoolInfo(currentVideoId);
}
