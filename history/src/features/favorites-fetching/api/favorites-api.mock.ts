import { log, LogType } from '@/shared/lib/logger';
import type { FavoritesFetchParams, FavoritesFetchResponse } from '../model/types';
import { getFavoritesSlice } from './favorites-mock-store';

const MOCK_FAILURE_RATE = 0;
const MOCK_MIN_LATENCY_MS = 200;
const MOCK_MAX_LATENCY_MS = 400;
const MAX_LIMIT = 30;

export async function fetchFavoritesMock(
  params: FavoritesFetchParams,
): Promise<FavoritesFetchResponse> {
  const limit = Math.max(1, Math.min(params.limit, MAX_LIMIT));
  const cursor = params.cursor ?? null;
  const startIndex = cursor ? Number(cursor) : 0;

  log(
    'favorites-api',
    LogType.INFO,
    `[MOCK] Fetch favorites: limit=${limit}, cursor=${cursor ?? 'null'}, startIndex=${startIndex}`,
  );

  const delay = MOCK_MIN_LATENCY_MS + Math.random() * (MOCK_MAX_LATENCY_MS - MOCK_MIN_LATENCY_MS);
  await new Promise(resolve => setTimeout(resolve, delay));

  if (Number.isNaN(startIndex) || startIndex < 0) {
    log('favorites-api', LogType.WARNING, `[MOCK] Invalid cursor detected: ${cursor}`);
    return {
      videos: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  const { videos, nextCursor, hasMore } = getFavoritesSlice(startIndex, limit);

  log(
    'favorites-api',
    LogType.INFO,
    `[MOCK] Favorites fetched: returned=${videos.length}, nextCursor=${nextCursor}, hasMore=${hasMore}`,
  );

  return {
    videos,
    nextCursor,
    hasMore,
  };
}
