/**
 * Feed Fetching Feature 公共 API (简化)
 *
 * 导出 feed-fetching feature 的所有公共接口
 * 遵循 FSD 架构原则，外部模块只能通过此文件访问
 */

// ===== API 层 =====
export { fetchFeed } from './api/feed-api';

// ===== 服务层 =====
export {
  initializeFeed,
  loadMoreFeed,
  refreshFeed,
} from './lib/feedService';

// ===== 类型定义 =====
export type {
  FeedFetchParams,
  FeedApiResponse,
} from './model/types';

// ===== 常量 =====
// FEED_FETCH_CONSTANTS 仅内部使用，不对外暴露

// ===== 错误处理 =====
// 使用统一的 ApiError (@/shared/lib/http-client)