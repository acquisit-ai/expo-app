import type { VideoMetaData } from '@/shared/types';

export interface HistoryFetchParams {
  limit: number;
  cursor?: string | null;
}

export interface HistoryFetchResponse {
  videos: VideoMetaData[];
  nextCursor: string | null;
  hasMore: boolean;
}
