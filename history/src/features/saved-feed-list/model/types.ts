import type { ComponentType, ReactElement } from 'react';
import type { VideoMetaData } from '@/shared/types';

export type SavedFeedListEmptyComponent = ComponentType<any> | ReactElement | null;

export interface SavedFeedListProps {
  videoIds: string[];
  onVideoPress?: (video: VideoMetaData) => void;
  onEndReached?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  disabled?: boolean;
  ListEmptyComponent?: SavedFeedListEmptyComponent;
}

export interface SavedFeedListRef {
  scrollToIndex: (params: { index: number; animated?: boolean; viewPosition?: number }) => void;
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
}
