/**
 * Feed Entity 公共 API
 *
 * 导出 feed entity 的所有公共接口
 * 遵循 FSD 架构原则，外部模块只能通过此文件访问
 */

// ===== 基础状态管理 =====
export {
  useFeedStore,
  feedSelectors,
} from './model/store';

export {
  selectCurrentVideoId,
  selectVideoIds,
  selectLoadingState,
  selectPlaybackState,
  selectCanLoadMore,
  selectCurrentFeedIndex,
} from './model/selectors';

// ===== 实用 Hooks =====
export {
  useFeedActions,
  useFeedLoading,
  useCurrentVideoInfo,
} from './hooks';

// ===== 类型定义 =====
// 注意：VideoMetaData 直接从 @/shared/types 导入，不需要重导出
export type {
  FeedLoadingState,
  FeedPlaybackState,
  FeedStore,
} from './model/types';

// ===== 常量 =====
export { FEED_CONSTANTS } from './model/types';