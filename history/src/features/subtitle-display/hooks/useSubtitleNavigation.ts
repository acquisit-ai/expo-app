/**
 * 字幕导航 Hook - 完整版
 *
 * 从 useSubtitleDisplay 提取的完整导航逻辑，支持条件订阅
 *
 * 🎯 核心功能：
 * - 导航状态追踪（连续点击导航）
 * - 时间距离检查（>=1.5秒先跳回当前句子开头）
 * - 防抖清除机制（2秒后回到时间计算模式）
 * - 有效句子查找（跳过空句子）
 * - 条件订阅（非活跃视频零开销）
 */

import { useCallback, useRef } from 'react';
import type { VideoPlayer } from 'expo-video';
import { useSubtitleStore, SubtitleSearchEngine } from '@/entities/subtitle';
import type { Sentence } from '@/entities/subtitle';
import { seekVideo } from '@/shared/lib/player-controls';
import { log, LogType } from '@/shared/lib/logger';
import { useSingleTimer } from '@/shared/hooks';
import type { SubtitleNavigationActions } from '../model/types';

/**
 * 字幕导航 Hook - 完整版
 *
 * @param playerInstance - 播放器实例
 * @param isActiveVideo - 是否为活跃视频（控制订阅）
 * @returns 字幕导航方法
 */
