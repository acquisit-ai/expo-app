import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { log, LogType } from '@/shared/lib/logger';
import { useWordCollectionEntity } from '@/entities/word-collection';
import type { WordItem } from '@/entities/word-collection';

const WORD_COLLECTION_QUERY_KEY = 'word-collection';

const WORD_SEED_BANK = [
  'abandon', 'ability', 'able', 'about', 'above', 'absolute', 'abstract', 'academy', 'access', 'accident',
  'accompany', 'achieve', 'acoustic', 'acquire', 'action', 'active', 'actor', 'actual', 'adapt', 'addict',
  'adjust', 'admit', 'adult', 'advance', 'advice', 'aerial', 'affair', 'affect', 'afford', 'agency',
  'agenda', 'agile', 'agree', 'ahead', 'aim', 'aircraft', 'alarm', 'album', 'alert', 'alike',
  'alive', 'allow', 'almost', 'along', 'alphabet', 'alter', 'amazing', 'ambition', 'amount', 'analysis',
  'ancient', 'anger', 'angle', 'animal', 'announce', 'annual', 'answer', 'anxiety', 'anywhere', 'apology',
  'appeal', 'appear', 'apple', 'appoint', 'approach', 'approve', 'arch', 'area', 'argue', 'arise',
  'army', 'arrange', 'arrest', 'arrive', 'article', 'artist', 'aspect', 'assist', 'assume', 'asthma',
  'athlete', 'atlas', 'attach', 'attempt', 'attend', 'attitude', 'attract', 'auction', 'audit', 'author',
  'autumn', 'avenue', 'average', 'award', 'aware', 'awesome', 'awkward', 'balance', 'ban', 'band'
];

const MOCK_SIZE = 1000;

const randomWord = (index: number) => {
  const base = WORD_SEED_BANK[index % WORD_SEED_BANK.length];
  return `${base}${Math.floor(Math.random() * 1000)}`;
};

const randomSource = (): WordItem['source'] => (Math.random() < 0.3 ? 'custom' : 'book');

const POS_LABELS = ['noun', 'verb', 'adjective', 'adverb', 'phrase'] as const;
const CHINESE_LABELS = ['真的/实际上', '关心／在意', '美丽的', '快速地', '在......之中'];
const CHINESE_DEFS = [
  '表示事实、确认或惊讶，常用于句首或动词前。',
  '对人或事物抱有关心、同情或在意的情感。',
  '形容事物外观或性质令人愉悦。',
  '以迅速的方式执行动作，强调速度。',
  '描述处在某个范围、群体或环境之内。',
];

