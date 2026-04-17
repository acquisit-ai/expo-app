/**
 * TabBar 配置文件
 * 定义 Tab 图标映射和相关配置
 */

import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * Ionicons 图标名称类型
 */
export type IoniconsName = ComponentProps<typeof Ionicons>['name'];

/**
 * Tab 图标配置接口
 */
export interface TabIconConfig {
  /** 激活状态图标 */
  focused: IoniconsName;
  /** 未激活状态图标 */
  outline: IoniconsName;
}

/**
 * Tab 路由配置映射
 * 🔑 React Navigation 使用 PascalCase 路由名称
 */
export const TAB_ICON_MAP: Record<string, TabIconConfig> = {
  Collections: {
    focused: 'library',
    outline: 'library-outline'
  },
  Feed: {
    focused: 'sparkles',
    outline: 'sparkles-outline'
  },
  Profile: {
    focused: 'person',
    outline: 'person-outline'
  },
} as const;

/**
 * 默认图标配置（用于未知路由）
 */
export const DEFAULT_TAB_ICON: TabIconConfig = {
  focused: 'ellipse',
  outline: 'ellipse-outline',
} as const;

