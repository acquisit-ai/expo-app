/**
 * Feed List Feature Types
 *
 * Feed 列表功能的类型定义
 */

import type { VideoMetaData } from '@/shared/types';

// 移除重复的 FeedVideo 类型，直接使用 Entity 的 VideoMetaData
export type { VideoMetaData } from '@/shared/types';

export interface FeedListProps {
  /** 视频点击回调 */
  onVideoPress?: (video: VideoMetaData) => void;
  /** 可见项目变化回调 */
  onViewableItemsChanged?: (indexes: number[]) => void;
  /** 滑动停止回调 - 用于优化播放切换 */
  onScrollEnd?: () => void;
  /** 到达底部回调 */
  onEndReached?: () => void;
  /** 下拉刷新回调 */
  onRefresh?: () => void;
  /** 是否禁用交互 */
  disabled?: boolean;
}