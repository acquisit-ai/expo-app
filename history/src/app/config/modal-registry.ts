/**
 * 应用级 Modal 注册中心
 *
 * 职责：聚合所有 Feature Modal 和 Demo Modal，统一注册到全局 Modal Stack
 *
 * 架构优势：
 * - App 层可以依赖所有 Features（符合 FSD 架构）
 * - Shared 层保持通用性，不依赖具体 Features
 * - 集中管理所有应用 Modal，易于维护
 *
 * @see src/shared/lib/modal - 通用 Modal 系统
 */

import { createModalStack, Easing } from '@/shared/lib/modal';
import type { ModalStackConfig } from '@/shared/lib/modal';

// ===== Demo Modals =====
import { DemoModal, IntroModal } from '@/shared/lib/modal/examples';

// ===== Feature Modals =====
import { ElementExplanationModal } from '@/features/subtitle-display';
import { PlaybackSettingsModal } from '@/features/playback-settings';
import { NativePickerModal } from '@/shared/lib/modal';
import type { NativePickerModalParams } from '@/shared/lib/modal';
import type { WordCollectionSort, WordCollectionSortOption } from '@/features/word-collection-list';

/**
 * 应用级 Modal 参数类型定义
 * 集成所有 Demo Modal 和 Feature Modal
 */
export interface AppModalStackParamsList {
  // ===== Demo Modals =====
  DemoModal: {
    origin: 'Hooks' | 'Class' | 'Plain JS';
    color: string;
    name: string;
  };
  IntroModal: undefined;

  // ===== Feature Modals =====

  /**
   * 单词/元素解释 Modal
   * @feature subtitle-display
   */
  ElementExplanationModal: {
    word: string;
    translation: string;
    label?: string;
    pos?: string;
    definition?: string;
    dictionaryLabel?: string;
    metadata?: {
      id: string;
      kind: 'word' | 'phrase';
      label: string;
      pos?: string;
      chineseLabel?: string;
      chineseDef?: string;
    };
    clearModalHighlight?: () => void;
    wasPlayingBeforeModal?: boolean;
    resumePlayback?: () => void;
  };

  /**
   * 播放设置 Modal
   * @feature playback-settings
   */
  PlaybackSettingsModal: undefined;

  /**
   * 通用原生 Picker Modal
   * @shared native-picker
   */
  NativePickerModal: NativePickerModalParams;
}

/**
 * 公共动画配置：从底部滑入
 */
const SLIDE_UP_ANIMATION = {
  position: 'bottom' as const,
  backdropOpacity: 0.4,
  animateInConfig: {
    easing: Easing.inOut(Easing.exp),
    duration: 300,
  },
  animateOutConfig: {
    easing: Easing.inOut(Easing.exp),
    duration: 500,
  },
  transitionOptions: (animatedValue: any) => ({
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [1000, 0, 1000],
        }),
      },
    ],
  }),
};

/**
 * Modal Stack 配置
 * 为每个 Modal 配置动画、背景等选项
 */
const modalConfig: ModalStackConfig = {
  // ===== Demo Modals =====

  IntroModal: {
    modal: IntroModal,
    ...SLIDE_UP_ANIMATION,
  },

  DemoModal: {
    modal: DemoModal,
    backdropOpacity: 0.4,
  },

  // ===== Feature Modals =====

  ElementExplanationModal: {
    modal: ElementExplanationModal,
    // ElementExplanationModal 有自己的 modalOptions，这里不覆盖
  },

  PlaybackSettingsModal: {
    modal: PlaybackSettingsModal,
    ...SLIDE_UP_ANIMATION,
  },

  NativePickerModal: {
    modal: NativePickerModal,
  },
};

/**
 * 创建并导出应用 Modal Stack
 * 在 App.tsx 中作为 <ModalProvider stack={modalStack}> 使用
 */
export const modalStack = createModalStack<AppModalStackParamsList>(modalConfig);
