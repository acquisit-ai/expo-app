import { httpClient, ApiError } from '@/shared/lib/http-client';
import { isDevelopment } from '@/shared/config/environment';
import { log, LogType } from '@/shared/lib/logger';
import type { FavoritesFetchParams, FavoritesFetchResponse } from '../model/types';
import { fetchFavoritesMock } from './favorites-api.mock';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function normalizeParams(params: FavoritesFetchParams): FavoritesFetchParams {
  const limit = Math.max(1, Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT));
  const cursor = params.cursor ?? null;
  return { limit, cursor };
}

/**
 * 获取收藏列表
 *
 * - 开发环境：使用 mock 数据
 * - 生产环境：调用真实 HTTP API
 */
export async function fetchFavorites(params: FavoritesFetchParams): Promise<FavoritesFetchResponse> {
  const normalizedParams = normalizeParams(params);
  const { limit, cursor } = normalizedParams;

  log(
    'favorites-api',
    LogType.INFO,
    `Fetching favorites: limit=${limit}, cursor=${cursor ?? 'null'}`,
  );

  if (isDevelopment()) {
    return fetchFavoritesMock(normalizedParams);
  }

  try {
    const searchParams = new URLSearchParams({
      limit: String(limit),
    });

    if (cursor) {
      searchParams.set('cursor', cursor);
    }

    const response = await httpClient.get<FavoritesFetchResponse>(
      `/api/v1/favorites?${searchParams.toString()}`,
    );

    log(
      'favorites-api',
      LogType.INFO,
      `Fetched favorites: count=${response.videos.length}, nextCursor=${response.nextCursor}`,
    );

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      log('favorites-api', LogType.ERROR, `Failed to fetch favorites: ${error.message}`);
    }
    throw error;
  }
}
