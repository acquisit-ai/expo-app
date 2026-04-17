import { isDevelopment } from '@/shared/config/environment';
import { log, LogType } from '@/shared/lib/logger';
import { useVideoMetaStore } from '@/entities/video-meta';
import type { VideoMetaData } from '@/shared/types';

interface HistoryRecord {
  video: VideoMetaData;
  lastWatchedAt: number;
  progress: number;
}

const historyOrder: string[] = [];
const historyMap = new Map<string, HistoryRecord>();

function cloneVideoMeta(video: VideoMetaData): VideoMetaData {
  return { ...video };
}

function addOrUpdateHistory(video: VideoMetaData, progress: number) {
  const now = Date.now();
  const record: HistoryRecord = {
    video: cloneVideoMeta(video),
    lastWatchedAt: now,
    progress,
  };

  historyMap.set(video.id, record);

  const existingIndex = historyOrder.indexOf(video.id);
  if (existingIndex !== -1) {
    historyOrder.splice(existingIndex, 1);
  }
  historyOrder.unshift(video.id);

  log('history-mock-store', LogType.INFO,
    `Recorded history mock video: ${video.id} (progress=${(progress * 100).toFixed(1)}%, total=${historyOrder.length})`);
}

export function recordHistoryMock(videoId: string, progress: number): void {
  if (!isDevelopment()) {
    return;
  }

  const videoMetaStore = useVideoMetaStore.getState();
  const video = videoMetaStore.getVideo(videoId);

  if (!video) {
    log('history-mock-store', LogType.WARNING,
      `Cannot record history mock, video not found: ${videoId}`);
    return;
  }

  addOrUpdateHistory(video, progress);
}

export function getHistorySlice(startIndex: number, limit: number) {
  const boundedStart = Math.max(0, Math.min(startIndex, historyOrder.length));
  const sliceIds = historyOrder.slice(boundedStart, boundedStart + limit);
  const videos = sliceIds
    .map(id => historyMap.get(id))
    .filter((record): record is HistoryRecord => Boolean(record))
    .map(record => record.video);

  const nextIndex = boundedStart + sliceIds.length;
  const nextCursor = nextIndex < historyOrder.length ? String(nextIndex) : null;
  const hasMore = nextCursor !== null;

  return {
    videos,
    nextCursor,
    hasMore,
  };
}

export function clearHistoryMock() {
  historyOrder.splice(0, historyOrder.length);
  historyMap.clear();
}

export function getHistoryCount(): number {
  return historyOrder.length;
}
