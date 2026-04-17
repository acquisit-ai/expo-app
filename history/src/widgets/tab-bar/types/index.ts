/**
 * TabBar 组件相关类型定义
 */

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { IoniconsName } from '../config/tabConfig';

/**
 * Tab 项属性接口
 */
export interface TabBarItemProps {
  /** 路由键值 */
  routeKey: string;
  /** 路由名称 */
  routeName: string;
  /** 标签文本 */
  label: string;
  /** 是否为当前激活状态 */
  isFocused: boolean;
  /** 点击事件处理器 */
  onPress: () => void;
  /** 图标名称 */
  iconName: IoniconsName;
  /** 图标颜色 */
  iconColor: string;
  /** 标签颜色 */
  labelColor: string;
}

/**
 * BlurTabBar 属性接口
 */
export interface BlurTabBarProps extends BottomTabBarProps {
  /** 自定义样式 */
  style?: object;
}

/**
 * Tab 图标获取器函数类型
 */
export type TabIconGetter = (routeName: string, focused: boolean) => IoniconsName;