const createMockItems = (): WordItem[] => Array.from({ length: MOCK_SIZE }, (_, idx) => {
  const source = randomSource();
  const label = randomWord(idx + 1);
  const posBase = POS_LABELS[idx % POS_LABELS.length];
  const kind = posBase === 'phrase' ? 'phrase' : 'word';
  const pos = posBase;
  const id = String(idx + 1000);

  return {
    id,
    kind,
    label,
    pos,
    chineseLabel: CHINESE_LABELS[idx % CHINESE_LABELS.length],
    chineseDef: CHINESE_DEFS[idx % CHINESE_DEFS.length],
    source,
    progress: Math.floor(Math.random() * 101),
    addedAt: new Date(Date.now() - idx * 3600_000).toISOString(),
  };
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWordCollectionMock(collectionId: string) {
  log('word-collection', LogType.DEBUG, `Fetching word collection (${collectionId}) via mock API`);
  await delay(350 + Math.random() * 300);
  return createMockItems();
}

export type WordCollectionSort =
  | 'alphabet-asc'
  | 'alphabet-desc'
  | 'time-asc'
  | 'time-desc'
  | 'progress-asc'
  | 'progress-desc';

export interface WordCollectionSortOption {
  value: WordCollectionSort;
  label: string;
}

export const WORD_COLLECTION_SORT_OPTIONS: readonly WordCollectionSortOption[] = [
  { value: 'time-desc', label: '按添加时间（最新优先）' },
  { value: 'time-asc', label: '按添加时间（最早优先）' },
  { value: 'alphabet-asc', label: '字母表 A-Z' },
  { value: 'alphabet-desc', label: '字母表 Z-A' },
  { value: 'progress-asc', label: '按进度（从低到高）' },
  { value: 'progress-desc', label: '按进度（从高到低）' },
] as const;

const compareAlphabetAsc = (a: WordItem, b: WordItem) => {
  const textCompare = a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
  if (textCompare !== 0) {
    return textCompare;
  }
  return a.id.localeCompare(b.id, undefined, { sensitivity: 'base' });
};

const compareAlphabetDesc = (a: WordItem, b: WordItem) => compareAlphabetAsc(b, a);

const sourceWeight = (item: WordItem) => (item.source === 'custom' ? 0 : 1);

const getTimestamp = (value: WordItem, fallback: number) => {
  if (!value.addedAt) {
    return fallback;
  }
  const parsed = new Date(value.addedAt).getTime();
  return Number.isFinite(parsed) ? parsed : fallback;
};

const compareTimeAsc = (a: WordItem, b: WordItem) => {
  const sourceDiff = sourceWeight(a) - sourceWeight(b);
  if (sourceDiff !== 0) {
    return sourceDiff;
  }

  if (a.source === 'custom' && b.source === 'custom') {
    const timeDiff = getTimestamp(a, Number.MIN_SAFE_INTEGER) - getTimestamp(b, Number.MIN_SAFE_INTEGER);
    if (timeDiff !== 0) {
      return timeDiff;
    }
  }

  return compareAlphabetAsc(a, b);
};

const compareTimeDesc = (a: WordItem, b: WordItem) => {
  const sourceDiff = sourceWeight(a) - sourceWeight(b);
  if (sourceDiff !== 0) {
    return sourceDiff;
  }

  if (a.source === 'custom' && b.source === 'custom') {
    const timeDiff = getTimestamp(b, Number.MAX_SAFE_INTEGER) - getTimestamp(a, Number.MAX_SAFE_INTEGER);
    if (timeDiff !== 0) {
      return timeDiff;
    }
  }

  return compareAlphabetDesc(a, b);
};

const compareProgressAsc = (a: WordItem, b: WordItem) => {
  const progressDiff = a.progress - b.progress;
  if (progressDiff !== 0) {
    return progressDiff;
  }
  return compareAlphabetAsc(a, b);
};

const compareProgressDesc = (a: WordItem, b: WordItem) => {
  const progressDiff = b.progress - a.progress;
  if (progressDiff !== 0) {
    return progressDiff;
  }
  return compareAlphabetDesc(a, b);
};

export const WORD_COLLECTION_SORT_COMPARATORS: Record<WordCollectionSort, (a: WordItem, b: WordItem) => number> = {
  'alphabet-asc': compareAlphabetAsc,
  'alphabet-desc': compareAlphabetDesc,
  'time-asc': compareTimeAsc,
  'time-desc': compareTimeDesc,
  'progress-asc': compareProgressAsc,
  'progress-desc': compareProgressDesc,
};

export interface UseWordCollectionListParams {
  collectionId: string;
}

export interface UseWordCollectionListReturn {
  items: ReturnType<typeof useWordCollectionEntity>['items'];
  sortedItems: WordItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  onRefresh: () => void;
  sort: WordCollectionSort;
  setSort: (value: WordCollectionSort) => void;
}

export function useWordCollectionList({ collectionId }: UseWordCollectionListParams): UseWordCollectionListReturn {
  const {
    items,
    isLoading,
    error,
    lastSyncedAt,
    actions,
  } = useWordCollectionEntity();

  const query = useQuery<WordItem[], Error>({
    queryKey: [WORD_COLLECTION_QUERY_KEY, collectionId],
    queryFn: () => fetchWordCollectionMock(collectionId),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    actions.setLoading(query.isFetching);
  }, [query.isFetching, actions]);

  useEffect(() => {
    if (query.data) {
      actions.replaceItems(query.data);
      actions.setError(null);
    }
  }, [query.data, actions]);

  useEffect(() => {
    if (query.error) {
      actions.setError(query.error.message);
      actions.setLoading(false);
    }
  }, [query.error, actions]);

  const onRefresh = useCallback(() => {
    log('word-collection', LogType.INFO, `Manual refresh triggered for ${collectionId}`);
    actions.setLoading(true);
    actions.setError(null);
    query.refetch();
  }, [actions, query, collectionId]);

  const [sort, setSortInternal] = useState<WordCollectionSort>('time-desc');

  const setSort = useCallback((value: WordCollectionSort) => {
    setSortInternal(prev => {
      if (prev === value) {
        return prev;
      }
      log('word-collection', LogType.INFO, `Word collection sort changed from ${prev} to ${value} (${collectionId})`);
      return value;
    });
  }, [collectionId]);

  const sortedItems = useMemo(() => {
    const comparator = WORD_COLLECTION_SORT_COMPARATORS[sort];
    return [...items].sort(comparator);
  }, [items, sort]);

  return useMemo(() => ({
    items,
    sortedItems,
    isLoading,
    isRefreshing: query.isRefetching,
    error,
    lastSyncedAt,
    onRefresh,
    sort,
    setSort,
  }), [items, sortedItems, isLoading, query.isRefetching, error, lastSyncedAt, onRefresh, sort, setSort]);
}
