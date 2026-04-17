/**
 * 字幕搜索引擎 - 简化版
 *
 * 专注于高性能的二分搜索算法
 */

import type { SubtitleJson, Sentence } from '../model/subtitle';

/**
 * 搜索结果接口
 */
interface SearchResult {
  sentence: Sentence | null;
  newIndex: number;
}

/**
 * 字幕搜索引擎
 */
export class SubtitleSearchEngine {
  /**
   * 根据时间查找句子 - 使用指针优化的智能搜索
   * @param subtitle 字幕数据
   * @param timeSeconds 时间（秒）
   * @param currentIndex 当前索引指针
   */
  static findSentenceAtTime(subtitle: SubtitleJson, timeSeconds: number, currentIndex: number = 0): SearchResult {
    // 输入验证
    if (!subtitle?.sentences?.length) {
      return { sentence: null, newIndex: 0 };
    }

    // 时间验证：必须是有效数字
    if (!Number.isFinite(timeSeconds)) {
      return { sentence: null, newIndex: 0 };
    }

    const sentences = subtitle.sentences;

    // 边界检查
    if (timeSeconds < sentences[0].start) {
      return { sentence: null, newIndex: 0 };
    }
    if (timeSeconds > sentences[sentences.length - 1].end) {
      return { sentence: null, newIndex: sentences.length - 1 };
    }

    // 1. 检查当前位置 - O(1)
    if (currentIndex >= 0 && currentIndex < sentences.length) {
      const current = sentences[currentIndex];
      if (timeSeconds >= current.start && timeSeconds <= current.end) {
        return { sentence: current, newIndex: currentIndex };
      }
    }

    // 2. 智能线性搜索（双向）- O(1-5)
    const maxSteps = 5;

    // 向前搜索
    if (currentIndex >= 0 && currentIndex < sentences.length && timeSeconds > sentences[currentIndex].end) {
      for (let i = currentIndex + 1; i < Math.min(sentences.length, currentIndex + maxSteps + 1); i++) {
        const sentence = sentences[i];
        if (timeSeconds >= sentence.start && timeSeconds <= sentence.end) {
          return { sentence, newIndex: i };
        }
      }
    }

    // 向后搜索
    if (currentIndex >= 0 && currentIndex < sentences.length && timeSeconds < sentences[currentIndex].start) {
      for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - maxSteps); i--) {
        const sentence = sentences[i];
        if (timeSeconds >= sentence.start && timeSeconds <= sentence.end) {
          return { sentence, newIndex: i };
        }
      }
    }

    // 3. 其他情况用二分搜索 - O(log n)
    return this.binarySearchWithIndex(sentences, timeSeconds);
  }

  /**
   * 二分搜索并返回索引
   */
  private static binarySearchWithIndex(sentences: Sentence[], timeSeconds: number): SearchResult {
    let left = 0;
    let right = sentences.length - 1;
    let closestIndex = 0;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const sentence = sentences[mid];

      if (timeSeconds >= sentence.start && timeSeconds <= sentence.end) {
        return { sentence, newIndex: mid };
      } else if (timeSeconds < sentence.start) {
        right = mid - 1;
      } else {
        // timeSeconds > sentence.end，这个句子在目标时间之前
        closestIndex = mid;
        left = mid + 1;
      }
    }

    // 没找到匹配的句子，返回最接近的位置
    // closestIndex 是最后一个 end < timeSeconds 的句子
    // 如果 timeSeconds 在两个句子之间，返回前一个句子的位置是合理的
    return { sentence: null, newIndex: closestIndex };
  }

  /**
   * 获取时间范围内的句子
   */
  static getSentencesInRange(
    subtitle: SubtitleJson,
    startSeconds: number,
    endSeconds: number
  ): Sentence[] {
    if (!subtitle?.sentences?.length) return [];

    const results: Sentence[] = [];

    for (const sentence of subtitle.sentences) {
      // 检查句子是否与时间范围有重叠
      if (sentence.start <= endSeconds && sentence.end >= startSeconds) {
        results.push(sentence);
      }
    }

    return results;
  }

  /**
   * 获取字幕总时长
   */
  static getTotalDuration(subtitle: SubtitleJson): number {
    if (!subtitle?.sentences?.length) return 0;
    return subtitle.sentences[subtitle.sentences.length - 1].end;
  }
}