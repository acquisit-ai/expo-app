/**
 * 字幕显示核心 Hook
 *
 * 直接订阅 video entity 状态，提供字幕显示和导航功能
 * 完全无状态设计，依赖现有的 video 和 subtitle entities
 */

import { useMemo, useState, useCallback } from 'react';
import { useSubtitleEntity, type Sentence, type SubtitleToken } from '@/entities/subtitle';
import { useVideoPlayer } from '@/entities/video';
import { useGlobalSettings, selectShowSubtitles } from '@/entities/global-settings';
import { useModal } from '@/shared/lib/modal';
import { log, LogType } from '@/shared/lib/logger';
import { pauseVideo, playVideo } from '@/shared/lib/player-controls';
import type {
  SubtitleDisplayConfig,
  UseSubtitleDisplayReturn,
  SubtitleDisplayState,
  SubtitleDisplayActions,
  SubtitleTokenKey,
} from '../model/types';
import { DEFAULT_SUBTITLE_CONFIG } from '../model/types';
import { useSubtitleNavigation } from '../hooks/useSubtitleNavigation';

/**
 * 字幕显示核心 Hook
 * @param config 运行时配置覆盖
 * @returns 字幕显示状态和控制方法
 */
export function useSubtitleDisplay(
  config: Partial<SubtitleDisplayConfig> = {}
): UseSubtitleDisplayReturn {
  // Token选中状态管理
  const [selectedTokens, setSelectedTokens] = useState<Set<SubtitleTokenKey>>(new Set());
  // Modal高亮状态管理
  const [modalHighlightedToken, setModalHighlightedToken] = useState<SubtitleTokenKey | null>(null);

  // Modal管理
  const { openModal } = useModal();

  // 合并配置
  const finalConfig: SubtitleDisplayConfig = {
    ...DEFAULT_SUBTITLE_CONFIG,
    ...config,
  };

  // 直接订阅 video entity 状态
  const { currentTime, playerInstance } = useVideoPlayer();
  const showSubtitles = useGlobalSettings(selectShowSubtitles);

  // 🎯 使用提取的导航 Hook - IntegratedSubtitleView 只在活跃视频渲染，所以传 true
  const { goToPrevious, goToNext } = useSubtitleNavigation(playerInstance, true);

  // 🎯 播放控制方法 - 使用 shared/lib 工具函数
  const pause = useCallback(() => {
    pauseVideo(playerInstance);
  }, [playerInstance]);

  const play = useCallback(() => {
    playVideo(playerInstance);
  }, [playerInstance]);

  // 订阅当前字幕数据
  const {
    currentSubtitle,
    getSentenceAtTime
  } = useSubtitleEntity();

  const createTokenKey = useCallback((token: SubtitleToken, sentenceIndex: number): SubtitleTokenKey => {
    const elementId = token.semanticElement?.id;
    if (elementId !== undefined && elementId !== null) {
      return String(elementId);
    }
    return `${sentenceIndex}:${token.index}`;
  }, []);

  // 计算当前时间对应的句子（直接使用秒）
  const currentTimeSeconds = currentTime;

  // 计算显示状态 - 纯计算，无状态存储
  const state: SubtitleDisplayState = useMemo(() => {
    // 如果没有字幕数据或被配置禁用，则不提供导航功能
    // 注意：去除 showSubtitles 检查，允许字幕关闭时仍可导航
    if (!currentSubtitle || !finalConfig.enabled) {
      return {
        currentSentence: null,
        currentIndex: -1,
        sentences: [],
        hasPrevious: false,
        hasNext: false,
        selectedTokens,
        modalHighlightedToken,
      };
    }

    // 获取所有句子
    const sentences = currentSubtitle.sentences;

    // 找到当前时间对应的句子
    const currentSentence = getSentenceAtTime(currentTimeSeconds);

    // 获取当前句子对应的索引（保证一致性）
    const actualCurrentIndex = currentSentence ? currentSentence.index : -1;

    // 预计算前后有效句子索引，避免重复计算
    const hasPrevious = sentences.some((s, i) => i < actualCurrentIndex && s.text.trim() !== '');
    const hasNext = sentences.some((s, i) => i > actualCurrentIndex && s.text.trim() !== '');

    return {
      currentSentence,
      currentIndex: actualCurrentIndex,
      sentences,
      hasPrevious,
      hasNext,
      selectedTokens,
      modalHighlightedToken,
    };
  }, [currentSubtitle, finalConfig.enabled, currentTimeSeconds, selectedTokens, modalHighlightedToken]);

  // Token 交互功能
  const toggleTokenSelection = useCallback((tokenKey: SubtitleTokenKey) => {
    if (!tokenKey) {
      return;
    }
    setSelectedTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenKey)) {
        newSet.delete(tokenKey);
      } else {
        newSet.add(tokenKey);
      }
      return newSet;
    });
  }, []);

  const clearModalHighlight = useCallback(() => {
    setModalHighlightedToken(null);
  }, [setModalHighlightedToken]);

  const showTokenExplanation = useCallback((token: SubtitleToken, sentenceIndex: number) => {
    // 🎯 直接从 playerInstance 读取播放状态
    const wasPlayingBeforeModal = playerInstance?.playing ?? false;
    if (wasPlayingBeforeModal) {
      pause();
    }

    const tokenKey = createTokenKey(token, sentenceIndex);
    const semanticElement = token.semanticElement;
    let metadata: SubtitleSemanticInfo | undefined;

    if (semanticElement) {
      const semanticId = String(semanticElement.id ?? token.text);
      const kind = (semanticElement.kind ?? 'word') as 'word' | 'phrase';
      const posValue = semanticElement.pos ?? undefined;
      const label = semanticElement.label ?? token.text;
      metadata = {
        id: semanticId,
        kind,
        label,
        pos: posValue,
        chineseLabel: semanticElement.chinese_label ?? '',
        chineseDef: semanticElement.chinese_def ?? '',
      };
    }

    // 设置Modal高亮状态
    setModalHighlightedToken(tokenKey);

    // 打开解释Modal
    openModal('ElementExplanationModal', {
      word: token.text,
      translation: token.explanation,
      ...(semanticElement
        ? (() => {
            const label = semanticElement.label ?? token.text;
            const kind = semanticElement.kind?.toLowerCase();
            let posValue: string | undefined;
            if (kind === 'phrase') {
              posValue = 'PHRASE';
            } else if (kind === 'word') {
              posValue = semanticElement.pos ? semanticElement.pos.toUpperCase() : undefined;
            } else {
              posValue = semanticElement.pos?.toUpperCase() ?? semanticElement.kind?.toUpperCase();
            }
            return {
              label,
              definition: semanticElement.chinese_def ?? '',
              dictionaryLabel: semanticElement.chinese_label ?? '',
              metadata,
              ...(posValue ? { pos: posValue } : {}),
            };
          })()
        : {}),
      clearModalHighlight: clearModalHighlight,
      wasPlayingBeforeModal,
      resumePlayback: play,
    });
  }, [openModal, createTokenKey, clearModalHighlight, playerInstance, pause, play]);

  const actions: SubtitleDisplayActions = useMemo(() => ({
    goToPrevious,
    goToNext,
    toggleTokenSelection,
    showTokenExplanation,
    clearModalHighlight,
  }), [goToPrevious, goToNext, toggleTokenSelection, showTokenExplanation, clearModalHighlight]);


  return {
    state,
    actions,
    config: finalConfig,
  };
}

/**
 * 辅助 Hook：获取指定时间的句子
 * @param timeSeconds 时间（秒）
 * @returns 对应时间的句子或 null
 */
export function useSubtitleAtTime(timeSeconds: number): Sentence | null {
  const { getSentenceAtTime } = useSubtitleEntity();

  return useMemo(() => {
    return getSentenceAtTime(timeSeconds);
  }, [getSentenceAtTime, timeSeconds]);
}

/**
 * 辅助 Hook：检查字幕是否可用
 * @returns 字幕是否已加载且可用
 */
export function useSubtitleAvailability(): {
  isLoaded: boolean;
  hasSubtitles: boolean;
  sentenceCount: number;
} {
  const { currentSubtitle, isLoaded } = useSubtitleEntity();

  return useMemo(() => ({
    isLoaded: isLoaded(),
    hasSubtitles: !!currentSubtitle,
    sentenceCount: currentSubtitle?.sentences.length || 0,
  }), [currentSubtitle, isLoaded]);
}
interface SubtitleSemanticInfo {
  id: string;
  kind: 'word' | 'phrase';
  label: string;
  pos?: string;
  chineseLabel?: string;
  chineseDef?: string;
}
