/**
 * Toast 类型定义 - 严格化版本
 * 统一管理 Toast 相关的类型定义，使用更严格的约束
 */

// 常量定义，确保类型安全
export const TOAST_TYPES = ['success', 'error', 'info', 'warning'] as const;
export type ToastType = typeof TOAST_TYPES[number];

export const TOAST_POSITIONS = ['top', 'bottom'] as const;
export type ToastPosition = typeof TOAST_POSITIONS[number];

// 使用品牌类型避免字符串混用
export type ToastId = string & { readonly __toastIdBrand: unique symbol };

/**
 * Toast 配置接口 - 只读属性确保不可变性
 */
export interface ToastConfig {
  readonly title: string;
  readonly message?: string;
  readonly duration?: number;
  readonly type: ToastType;
}

/**
 * 全局 Toast 配置接口 - 只读属性
 */
export interface GlobalToastConfig {
  readonly maxToasts?: number;
  readonly position?: ToastPosition;
  readonly defaultDuration?: number;
  readonly isDark?: boolean;
}

/**
 * Toast 视图组件属性接口
 */
export interface ToastViewProps {
  readonly type: ToastType;
  readonly title: string;
  readonly message?: string;
  readonly isDark: boolean;
  readonly position: ToastPosition;
}

/**
 * Toast 渲染器函数类型
 * 用于解决循环依赖 - 通过函数类型而不是具体组件引用
 */
export type ToastRenderer = (props: ToastViewProps) => React.ReactElement;

/**
 * 类型守卫函数
 */
export const isValidToastType = (type: string): type is ToastType =>
  TOAST_TYPES.includes(type as ToastType);

export const isValidToastPosition = (position: string): position is ToastPosition =>
  TOAST_POSITIONS.includes(position as ToastPosition);

/**
 * 运行时配置验证
 */
export const isValidToastConfig = (config: unknown): config is ToastConfig => {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const cfg = config as Record<string, unknown>;
  
  return (
    typeof cfg.title === 'string' &&
    cfg.title.trim().length > 0 &&
    (cfg.message === undefined || typeof cfg.message === 'string') &&
    (cfg.duration === undefined || (typeof cfg.duration === 'number' && cfg.duration > 0)) &&
    typeof cfg.type === 'string' &&
    isValidToastType(cfg.type)
  );
};

/**
 * Toast ID 创建工具
 */
export const createToastId = (): ToastId => 
  Math.random().toString(36).substr(2, 9) as ToastId;