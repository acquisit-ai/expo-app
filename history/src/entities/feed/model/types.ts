/**
 * Feed Entity 数据模型
 *
 * 视频Feed流的核心数据结构和状态管理类型定义
 * Entity 只负责状态管理，不调用 Feature
 *
 * ⚠️ 重构说明（方案A）：
 * - Feed 不再存储 VideoMetaData 对象
 * - 只存储 videoId 数组
 * - VideoMetaData 统一由 Video Meta Entity 管理（SSOT）
 */

/**
 * Feed 加载类型
 */
export type FeedLoadingType = 'initial' | 'refresh' | 'loadMore' | null;

/**
 * Feed 加载状态
 */
export interface FeedLoadingState {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 加载错误信息 */
  error: string | null;
  /** 加载类型：区分初始加载、刷新、加载更多 */
  loadingType: FeedLoadingType;
}

/**
 * Feed 播放状态
 */
export interface FeedPlaybackState {
  /** 当前播放的视频索引 */
  currentFeedIndex: number;
  /** 当前可见的视频索引列表 */
  visibleIndexes: number[];
}

/**
 * Feed Store 状态管理接口
 * 纯状态管理，不包含数据获取逻辑
 */
export interface FeedStore {
  // ===== 状态数据 =====
  /** 视频 ID 队列（最多500条）*/
  videoIds: string[];

  /** 🆕 视频 ID Set（用于 O(1) 去重检查）*/
  videoIdSet: Set<string>;

  /** 加载状态 */
  loading: FeedLoadingState;

  /** 播放状态 */
  playback: FeedPlaybackState;

  // ===== 播放控制方法 =====
  /** 设置当前播放索引 */
  setCurrentFeedIndex: (index: number) => void;

  /** 更新可见视频索引 */
  updateVisibleIndexes: (indexes: number[]) => void;

  // ===== 状态管理方法 =====
  /** 重置Feed状态 */
  resetFeed: () => void;

  /** 添加新的视频 ID 到队列尾部 */
  appendVideoIds: (ids: string[]) => void;

  /** 维护滑动窗口大小(50条限制) */
  maintainWindowSize: () => void;

  /** 设置加载状态 */
  setLoading: (isLoading: boolean, type?: 'refresh' | 'loadMore') => void;

  /** 设置错误状态 */
  setError: (error: string | null) => void;

  /** 清除错误状态 */
  clearError: () => void;

  // ===== 辅助方法 =====
  /** 获取当前播放的视频 ID */
  getCurrentVideoId: () => string | null;
}

/**
 * Feed 配置常量
 */
export const FEED_CONSTANTS = {
  /** 最大队列长度 */
  MAX_FEED_SIZE: 500,
  /** 默认加载数量 */
  DEFAULT_COUNT: 10,
} as const;

