/**
 * 字幕实体主 Hook
 *
 * 提供对字幕状态的统一访问接口
 * 这是其他层与 Entity 层交互的主要入口
 */

import { useMemo, useCallback, useRef } from 'react';
import { useSubtitleStore } from '../model/store';
import { SubtitleSearchEngine } from '../lib/search';
import type { Sentence } from '../model/subtitle';
import { useSingleTimer } from '@/shared/hooks';


/**
 * 字幕实体主 Hook
 */
export const useSubtitleEntity = () => {
  const store = useSubtitleStore();
  const { setTimer } = useSingleTimer();

  // === 基础数据访问 ===
  const subtitleData = useMemo(() => ({
    currentSubtitle: store.currentSubtitle,
    activeVideoId: store.activeVideoId,
    currentIndex: store.currentIndex
  }), [
    store.currentSubtitle,
    store.activeVideoId,
    store.currentIndex
  ]);

  // === 状态操作方法 ===
  const actions = useMemo(() => ({
    // 数据管理
    storeSubtitle: store.storeSubtitle,
    setActiveSubtitle: store.setActiveSubtitle,
    clearSubtitle: store.clearSubtitle
  }), [
    store.storeSubtitle,
    store.setActiveSubtitle,
    store.clearSubtitle
  ]);

  // === 搜索功能 ===
  const lastUpdateTimeRef = useRef<number>(0);
  const cachedIndexRef = useRef<number>(0);

  const getSentenceAtTime = useCallback((timeSeconds: number): Sentence | null => {
    if (!store.currentSubtitle) return null;

    // 使用最新的索引（store中的 或 缓存的）
    const currentIdx = Math.max(store.currentIndex, cachedIndexRef.current);

    // 使用指针优化的智能搜索，O(1) for 顺序播放，O(log n) for 跳转
    const result = SubtitleSearchEngine.findSentenceAtTime(
      store.currentSubtitle,
      timeSeconds,
      currentIdx
    );

    // 异步更新索引，避免在渲染期间setState
    if (result.newIndex !== store.currentIndex) {
      cachedIndexRef.current = result.newIndex; // 立即更新本地缓存

      const now = performance.now();
      // 防抖：避免频繁更新store
      if (now - lastUpdateTimeRef.current > 16) { // 约60fps
        lastUpdateTimeRef.current = now;
        setTimer(() => {
          store.updateCurrentIndex(result.newIndex);
        }, 0);
      }
    }

    return result.sentence;
  }, [store.currentSubtitle, store.currentIndex, store.updateCurrentIndex, setTimer]);

  const getSentencesInRange = useCallback((
    startSeconds: number,
    endSeconds: number
  ): Sentence[] => {
    if (!store.currentSubtitle) return [];

    return SubtitleSearchEngine.getSentencesInRange(
      store.currentSubtitle,
      startSeconds,
      endSeconds
    );
  }, [store.currentSubtitle]);

  // === 导航辅助方法 ===
  const getSentenceByIndex = useCallback((index: number): Sentence | null => {
    if (!store.currentSubtitle) return null;

    // 由于index现在保证连续（0,1,2,3...），直接使用数组索引 O(1)
    if (index >= 0 && index < store.currentSubtitle.sentences.length) {
      return store.currentSubtitle.sentences[index];
    }

    return null;
  }, [store.currentSubtitle]);

  const getNextSentence = useCallback((): Sentence | null => {
    if (!store.currentSubtitle) return null;

    // 直接使用维护的 currentIndex，O(1) 性能
    let nextIndex = store.currentIndex + 1;
    while (nextIndex < store.currentSubtitle.sentences.length) {
      const nextSentence = store.currentSubtitle.sentences[nextIndex];
      // 如果找到非空句子，返回它
      if (nextSentence.text.trim() !== '') {
        return nextSentence;
      }
      nextIndex++;
    }

    return null;
  }, [store.currentSubtitle, store.currentIndex]);

  const getPreviousSentence = useCallback((): Sentence | null => {
    if (!store.currentSubtitle) return null;

    // 直接使用维护的 currentIndex，O(1) 性能
    let prevIndex = store.currentIndex - 1;
    while (prevIndex >= 0) {
      const prevSentence = store.currentSubtitle.sentences[prevIndex];
      // 如果找到非空句子，返回它
      if (prevSentence.text.trim() !== '') {
        return prevSentence;
      }
      prevIndex--;
    }

    return null;
  }, [store.currentSubtitle, store.currentIndex]);

  // === 工具方法 ===
  const utils = useMemo(() => ({
    getTotalDuration: (): number => {
      if (!store.currentSubtitle) return 0;
      return SubtitleSearchEngine.getTotalDuration(store.currentSubtitle);
    },

    getTotalSentences: (): number => {
      return store.currentSubtitle?.total_sentences ?? 0;
    },

    isLoaded: (videoId?: string): boolean => {
      if (videoId) {
        return store.subtitles.has(videoId);
      }
      return store.currentSubtitle !== null;
    },

    getAllLoadedVideoIds: (): string[] => {
      return Array.from(store.subtitles.keys());
    }
  }), [store.currentSubtitle, store.subtitles]);

  return {
    // 数据
    ...subtitleData,

    // 操作
    ...actions,

    // 查询方法
    getSentenceAtTime,
    getSentencesInRange,

    // 导航辅助方法 (返回Sentence对象，不直接控制播放)
    getSentenceByIndex,
    getNextSentence,
    getPreviousSentence,

    // 工具
    ...utils
  };
};

/**
 * 字幕搜索专用 Hook
 */
export const useSubtitleSearch = () => {
  const { getSentencesInRange, currentSubtitle } = useSubtitleEntity();

  return {
    getSentencesInRange,
    isSearchable: !!currentSubtitle
  };
};

/**
 * 字幕时间查询专用 Hook
 *
 * 重构说明：专注于时间相关的查询功能，不再包含状态管理
 * 组件需要结合VideoEntity的时间状态来使用这些查询方法
 */
export const useSubtitleSync = () => {
  const {
    getSentenceAtTime,
    getSentenceByIndex,
    getNextSentence,
    getPreviousSentence
  } = useSubtitleEntity();

  return {
    getSentenceAtTime,
    getSentenceByIndex,
    getNextSentence,
    getPreviousSentence
  };
};