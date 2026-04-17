import type { StateCreator } from 'zustand';

export type WordSource = 'book' | 'custom';

export type WordPrimaryKey = string;

export interface WordItem {
  id: WordPrimaryKey;
  kind: 'word' | 'phrase';
  label: string;
  pos: string;
  chineseLabel: string;
  chineseDef: string;
  source: WordSource;
  progress: number; // 0-100
  addedAt: string; // ISO 日期
  tags?: string[];
}

export interface WordCollectionState {
  entities: Record<WordPrimaryKey, WordItem>;
  order: WordPrimaryKey[];
  sorted: WordPrimaryKey[];
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
}

export interface WordCollectionActions {
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  replaceItems: (items: WordItem[], syncedAt?: string) => void;
  upsertItem: (item: WordItem) => void;
  removeItem: (id: WordPrimaryKey) => void;
  clearSorted: () => void;
  reset: () => void;
}

export type WordCollectionStore = WordCollectionState & WordCollectionActions;

export type WordCollectionStateCreator = StateCreator<WordCollectionStore>;
