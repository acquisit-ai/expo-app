import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { log, LogType } from '@/shared/lib/logger';
import type {
  FavoritesStore,
  FavoritesLoadingState,
  FavoritesPaginationState,
  FavoritesLoadingKind,
} from './types';

const initialLoadingState: FavoritesLoadingState = {
  isLoading: false,
  type: null,
  error: null,
};

const initialPaginationState: FavoritesPaginationState = {
  cursor: null,
  hasMore: true,
};

export const useFavoritesStore = create<FavoritesStore>()(
  subscribeWithSelector((set, get) => ({
    favoriteIds: [],
    favoriteIdSet: new Set<string>(),
    loading: initialLoadingState,
    pagination: initialPaginationState,

    resetFavorites: () => {
      log('favorites-store', LogType.INFO, 'Reset favorites store');
      set({
        favoriteIds: [],
        favoriteIdSet: new Set<string>(),
        loading: initialLoadingState,
        pagination: initialPaginationState,
      });
    },

    appendFavoriteIds: (ids: string[]) => {
      if (ids.length === 0) {
        log('favorites-store', LogType.DEBUG, 'appendFavoriteIds called with empty array');
        return;
      }

      set((state) => {
        const uniqueIds = ids.filter(id => !state.favoriteIdSet.has(id));

        if (uniqueIds.length === 0) {
          log(
            'favorites-store',
            LogType.DEBUG,
            `Skipped append: all ${ids.length} ids already exist`,
          );
          return state;
        }

        const nextIds = [...state.favoriteIds, ...uniqueIds];
        const nextSet = new Set([...state.favoriteIdSet, ...uniqueIds]);

        log(
          'favorites-store',
          LogType.INFO,
          `Appended ${uniqueIds.length} favorites (duplicates filtered: ${ids.length - uniqueIds.length}), total=${nextIds.length}`,
        );

        return {
          favoriteIds: nextIds,
          favoriteIdSet: nextSet,
        };
      });
    },

    setFavoriteIds: (ids: string[]) => {
      log(
        'favorites-store',
        LogType.INFO,
        `Replacing favorites list, new length=${ids.length}`,
      );

      set({
        favoriteIds: [...ids],
        favoriteIdSet: new Set(ids),
      });
    },

    removeFavoriteId: (id: string) => {
      const state = get();

      if (!state.favoriteIdSet.has(id)) {
        log('favorites-store', LogType.DEBUG, `removeFavoriteId skipped, id not found: ${id}`);
        return;
      }

      set(() => {
        const updatedIds = state.favoriteIds.filter(favoriteId => favoriteId !== id);
        const updatedSet = new Set(updatedIds);

        log(
          'favorites-store',
          LogType.INFO,
          `Removed favorite id=${id}, total=${updatedIds.length}`,
        );

        return {
          favoriteIds: updatedIds,
          favoriteIdSet: updatedSet,
        };
      });
    },

    setLoading: (isLoading: boolean, type?: FavoritesLoadingKind) => {
      set((state) => ({
        loading: {
          ...state.loading,
          isLoading,
          type: isLoading ? (type ?? 'initial') : null,
        },
      }));
    },

    setError: (error: string | null) => {
      set((state) => ({
        loading: {
          ...state.loading,
          error,
          isLoading: false,
          type: null,
        },
      }));
    },

    clearError: () => {
      set((state) => ({
        loading: {
          ...state.loading,
          error: null,
        },
      }));
    },

    setPagination: (pagination: FavoritesPaginationState) => {
      set(() => ({
        pagination: {
          cursor: pagination.cursor,
          hasMore: pagination.hasMore,
        },
      }));
    },
  })),
);
