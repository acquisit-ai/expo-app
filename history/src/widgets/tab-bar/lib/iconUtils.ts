/**
 * TabBar 图标工具函数
 */

import React from 'react';
import { IoniconsName, TAB_ICON_MAP, DEFAULT_TAB_ICON } from '../config/tabConfig';
import { TabIconGetter } from '../types';

/**
 * 获取指定路由的图标名称
 * @param routeName 路由名称
 * @param focused 是否为激活状态
 * @returns Ionicons 图标名称
 */
export const getTabIcon: TabIconGetter = (routeName: string, focused: boolean): IoniconsName => {
  const iconSet = TAB_ICON_MAP[routeName] ?? DEFAULT_TAB_ICON;
  return focused ? iconSet.focused : iconSet.outline;
};

/**
 * 获取 Tab 标签文本
 * @param options 路由选项
 * @param routeName 路由名称
 * @returns 标签文本
 */
export const getTabLabel = (
  options: { 
    tabBarLabel?: string | ((props: { focused: boolean; color: string; position: any; children: string; }) => React.ReactNode);
    title?: string;
  },
  routeName: string
): string => {
  if (options.tabBarLabel !== undefined) {
    return typeof options.tabBarLabel === 'string' ? options.tabBarLabel : routeName;
  }
  
  if (options.title !== undefined) {
    return options.title;
  }
  
  return routeName;
};