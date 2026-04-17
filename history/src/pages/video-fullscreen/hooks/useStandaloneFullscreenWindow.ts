import { useMemo, useRef, useCallback } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import type { FullscreenScrollWindowState } from './useFullscreenScrollWindow';
import { useVideoStore, selectCurrentPlayerMeta } from '@/entities/video';

export function useStandaloneFullscreenWindow(): FullscreenScrollWindowState {
  const currentPlayerMeta = useVideoStore(selectCurrentPlayerMeta);
  const scrollViewRef = useRef<ScrollView>(null);
  const { height: screenHeight } = useWindowDimensions();
  const itemHeight = screenHeight;

  const windowVideoIds = useMemo(() => {
    return currentPlayerMeta?.videoId ? [currentPlayerMeta.videoId] : [];
  }, [currentPlayerMeta?.videoId]);

  const allPlayerMetas = useMemo(() => {
    const map = new Map<string, { videoId: string; playerInstance: any }>();

    if (currentPlayerMeta?.videoId && currentPlayerMeta.playerInstance) {
      map.set(currentPlayerMeta.videoId, {
        videoId: currentPlayerMeta.videoId,
        playerInstance: currentPlayerMeta.playerInstance,
      });
    }

    return map;
  }, [currentPlayerMeta?.playerInstance, currentPlayerMeta?.videoId]);

  const noop = useCallback(() => {}, []);

  return {
    scrollViewRef,
    windowVideoIds,
    allPlayerMetas,
    currentIndex: windowVideoIds.length > 0 ? 0 : -1,
    handleScroll: noop,
    handleMomentumScrollEnd: noop,
    itemHeight,
    isInitialMount: false,
    resetExtendTriggers: noop,
  };
}