export function useSubtitleNavigation(
  playerInstance: VideoPlayer | null,
  isActiveVideo: boolean
): SubtitleNavigationActions {
  // ❌ 移除：不再从 store 订阅 currentTime（会有延迟）
  // 🚀 优化：直接从 playerInstance 读取最新值（同步、无延迟）

  // 导航状态追踪 - 记录最后一次导航到的句子索引
  const lastNavigationIndexRef = useRef<number | null>(null);

  // 使用通用 timer hook
  const { setTimer } = useSingleTimer();

  /**
   * 防抖清除导航索引 - 避免连续导航时过早清除
   * 2秒后清除导航索引，回到时间计算模式
   */
  const scheduleNavigationClear = useCallback(() => {
    // 设置新的延时清除（2秒，自动清除之前的定时器）
    setTimer(() => {
      lastNavigationIndexRef.current = null;
      log('subtitle-navigation', LogType.DEBUG, 'Navigation index cleared after timeout');
    }, 2000);
  }, [setTimer]);

  /**
   * 检查句子是否有效（非空）
   */
  const isValidSentence = useCallback((sentence: Sentence): boolean => {
    return sentence.text.trim() !== '';
  }, []);

  /**
   * 查找有效句子索引（跳过空句子）
   * @param sentences 句子数组
   * @param startIndex 起始索引
   * @param direction 查找方向
   * @returns 找到的索引，-1 表示未找到
   */
  const findValidSentenceIndex = useCallback((
    sentences: Sentence[],
    startIndex: number,
    direction: 'prev' | 'next'
  ): number => {
    if (direction === 'prev') {
      for (let i = startIndex - 1; i >= 0; i--) {
        if (isValidSentence(sentences[i])) return i;
      }
    } else {
      for (let i = startIndex + 1; i < sentences.length; i++) {
        if (isValidSentence(sentences[i])) return i;
      }
    }
    return -1;
  }, [isValidSentence]);

  /**
   * 使用 SearchEngine 查找当前时间对应的句子
   * 🚀 性能优化：不依赖currentTime，直接接收时间参数
   */
  const getSentenceAtTime = useCallback((timeSeconds: number): Sentence | null => {
    const subtitleState = useSubtitleStore.getState();
    const currentSubtitle = subtitleState.currentSubtitle;

    if (!currentSubtitle) return null;

    const result = SubtitleSearchEngine.findSentenceAtTime(
      currentSubtitle,
      timeSeconds,
      subtitleState.currentIndex
    );

    return result.sentence;
  }, []);

  /**
   * 导航到上一句
   *
   * 导航逻辑：
   * 1. 如果有上次导航位置，从该位置继续导航
   * 2. 否则从当前时间计算句子位置
   * 3. 如果当前时间距离句子开头 >=1.5秒，先跳回句子开头
   * 4. 查找上一个有效句子并跳转
   * 5. 如果没有上一句，跳转到视频开头
   */
  const goToPrevious = useCallback(() => {
    // ✅ 早期退出：非活跃视频不执行任何逻辑
    if (!isActiveVideo || !playerInstance) return;

    const startTime = performance.now();
    try {
      // 🎯 仅在导航时读取 store（避免持续订阅）
      const subtitleState = useSubtitleStore.getState();
      const currentSubtitle = subtitleState.currentSubtitle;

      if (!currentSubtitle || currentSubtitle.sentences.length === 0) {
        log('subtitle-navigation', LogType.DEBUG, 'No subtitle data available');
        return;
      }

      const sentences = currentSubtitle.sentences;

      // 🚀 直接从playerInstance读取最新currentTime（同步，无延迟）
      const currentTimeValue = playerInstance.currentTime ?? 0;

      // 确定起始索引：优先使用上次导航的位置，fallback到时间计算
      let baseIndex: number;
      if (lastNavigationIndexRef.current !== null) {
        baseIndex = lastNavigationIndexRef.current;
        log('subtitle-navigation', LogType.DEBUG, `Using last navigation index: ${baseIndex}`);
      } else {
        const realTimeCurrentSentence = getSentenceAtTime(currentTimeValue);
        baseIndex = realTimeCurrentSentence?.index ?? -1;
        log('subtitle-navigation', LogType.DEBUG, `Using time-based index: ${baseIndex}`);

        // 检查时间距离（仅在时间计算模式下）
        if (realTimeCurrentSentence && baseIndex >= 0) {
          const timeDifference = currentTimeValue - realTimeCurrentSentence.start;
          if (timeDifference >= 1.5) {
            log('subtitle-navigation', LogType.INFO, `Navigating to current sentence start at index ${baseIndex}`);
            lastNavigationIndexRef.current = baseIndex;
            seekVideo(playerInstance, realTimeCurrentSentence.start);
            scheduleNavigationClear();
            return;
          }
        }
      }

      // 查找上一个有效句子
      const prevIndex = findValidSentenceIndex(sentences, baseIndex, 'prev');
      if (prevIndex !== -1) {
        const prevSentence = sentences[prevIndex];
        log('subtitle-navigation', LogType.INFO, `Navigating to previous sentence at index ${prevIndex}`);
        lastNavigationIndexRef.current = prevIndex; // 记录导航位置
        seekVideo(playerInstance, prevSentence.start);
        scheduleNavigationClear();
        return;
      }

      // 如果没有上一句，跳转到开头
      log('subtitle-navigation', LogType.INFO, 'No previous sentence, navigating to beginning');
      lastNavigationIndexRef.current = 0;
      seekVideo(playerInstance, 0);
      scheduleNavigationClear();
    } catch (error) {
      log('subtitle-navigation', LogType.ERROR, `Failed to navigate to previous: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      const endTime = performance.now();
      log('subtitle-navigation-perf', LogType.INFO, `goToPrevious took ${(endTime - startTime).toFixed(2)}ms`);
    }
  }, [isActiveVideo, playerInstance, getSentenceAtTime, findValidSentenceIndex, scheduleNavigationClear]);

  /**
   * 导航到下一句
   *
   * 导航逻辑：
   * 1. 如果有上次导航位置，从该位置继续导航
   * 2. 否则从当前时间计算句子位置
   * 3. 查找下一个有效句子并跳转
   * 4. 如果没有下一句，保持当前位置
   */
  const goToNext = useCallback(() => {
    // ✅ 早期退出：非活跃视频不执行任何逻辑
    if (!isActiveVideo || !playerInstance) return;

    try {
      // 🎯 仅在导航时读取 store（避免持续订阅）
      const subtitleState = useSubtitleStore.getState();
      const currentSubtitle = subtitleState.currentSubtitle;

      if (!currentSubtitle || currentSubtitle.sentences.length === 0) {
        log('subtitle-navigation', LogType.DEBUG, 'No subtitle data available');
        return;
      }

      const sentences = currentSubtitle.sentences;

      // 🚀 直接从playerInstance读取最新currentTime（同步，无延迟）
      const currentTimeValue = playerInstance.currentTime ?? 0;

      // 确定起始索引：优先使用上次导航的位置，fallback到时间计算
      let baseIndex: number;
      if (lastNavigationIndexRef.current !== null) {
        baseIndex = lastNavigationIndexRef.current;
        log('subtitle-navigation', LogType.DEBUG, `Using last navigation index: ${baseIndex}`);
      } else {
        const realTimeCurrentSentence = getSentenceAtTime(currentTimeValue);
        baseIndex = realTimeCurrentSentence?.index ?? -1;
        log('subtitle-navigation', LogType.DEBUG, `Using time-based index: ${baseIndex}`);
      }

      // 查找下一个有效句子
      const nextIndex = findValidSentenceIndex(sentences, baseIndex, 'next');
      if (nextIndex !== -1) {
        const nextSentence = sentences[nextIndex];
        log('subtitle-navigation', LogType.INFO, `Navigating to next sentence at index ${nextIndex}`);
        lastNavigationIndexRef.current = nextIndex; // 记录导航位置
        seekVideo(playerInstance, nextSentence.start);
        scheduleNavigationClear();
        return;
      }

      // 如果没有下一句，什么也不做
      log('subtitle-navigation', LogType.DEBUG, 'No next sentence available, staying at current position');
    } catch (error) {
      log('subtitle-navigation', LogType.ERROR, `Failed to navigate to next: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isActiveVideo, playerInstance, getSentenceAtTime, findValidSentenceIndex, scheduleNavigationClear]);

  return {
    goToPrevious,
    goToNext,
  };
}
