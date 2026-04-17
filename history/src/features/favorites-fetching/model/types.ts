import type { VideoMetaData } from '@/shared/types';

/**
 * 收藏列表请求参数
 */
export interface FavoritesFetchParams {
  /** 请求条数上限 */
  limit: number;
  /** 分页游标，null 或 undefined 表示第一页 */
  cursor?: string | null;
}

/**
 * 收藏列表响应
 */
export interface FavoritesFetchResponse {
  /** 收藏的视频列表 */
  videos: VideoMetaData[];
  /** 下一页游标，null 表示没有更多数据 */
  nextCursor: string | null;
  /** 是否还有更多数据 */
  hasMore: boolean;
}
