import { httpClient, ApiError } from '@/shared/lib/http-client';
import { isDevelopment } from '@/shared/config/environment';
import { log, LogType } from '@/shared/lib/logger';
import type { HistoryFetchParams, HistoryFetchResponse } from '../model/types';
import { fetchHistoryMock } from './history-api.mock';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

function normalizeParams(params: HistoryFetchParams): HistoryFetchParams {
  const limit = Math.max(1, Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT));
  const cursor = params.cursor ?? null;
  return { limit, cursor };
}

export async function fetchHistory(params: HistoryFetchParams): Promise<HistoryFetchResponse> {
  const normalizedParams = normalizeParams(params);
  const { limit, cursor } = normalizedParams;

  log('history-api', LogType.INFO, `Fetching history: limit=${limit}, cursor=${cursor ?? 'null'}`);

  if (isDevelopment()) {
    return fetchHistoryMock(normalizedParams);
  }

  try {
    const searchParams = new URLSearchParams({ limit: String(limit) });
    if (cursor) {
      searchParams.set('cursor', cursor);
    }

    const response = await httpClient.get<HistoryFetchResponse>(
      `/api/v1/history?${searchParams.toString()}`,
    );

    log('history-api', LogType.INFO, `Fetched history: count=${response.videos.length}, nextCursor=${response.nextCursor}`);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      log('history-api', LogType.ERROR, `Failed to fetch history: ${error.message}`);
    }
    throw error;
  }
}
