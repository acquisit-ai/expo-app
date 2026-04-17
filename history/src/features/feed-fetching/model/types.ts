/**
 * Feed Fetching Feature Types
 *
 * 定义 Feed 数据获取相关的类型和接口
 */

import type { VideoMetaData } from '@/shared/types';

/**
 * API 请求参数 (简化无状态设计)
 */
export interface FeedFetchParams {
  /** 请求数量 */
  count: number;
}

/**
 * API 响应数据结构 (无状态设计)
 */
export interface FeedApiResponse {
  /** 视频数据列表 */
  videos: VideoMetaData[];
}

// 旧的配置和错误类型已移除
// 现在使用统一的 HTTP 客户端（@/shared/lib/http-client）和 ApiError


/**
 * 简化配置常量
 */
export const FEED_FETCH_CONSTANTS = {
  /** 默认请求数量 */
  DEFAULT_COUNT: 10,
  /** 请求超时时间 */
  TIMEOUT: 10000,
} as const;