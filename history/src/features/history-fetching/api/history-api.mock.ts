import { log, LogType } from '@/shared/lib/logger';
import type { HistoryFetchParams, HistoryFetchResponse } from '../model/types';
import { getHistorySlice } from './history-mock-store';

const MOCK_MIN_LATENCY_MS = 200;
const MOCK_MAX_LATENCY_MS = 400;
const MAX_LIMIT = 40;

export async function fetchHistoryMock(params: HistoryFetchParams): Promise<HistoryFetchResponse> {
  const limit = Math.max(1, Math.min(params.limit, MAX_LIMIT));
  const cursor = params.cursor ?? null;
  const startIndex = cursor ? Number(cursor) : 0;

  log('history-api', LogType.INFO,
    `[MOCK] Fetch history: limit=${limit}, cursor=${cursor ?? 'null'}, startIndex=${startIndex}`);

  const delay = MOCK_MIN_LATENCY_MS + Math.random() * (MOCK_MAX_LATENCY_MS - MOCK_MIN_LATENCY_MS);
  await new Promise(resolve => setTimeout(resolve, delay));

  if (Number.isNaN(startIndex) || startIndex < 0) {
    log('history-api', LogType.WARNING, `[MOCK] Invalid cursor detected: ${cursor}`);
    return {
      videos: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  const { videos, nextCursor, hasMore } = getHistorySlice(startIndex, limit);

  log('history-api', LogType.INFO,
    `[MOCK] History fetched: returned=${videos.length}, nextCursor=${nextCursor}, hasMore=${hasMore}`);

  return {
    videos,
    nextCursor,
    hasMore,
  };
}
