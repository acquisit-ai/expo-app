import { isDevelopment } from '@/shared/config/environment';
import { log, LogType } from '@/shared/lib/logger';
import { useVideoMetaStore } from '@/entities/video-meta';
import type { VideoMetaData } from '@/shared/types';

interface FavoriteRecord {
  video: VideoMetaData;
  addedAt: number;
}

const favoritesOrder: string[] = [];
const favoritesMap = new Map<string, FavoriteRecord>();

function cloneVideoMeta(video: VideoMetaData): VideoMetaData {
  return {
    ...video,
    isFavorited: true,
  };
}

function addFavoriteInternal(video: VideoMetaData) {
  const now = Date.now();
  const record: FavoriteRecord = {
    video: cloneVideoMeta(video),
    addedAt: now,
  };

  favoritesMap.set(video.id, record);

  const existingIndex = favoritesOrder.indexOf(video.id);
  if (existingIndex !== -1) {
    favoritesOrder.splice(existingIndex, 1);
  }
  favoritesOrder.unshift(video.id);

  log('favorites-mock-store', LogType.INFO,
    `Added favorite mock video: ${video.id} (total=${favoritesOrder.length})`);
}

function removeFavoriteInternal(videoId: string) {
  if (!favoritesMap.has(videoId)) {
    return;
  }

  favoritesMap.delete(videoId);
  const index = favoritesOrder.indexOf(videoId);
  if (index !== -1) {
    favoritesOrder.splice(index, 1);
  }

  log('favorites-mock-store', LogType.INFO,
    `Removed favorite mock video: ${videoId} (total=${favoritesOrder.length})`);
}

export function syncFavoriteMockState(videoId: string, isFavorited: boolean): void {
  if (!isDevelopment()) {
    return;
  }

  const videoMetaStore = useVideoMetaStore.getState();
  const video = videoMetaStore.getVideo(videoId);

  if (!video) {
    log('favorites-mock-store', LogType.WARNING,
      `Cannot sync favorite mock state, video not found: ${videoId}`);
    return;
  }

  if (isFavorited) {
    addFavoriteInternal(video);
  } else {
    removeFavoriteInternal(videoId);
  }
}

export function getFavoritesSlice(startIndex: number, limit: number) {
  const boundedStart = Math.max(0, Math.min(startIndex, favoritesOrder.length));
  const sliceIds = favoritesOrder.slice(boundedStart, boundedStart + limit);
  const videos = sliceIds
    .map((id) => favoritesMap.get(id))
    .filter((record): record is FavoriteRecord => Boolean(record))
    .map((record) => record.video);

  const nextIndex = boundedStart + sliceIds.length;
  const nextCursor = nextIndex < favoritesOrder.length ? String(nextIndex) : null;
  const hasMore = nextCursor !== null;

  return {
    videos,
    nextCursor,
    hasMore,
  };
}

export function clearFavoritesMock() {
  favoritesOrder.splice(0, favoritesOrder.length);
  favoritesMap.clear();
}

export function getFavoritesCount(): number {
  return favoritesOrder.length;
}
