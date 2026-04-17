/**
 * 字幕显示 Context
 *
 * 提供feature级别的字幕显示状态管理
 * 只有IntegratedSubtitleView与外部hook/entity耦合，其他组件通过context获取数据
 */

import React, { createContext, useContext } from 'react';
import type {
  SubtitleDisplayState,
  SubtitleDisplayActions,
  SubtitleDisplayConfig
} from '../model/types';

/**
 * 字幕显示上下文类型
 */
export interface SubtitleDisplayContextType {
  /** 显示状态 */
  state: SubtitleDisplayState;
  /** 导航控制 */
  actions: SubtitleDisplayActions;
  /** 当前配置 */
  config: SubtitleDisplayConfig;
  /** 主题相关 */
  theme: {
    colors: {
      onSurface: string;
      outline: string;
      surface: string;
    };
  };
}

/**
 * 字幕显示上下文
 */
const SubtitleDisplayContext = createContext<SubtitleDisplayContextType | undefined>(undefined);

/**
 * 字幕显示上下文提供者Props
 */
export interface SubtitleDisplayProviderProps {
  children: React.ReactNode;
  value: SubtitleDisplayContextType;
}

/**
 * 字幕显示上下文提供者
 */
export function SubtitleDisplayProvider({ children, value }: SubtitleDisplayProviderProps) {
  return (
    <SubtitleDisplayContext.Provider value={value}>
      {children}
    </SubtitleDisplayContext.Provider>
  );
}

/**
 * 使用字幕显示上下文的Hook
 */
export function useSubtitleDisplayContext(): SubtitleDisplayContextType {
  const context = useContext(SubtitleDisplayContext);

  if (!context) {
    throw new Error('useSubtitleDisplayContext must be used within a SubtitleDisplayProvider');
  }

  return context;
}
