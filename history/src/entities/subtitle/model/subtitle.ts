// 语义元素（最小单元，解耦出来，方便重用/扩展）
export type SemanticElement = {
  id: number;              // 全局唯一 ID
  kind?: string;           // 语义元素类型（如 word、phrase）
  label?: string;          // 语义元素展示标签
  pos?: string;            // 词性标签
  chinese_label?: string;  // 中文短标签
  chinese_def?: string;    // 中文详细释义
};

// 字幕中的单个 token（单词或标点）
export type SubtitleToken = {
  index: number;                        // token 在句子中的顺序（从 0 开始）
  text: string;                         // token 文本内容
  start?: number;                       // 可选：token 的开始时间（秒）
  end?: number;                         // 可选：token 的结束时间（秒）
  explanation: string;                  // token 的注释/解释
  semanticElement: SemanticElement | null; // 对应的语义元素（可能为空）
};

// 句子（由多个 token 组成）
export type Sentence = {
  index: number;                  // 句子全局编号（在整个字幕中的顺序）
  start: number;                  // 句子开始时间（秒）
  end: number;                    // 句子结束时间（秒）
  text: string;                   // 句子的完整文本
  explanation: string;            // 句子整体解释/翻译
  total_tokens: number;           // 该句子的 token 总数
  tokens: SubtitleToken[];        // 句子中的所有 tokens
};

// 段落（由多个句子组成）
export type Paragraph = {
  index: number;                  // 段落编号
  total_sentences: number;        // 段落中的句子数量
  sentences: Sentence[];          // 段落里的句子列表
};

// 整个字幕 JSON（扁平化结构）
export type SubtitleJson = {
  total_sentences: number;        // 总句子数
  total_tokens: number;           // 总 token 数

  // 扁平化的句子数组（按时间排序，按顺序编号）
  sentences: Sentence[];          // 所有句子的扁平化数组
};
