/**
 * Subtitle Entity - 字幕实体
 *
 * 新架构设计：负责字幕数据的存储、状态管理、搜索和访问操作
 *
 * 职责范围：
 * - 数据存储和状态管理（Store）
 * - 高性能搜索算法（Search Engine）
 * - 统一访问接口（Hooks）
 * - 核心数据模型（Types）
 *
 * 架构分层：
 * - Model: 数据模型和类型定义
 * - Store: Zustand状态管理
 * - Engine: 搜索算法引擎
 * - Hooks: React访问接口
 */

// === 核心数据模型 ===
export type {
  SubtitleJson,
  Paragraph,
  Sentence,
  SubtitleToken,
  SemanticElement
} from './model/subtitle';


// === 原始数据类型 ===
export type {
  SubtitleRawJson,
  SubtitleRawJsonLegacy,
  SubtitleRawJsonFlat,
  SemanticElementRaw,
  SubtitleTokenRaw,
  SentenceRaw,
  ParagraphRaw,
  RawDataValidation,
  RawDataStats
} from './model/raw-types';

export {
  isLegacyFormat,
  isFlatFormat
} from './model/raw-types';

// === 状态管理 ===
export {
  useSubtitleStore,
  type SubtitleEntityState,
  type SubtitleActions
} from './model/store';

// === 搜索引擎 ===
export {
  SubtitleSearchEngine
} from './lib/search';

// === 统一访问接口 ===
export {
  useSubtitleEntity,
  useSubtitleSearch,
  useSubtitleSync
} from './hooks/useSubtitleEntity';