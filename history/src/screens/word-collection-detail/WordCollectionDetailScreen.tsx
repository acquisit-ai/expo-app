import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/shared/navigation/types';
import { WordCollectionDetailPage } from '@/pages/word-collection-detail';

export type WordCollectionDetailScreenProps = StackScreenProps<RootStackParamList, 'WordCollectionDetail'>;

export function WordCollectionDetailScreen({ route }: WordCollectionDetailScreenProps) {
  return <WordCollectionDetailPage />;
}
