/**
 * Toast 管理器 - 核心服务逻辑 (重构版)
 * 通过依赖注入解决循环依赖，提升代码质量
 */

import React from 'react';
import { toast as BackpackToast, ToastOptions } from '@backpackapp-io/react-native-toast';
import type { 
  ToastConfig, 
  GlobalToastConfig, 
  ToastRenderer, 
  ToastId,
  ToastViewProps 
} from '../types';
import { 
  createToastId, 
  isValidToastConfig 
} from '../types';
import { DEFAULT_TOAST_CONFIG } from '../constants';

/**
 * Toast 管理器类 - 使用依赖注入模式
 */
export class ToastManager {
  private config: Required<GlobalToastConfig> = { ...DEFAULT_TOAST_CONFIG };
  private queue: ToastId[] = [];
  private renderer: ToastRenderer | null = null;

  /**
   * 设置 Toast 渲染器 - 依赖注入解决循环依赖
   * @param renderer Toast 渲染函数
   */
  public setRenderer(renderer: ToastRenderer): void {
    this.renderer = renderer;
  }

  /**
   * 更新全局配置
   * @param params 配置参数
   */
  public updateConfig(params: GlobalToastConfig): void {
    this.config = Object.freeze({ ...this.config, ...params });
  }

  /**
   * 获取当前配置（只读）
   */
  public getConfig(): Required<GlobalToastConfig> {
    return this.config;
  }

  /**
   * 显示 Toast
   * @param cfg Toast 配置
   * @returns Toast ID 或 null（失败时）
   */
  public show(cfg: ToastConfig): ToastId | null {
    try {
      // 验证配置
      if (!isValidToastConfig(cfg)) {
        throw new Error('Invalid toast configuration');
      }

      // 检查渲染器是否已设置
      if (!this.renderer) {
        throw new Error('Toast renderer not initialized. Call setRenderer() first.');
      }

      return this.showInternal(cfg);
    } catch (error) {
      console.error('[Toast] Failed to show toast:', error);
      return null;
    }
  }

  /**
   * 获取当前队列（只读）
   */
  public getQueue(): readonly ToastId[] {
    return Object.freeze([...this.queue]);
  }

  /**
   * 手动关闭指定 Toast
   * @param id Toast ID
   */
  public dismiss(id: ToastId): void {
    BackpackToast.dismiss(id);
    this.removeToast(id);
  }

  /**
   * 清空所有 Toast
   */
  public clear(): void {
    this.queue.forEach(id => BackpackToast.dismiss(id));
    this.queue = [];
  }

  /**
   * 内部显示逻辑
   * @private
   */
  private showInternal(cfg: ToastConfig): ToastId {
    const { title, message, type, duration } = cfg;
    const id = createToastId();

    const toastProps: ToastViewProps = {
      type,
      title,
      message,
      isDark: this.config.isDark,
      position: this.config.position,
    };

    const opts: ToastOptions = {
      duration: duration ?? this.config.defaultDuration,
      customToast: () => this.renderer!(toastProps),
      styles: {
        pressable: {
          alignSelf: 'center',
          left: null,
          paddingHorizontal: 16,
        },
      },
      onHide: (t) => this.removeToast(t.id as ToastId),
    };

    // 使用我们生成的 ID，但 BackpackToast.show 返回自己的 ID
    const backpackId = BackpackToast(title, opts);
    this.addToast(backpackId as ToastId);
    
    return backpackId as ToastId;
  }

  /**
   * 添加到队列
   * @private
   */
  private addToast(id: ToastId): void {
    this.queue.push(id);
    
    // 队列溢出处理
    if (this.queue.length > this.config.maxToasts) {
      const oldest = this.queue.shift();
      if (oldest) {
        BackpackToast.dismiss(oldest);
      }
    }
  }

  /**
   * 从队列移除
   * @private
   */
  private removeToast(id: ToastId): void {
    this.queue = this.queue.filter((queueId) => queueId !== id);
  }
}