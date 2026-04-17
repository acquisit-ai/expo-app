/**
 * Toast 常量定义
 * 避免魔法数字，提升代码可维护性
 */

import type { GlobalToastConfig } from './types';

/**
 * Toast 相关常量
 */
export const TOAST_CONSTANTS = {
  DEFAULT_DURATION: 4000,
  MAX_TOASTS: 2,
  MAX_TITLE_LENGTH: 100,
  MAX_MESSAGE_LENGTH: 200,
  ANIMATION_DURATION: 300,
  TOP_OFFSET: -20,
} as const;

/**
 * 默认配置 - 冻结对象确保不可变性
 */
export const DEFAULT_TOAST_CONFIG: Readonly<Required<GlobalToastConfig>> = Object.freeze({
  maxToasts: TOAST_CONSTANTS.MAX_TOASTS,
  position: 'top',
  defaultDuration: TOAST_CONSTANTS.DEFAULT_DURATION,
  isDark: false,
} as const);