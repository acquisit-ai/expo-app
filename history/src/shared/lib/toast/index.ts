/**
 * Toast 服务 - 重构版本
 * 使用依赖注入解决循环依赖，提供严格化的类型安全API
 */

import React from 'react';
import { ToastManager } from './lib/toastManager';
import { isDevelopment } from '../../config/environment';
import type {
  ToastConfig,
  GlobalToastConfig,
  ToastId,
  ToastRenderer,
  ToastViewProps
} from './types';

// 重新导出类型定义
export type { 
  ToastConfig, 
  GlobalToastConfig, 
  ToastType,
  ToastPosition,
  ToastId,
  ToastViewProps 
} from './types';

// 重新导出工具函数
export { 
  isValidToastConfig, 
  isValidToastType, 
  isValidToastPosition 
} from './types';

// 单例管理器实例
const toastManager = new ToastManager();

/**
 * Toast 服务 API - 严格类型化版本
 */
export const toast = {
  /**
   * 显示 Toast 通知
   * @param cfg Toast 配置
   * @returns Toast ID，失败时返回 null
   */
  show(cfg: ToastConfig): ToastId | null {
    return toastManager.show(cfg);
  },

  /**
   * 手动关闭指定 Toast
   * @param id Toast ID
   */
  dismiss(id: ToastId): void {
    toastManager.dismiss(id);
  },

  /**
   * 清空所有 Toast
   */
  clear(): void {
    toastManager.clear();
  },

  /**
   * 获取当前队列状态（调试用）
   */
  getQueue(): readonly ToastId[] {
    return toastManager.getQueue();
  },
} as const;

/**
 * 初始化 Toast 服务 - 重构版本
 * 需要在应用启动时调用，设置渲染器和初始配置
 * 
 * @param isDark 是否为深色模式
 */
export function initToast(isDark: boolean = false): void {
  // 延迟导入 ToastView，避免循环依赖
  const createRenderer = (): ToastRenderer => {
    let ToastViewComponent: React.ComponentType<ToastViewProps> | undefined;
    
    return (props: ToastViewProps) => {
      // 懒加载组件
      if (!ToastViewComponent) {
        // 动态导入，但类型安全
        ToastViewComponent = require('./ui/ToastView').ToastView;
      }
      
      if (!ToastViewComponent) {
        throw new Error('Failed to load ToastView component');
      }
      
      return React.createElement(ToastViewComponent, props);
    };
  };

  // 设置渲染器
  toastManager.setRenderer(createRenderer());
  
  // 更新初始配置
  toastManager.updateConfig({ isDark });
}

/**
 * 更新 Toast 全局配置
 * @param params 配置参数
 */
export function updateToastConfig(params: GlobalToastConfig): void {
  toastManager.updateConfig(params);
}

/**
 * 获取当前配置（只读）
 * 主要用于调试和测试
 */
export function getToastConfig(): Required<GlobalToastConfig> {
  return toastManager.getConfig();
}

/**
 * 高级 API：手动设置渲染器
 * 通常不需要使用，除非有特殊的自定义需求
 * 
 * @param renderer 自定义渲染器函数
 */
export function setToastRenderer(renderer: ToastRenderer): void {
  toastManager.setRenderer(renderer);
}

// 导出配置和常量
export { DEFAULT_TOAST_CONFIG, TOAST_CONSTANTS } from './constants';

// 开发环境下的调试工具
if (isDevelopment()) {
  // 添加到全局对象，便于调试
  (globalThis as any).__TOAST_DEBUG__ = {
    manager: toastManager,
    getQueue: () => toastManager.getQueue(),
    clear: () => toastManager.clear(),
  };
}