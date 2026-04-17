/**
 * Feed 操作组合 Hook
 *
 * 提供Entity层的状态操作集合
 * 注意：Entity 不提供数据获取方法，只提供状态管理
 */

import { useFeedStore } from '../model/store';

export function useFeedActions() {
  const store = useFeedStore();

  return {
    // 播放控制
    setCurrentFeedIndex: store.setCurrentFeedIndex,
    updateVisibleIndexes: store.updateVisibleIndexes,

    // 状态管理
    resetFeed: store.resetFeed,
    appendVideoIds: store.appendVideoIds,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,

    // 辅助方法
    getCurrentVideoId: store.getCurrentVideoId,
  };
}