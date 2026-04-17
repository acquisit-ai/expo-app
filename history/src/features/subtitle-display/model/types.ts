/**
 * 字幕显示功能的类型定义
 *
 * 提供字幕展示相关的类型，包括配置选项、显示状态和导航控制
 */

import type { Sentence, SubtitleToken } from '@/entities/subtitle';

/** token 选中/高亮的唯一标识 */
export type SubtitleTokenKey = string;

/**
 * 字幕显示配置
 * 运行时注入，无持久化
 */
export interface SubtitleDisplayConfig {
  /** 是否启用字幕显示 */
  enabled: boolean;
  /** 字幕显示位置 */
  position: 'top' | 'center' | 'bottom';
  /** 字体大小 */
  fontSize: number;
  /** 字体颜色 */
  fontColor: string;
  /** 背景颜色 */
  backgroundColor: string;
  /** 背景透明度 (0-1) */
  backgroundOpacity: number;
  /** 是否显示导航控件 */
  showNavigationControls: boolean;
  /** 自动滚动到当前句子 */
  autoScroll: boolean;
  /** 点击句子时是否跳转到对应时间 */
  enableClickToSeek: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_SUBTITLE_CONFIG: SubtitleDisplayConfig = {
  enabled: true,
  position: 'bottom',
  fontSize: 16,
  fontColor: '#FFFFFF',
  backgroundColor: 'transparent',
  backgroundOpacity: 0,
  showNavigationControls: true,
  autoScroll: true,
  enableClickToSeek: true,
};

/**
 * 字幕显示状态
 */
export interface SubtitleDisplayState {
  /** 当前显示的句子 */
  currentSentence: Sentence | null;
  /** 当前句子索引 */
  currentIndex: number;
  /** 所有句子列表 */
  sentences: Sentence[];
  /** 是否有上一句 */
  hasPrevious: boolean;
  /** 是否有下一句 */
  hasNext: boolean;
  /** 缓存的上一句索引 - 内部优化使用 */
  _prevIndex?: number;
  /** 缓存的下一句索引 - 内部优化使用 */
  _nextIndex?: number;
  /** 选中的token标识集合 */
  selectedTokens: Set<SubtitleTokenKey>;
  /** 当前显示Modal的token标识 (用于高亮显示) */
  modalHighlightedToken: SubtitleTokenKey | null;
}

/**
 * 字幕导航控制（仅上一句/下一句）
 */
export interface SubtitleNavigationActions {
  /** 跳转到上一句 */
  goToPrevious: () => void;
  /** 跳转到下一句 */
  goToNext: () => void;
}

/**
 * 字幕显示动作集合（含导航与交互）
 */
export interface SubtitleDisplayActions extends SubtitleNavigationActions {
  /** 切换token选中状态 */
  toggleTokenSelection: (tokenKey: SubtitleTokenKey) => void;
  /** 显示token解释Modal */
  showTokenExplanation: (token: SubtitleToken, sentenceIndex: number) => void;
  /** 清除Modal高亮状态 */
  clearModalHighlight: () => void;
}

/**
 * useSubtitleDisplay Hook 返回类型
 */
export interface UseSubtitleDisplayReturn {
  /** 显示状态 */
  state: SubtitleDisplayState;
  /** 导航控制 */
  actions: SubtitleDisplayActions;
  /** 当前配置 */
  config: SubtitleDisplayConfig;
}

/**
 * 字幕显示组件 Props
 */
export interface SubtitleDisplayProps {
  /** 样式覆盖 */
  style?: any;
}

/**
 * 字幕导航控件 Props
 */
export interface SubtitleNavigationControlsProps {
  /** 导航动作 */
  actions: SubtitleNavigationActions;
  /** 显示状态 */
  state: SubtitleDisplayState;
  /** 控件配置 */
  config?: {
    showLabels?: boolean;
    iconSize?: number;
    spacing?: number;
  };
  /** 样式覆盖 */
  style?: any;
}

/**
 * 集成字幕视图 Props
 */
export interface IntegratedSubtitleViewProps {
  /** 字幕显示配置 */
  config?: Partial<SubtitleDisplayConfig>;
  /** 容器样式 */
  containerStyle?: any;
  /** 字幕样式 */
  subtitleStyle?: any;
  /** 控件样式 */
  controlsStyle?: any;
}
