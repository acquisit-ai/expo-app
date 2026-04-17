/**
 * 原始字幕数据类型定义
 *
 * 定义从后端 API 获取的原始字幕 JSON 数据结构
 * 这些类型仅在 subtitle-fetching 功能模块中使用
 * 不依赖 entities 层的具体实现
 */

/**
 * 语义元素（最小单元，解耦出来，方便重用/扩展）
 */
export interface SemanticElementRaw {
  id: number;              // 全局唯一 ID
  kind?: string;           // 语义元素类型（如 word、phrase）
  label?: string;          // 语义元素展示标签
  pos?: string;            // 词性标签
  chinese_label?: string;  // 中文短标签
  chinese_def?: string;    // 中文详细释义
}

/**
 * 字幕中的单个 token（单词或标点）
 */
export interface SubtitleTokenRaw {
  index: number;                        // token 在句子中的顺序（从 0 开始）
  text: string;                         // token 文本内容
  start?: number;                       // 可选：token 的开始时间（秒）
  end?: number;                         // 可选：token 的结束时间（秒）
  explanation: string;                  // token 的注释/解释
  semanticElement: SemanticElementRaw | null; // 对应的语义元素，可能为空
}

/**
 * 句子（由多个 token 组成）
 */
export interface SentenceRaw {
  index: number;                  // 句子编号（在段落中的顺序）
  start: number;                  // 句子开始时间（秒）
  end: number;                    // 句子结束时间（秒）
  text: string;                   // 句子的完整文本
  explanation: string;            // 句子整体解释/翻译
  total_tokens: number;           // 该句子的 token 总数
  tokens: SubtitleTokenRaw[];     // 句子中的所有 tokens
}

/**
 * 段落（由多个句子组成）
 */
export interface ParagraphRaw {
  index: number;                  // 段落编号
  total_sentences: number;        // 段落中的句子数量
  sentences: SentenceRaw[];       // 段落里的句子列表
}

/**
 * 整个字幕 JSON（顶层结构 - 旧格式）
 * 包含段落结构的传统格式
 */
export interface SubtitleRawJsonLegacy {
  total_sentences: number;        // 总句子数
  total_tokens: number;           // 总 token 数
  total_paragraphs: number;       // 总段落数
  paragraphs: ParagraphRaw[];     // 所有段落列表
}

/**
 * 整个字幕 JSON（顶层结构 - 新格式）
 * 扁平化句子结构的新格式
 */
export interface SubtitleRawJsonFlat {
  total_sentences: number;        // 总句子数
  total_tokens: number;           // 总 token 数
  sentences: SentenceRaw[];       // 扁平化的句子数组
}

/**
 * 通用的原始字幕数据类型
 * 支持两种格式：legacy (paragraphs) 和 flat (sentences)
 */
export type SubtitleRawJson = SubtitleRawJsonLegacy | SubtitleRawJsonFlat;

/**
 * 类型守卫：检查是否为旧格式（包含 paragraphs）
 */
export function isLegacyFormat(data: SubtitleRawJson): data is SubtitleRawJsonLegacy {
  return 'paragraphs' in data && Array.isArray(data.paragraphs);
}

/**
 * 类型守卫：检查是否为新格式（包含 sentences）
 */
export function isFlatFormat(data: SubtitleRawJson): data is SubtitleRawJsonFlat {
  return 'sentences' in data && Array.isArray(data.sentences);
}

/**
 * 原始数据验证接口
 */
export interface RawDataValidation {
  isValid: boolean;
  format: 'legacy' | 'flat' | 'unknown';
  errors: string[];
  warnings: string[];
}

/**
 * 基础统计信息
 */
export interface RawDataStats {
  format: 'legacy' | 'flat' | 'unknown';
  totalSentences: number;
  totalTokens: number;
  totalParagraphs?: number; // 仅 legacy 格式有效
  dataKeys: string[];
}
