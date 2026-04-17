import React from 'react';
import { SavedFeedPage, useSavedFeedRouteKind } from '@/pages/saved-feed';
import type { FavoritesScreenProps, HistoryScreenProps } from '@/shared/navigation/types';

type SavedFeedScreenProps = FavoritesScreenProps | HistoryScreenProps;

export function SavedFeedScreen(_props: SavedFeedScreenProps) {
  const kind = useSavedFeedRouteKind();
  return <SavedFeedPage kind={kind} />;
}
