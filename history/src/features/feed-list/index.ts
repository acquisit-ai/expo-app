/**
 * Feed List Feature 公共 API
 *
 * 导出 feed-list feature 的所有公共接口
 * 遵循 FSD 架构原则，外部模块只能通过此文件访问
 */

// ===== UI 组件 =====
export { FeedList } from './ui/FeedList';
// FeedListLayout 和 FeedVideoCard 仅 FeedList 内部使用，不对外暴露

// ===== 类型定义 =====
export type { VideoMetaData, FeedListProps } from './model/types';
export type { FeedListRef } from './ui/FeedList';

// ===== 常量 =====
export { FEED_CONSTANTS } from './lib/constants';