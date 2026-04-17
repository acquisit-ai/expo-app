/**
 * 字幕数据解析器
 *
 * 负责解析 API 响应中的 JSON 字符串，返回类型安全的原始数据
 * 不进行格式转换，保持数据原样，让 entity 层处理
 */

import { log, LogType } from '@/shared/lib/logger';
import type { SubtitleApiResponse } from '../api/types';
import type {
  SubtitleRawJson,
  RawDataValidation,
  RawDataStats
} from '@/entities/subtitle/model/raw-types';
import { isLegacyFormat, isFlatFormat } from '@/entities/subtitle/model/raw-types';
import type { SubtitleJson, Sentence } from '@/entities/subtitle/model/subtitle';

/**
 * 数据解析结果
 */
export interface TransformResult {
  subtitle: SubtitleJson; // 完全处理后的字幕数据
  validation: RawDataValidation;
  stats: RawDataStats;
  transformedAt: string;
}

/**
 * 数据解析选项
 */
export interface TransformOptions {
  /** 是否启用数据验证 */
  enableValidation?: boolean;
  /** 是否启用严格模式验证 */
  strictMode?: boolean;
}

/**
 * 数据解析错误
 */
export class DataTransformError extends Error {
  constructor(message: string, public originalData?: any) {
    super(message);
    this.name = 'DataTransformError';
  }
}

/**
 * 字幕数据解析器
 */
export class SubtitleDataTransformer {
  /**
   * 解析 API 响应，返回类型安全的原始 JSON 数据
   */
  static transform(
    apiResponse: SubtitleApiResponse,
    options: TransformOptions = {}
  ): TransformResult {
    const { enableValidation = true, strictMode = false } = options;

    log('subtitle-transformer', LogType.INFO,
      `Parsing subtitle data for video ${apiResponse.video_id}`
    );

    try {
      // 解析 JSON 字符串
      const rawData = JSON.parse(apiResponse.subtitle_json) as SubtitleRawJson;

      // 数据验证和统计
      const validation = enableValidation
        ? this.validateRawData(rawData, strictMode)
        : this.createBasicValidation(rawData);

      const stats = this.generateDataStats(rawData);

      // 如果启用严格模式且验证失败，抛出错误
      if (strictMode && !validation.isValid) {
        throw new DataTransformError(
          `Data validation failed: ${validation.errors.join(', ')}`,
          apiResponse
        );
      }

      // 执行完整的数据处理流程
      const processedData = this.processSubtitleData(rawData);

      log('subtitle-transformer', LogType.INFO,
        `Successfully parsed and processed subtitle JSON for video ${apiResponse.video_id} (format: ${stats.format}, sentences: ${processedData.sentences.length})`
      );

      return {
        subtitle: processedData,
        validation,
        stats,
        transformedAt: new Date().toISOString()
      };

    } catch (error) {
      log('subtitle-transformer', LogType.ERROR,
        `Failed to parse subtitle data: ${error}`
      );

      if (error instanceof SyntaxError) {
        throw new DataTransformError('Invalid JSON format in subtitle data', apiResponse);
      }

      if (error instanceof DataTransformError) {
        throw error;
      }

      throw new DataTransformError(
        `JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`,
        apiResponse
      );
    }
  }

