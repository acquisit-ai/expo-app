/**
 * Feed 加载状态 Hook
 */

import { useFeedStore, feedSelectors } from '../model/store';

export function useFeedLoading() {
  const { isLoading } = useFeedStore(feedSelectors.getLoadingState);
  const canLoadMore = useFeedStore(feedSelectors.canLoadMore);

  return {
    isLoading,
    canLoadMore,
  };
}