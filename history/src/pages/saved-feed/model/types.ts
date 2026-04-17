import type { VideoMetaData } from '@/shared/types';
import type { SavedFeedListEmptyComponent } from '@/features/saved-feed-list';

export type SavedFeedKind = 'favorites' | 'history';

export interface SavedFeedLoadingState {
  isLoading: boolean;
  loadingType: 'initial' | 'loadMore' | 'refresh' | null;
  hasMore: boolean;
}

export interface SavedFeedController {
  title: string;
  emptyState: {
    title: string;
    description: string;
  };
  videoIds: string[];
  loading: SavedFeedLoadingState;
  initialize: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  onItemPress?: (video: VideoMetaData) => void;
  listEmptyComponent?: SavedFeedListEmptyComponent;
}

export interface SavedFeedConfig {
  title: string;
  emptyState: {
    title: string;
    description: string;
  };
  dataSource: {
    useIds: () => string[];
    useLoading: () => SavedFeedLoadingState;
    initialize: () => Promise<void>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
  };
  interactions?: {
    onItemPress?: (video: VideoMetaData) => void;
  };
  listEmptyComponent?: SavedFeedListEmptyComponent;
}