  /**
   * 验证原始数据结构
   */
  private static validateRawData(data: any, strictMode: boolean): RawDataValidation {
    const validation: RawDataValidation = {
      isValid: true,
      format: 'unknown',
      errors: [],
      warnings: []
    };

    // 基础结构检查
    if (!data || typeof data !== 'object') {
      validation.isValid = false;
      validation.errors.push('Data must be a valid object');
      return validation;
    }

    // 格式检测
    if (isLegacyFormat(data)) {
      validation.format = 'legacy';
      this.validateLegacyFormat(data, validation, strictMode);
    } else if (isFlatFormat(data)) {
      validation.format = 'flat';
      this.validateFlatFormat(data, validation, strictMode);
    } else {
      validation.format = 'unknown';
      validation.errors.push('Unknown subtitle format - missing both paragraphs and sentences arrays');
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * 验证旧格式数据
   */
  private static validateLegacyFormat(
    data: any,
    validation: RawDataValidation,
    strictMode: boolean
  ): void {
    if (!Array.isArray(data.paragraphs)) {
      validation.errors.push('Paragraphs must be an array');
      validation.isValid = false;
      return;
    }

    if (strictMode) {
      // 严格模式下检查段落结构
      for (let i = 0; i < data.paragraphs.length; i++) {
        const paragraph = data.paragraphs[i];
        if (!paragraph.sentences || !Array.isArray(paragraph.sentences)) {
          validation.errors.push(`Paragraph ${i}: missing sentences array`);
          validation.isValid = false;
        }
      }
    }
  }

  /**
   * 验证新格式数据
   */
  private static validateFlatFormat(
    data: any,
    validation: RawDataValidation,
    strictMode: boolean
  ): void {
    if (!Array.isArray(data.sentences)) {
      validation.errors.push('Sentences must be an array');
      validation.isValid = false;
      return;
    }

    if (strictMode) {
      // 严格模式下检查句子结构
      for (let i = 0; i < data.sentences.length; i++) {
        const sentence = data.sentences[i];
        if (!sentence.text || typeof sentence.text !== 'string') {
          validation.errors.push(`Sentence ${i}: missing or invalid text field`);
          validation.isValid = false;
        }
      }
    }
  }

  /**
   * 创建基础验证结果
   */
  private static createBasicValidation(data: any): RawDataValidation {
    return {
      isValid: true,
      format: isLegacyFormat(data) ? 'legacy' : isFlatFormat(data) ? 'flat' : 'unknown',
      errors: [],
      warnings: []
    };
  }

  /**
   * 完整处理字幕数据
   * 包含：格式转换、时间处理、排序、优化、空白段插入、编号
   */
  private static processSubtitleData(rawData: SubtitleRawJson): SubtitleJson {
    // 1. 扁平化：从旧格式（paragraphs）或新格式（sentences）提取句子
    let allSentences: Sentence[] = [];

    if (isLegacyFormat(rawData)) {
      // 旧格式：从段落结构中提取句子
      for (const paragraph of rawData.paragraphs) {
        allSentences.push(...paragraph.sentences);
      }
    } else if (isFlatFormat(rawData) || 'sentences' in rawData) {
      // 新格式：直接使用句子数组
      allSentences = [...rawData.sentences];
    }

    // 2. 按时间排序（保持原始秒单位）
    allSentences.sort((a, b) => a.start - b.start);

    // 3. 时间优化：让每个句子提前0.1秒显示，但避免重叠
    allSentences.forEach((sentence, index) => {
      const originalStart = sentence.start;
      const optimizedStart = Math.max(0.001, originalStart - 0.1);

      if (index === 0) {
        // 第一句：直接提前0.1秒，但不能小于0.001秒
        sentence.start = optimizedStart;
      } else {
        const previousSentence = allSentences[index - 1];
        // 后续句子：如果与前一句重叠，则设置为前一句结束时间+0.001秒
        if (optimizedStart <= previousSentence.end) {
          sentence.start = previousSentence.end + 0.001;
        } else {
          sentence.start = optimizedStart;
        }
      }
    });

    // 4. 插入空白段
    const sentencesWithBlanks: Sentence[] = [];

    for (let i = 0; i < allSentences.length; i++) {
      const currentSentence = allSentences[i];

      // 添加当前句子
      sentencesWithBlanks.push(currentSentence);

      // 检查是否需要插入空白段
      if (i < allSentences.length - 1) {
        const nextSentence = allSentences[i + 1];

        // 只要前一句end != 后一句start - 0.001，就插入空白段
        if (Math.abs(currentSentence.end - (nextSentence.start - 0.001)) > 0.0001) {
          const blankSentence: Sentence = {
            index: 0, // 临时编号，后面会重新编号
            start: currentSentence.end + 0.001,
            end: nextSentence.start - 0.001,
            text: "",
            explanation: "",
            total_tokens: 0,
            tokens: []
          };
          sentencesWithBlanks.push(blankSentence);
        }
      }
    }

    allSentences = sentencesWithBlanks;

    // 5. 重新编号
    allSentences.forEach((sentence, index) => {
      sentence.index = index;
    });

    // 构建最终的 SubtitleJson 对象
    const processedSubtitle: SubtitleJson = {
      total_sentences: allSentences.length,
      total_tokens: rawData.total_tokens || 0,
      sentences: allSentences
    };

    return processedSubtitle;
  }


  /**
   * 生成数据统计信息
   */
  private static generateDataStats(data: any): RawDataStats {
    if (!data || typeof data !== 'object') {
      return {
        format: 'unknown',
        totalSentences: 0,
        totalTokens: 0,
        dataKeys: []
      };
    }

    const format = isLegacyFormat(data) ? 'legacy' : isFlatFormat(data) ? 'flat' : 'unknown';

    let totalSentences = 0;
    if (format === 'legacy' && data.paragraphs) {
      totalSentences = data.paragraphs.reduce((sum: number, p: any) =>
        sum + (p.sentences ? p.sentences.length : 0), 0
      );
    } else if (format === 'flat' && data.sentences) {
      totalSentences = data.sentences.length;
    }

    return {
      format,
      totalSentences,
      totalTokens: data.total_tokens || 0,
      totalParagraphs: data.total_paragraphs,
      dataKeys: Object.keys(data)
    };
  }
}