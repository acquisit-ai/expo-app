/**
 * Feed List 配置常量
 *
 * 包含 FlatList 优化配置和样式常量
 */

import { Dimensions } from 'react-native';
import { tabBar } from '@/shared/config/theme';
import { blurism } from '@/shared/config/theme/blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FEED_CONSTANTS = {
  // 间距配置
  itemGap: screenWidth * 0.05, // 列表项间距

  // 卡片尺寸配置
  cardWidthRatio: 0.9, // 卡片宽度占屏幕宽度的比例
  cardAspectRatio: 16 / 9, // 视频缩略图宽高比
  cardContentPadding: blurism.components.card.padding.md, // 内容区域 padding (20px)
  cardContentTextHeight: 18, // 标题文字行高

  // 🔑 关键：动态计算卡片总高度（图片 + 内容）
  get cardHeight() {
    const cardWidth = screenWidth * this.cardWidthRatio;
    const imageHeight = cardWidth / this.cardAspectRatio;
    const contentHeight = this.cardContentPadding * 2 + this.cardContentTextHeight;
    return imageHeight + contentHeight;
  },

  // 🔑 关键：卡片 + 间距的总高度（用于 scrollToOffset 计算）
  get itemHeight() {
    return this.cardHeight + this.itemGap;
  },

  // TabBar 空间计算
  tabBarBottom: screenHeight * 0.0168, // 与 BlurTabBar 保持一致
  get tabBarSpace() {
    return this.tabBarBottom + tabBar.height;
  },
  get bottomPadding() {
    return this.tabBarSpace + (screenHeight * 0.02); // 额外缓冲
  },

  // FlatList 优化配置（基于 React Native 官方最佳实践）
  flatListConfig: {
    // 核心性能优化
    removeClippedSubviews: true,        // 移除视口外视图（减少主线程压力）
    maxToRenderPerBatch: 10,             // 官方默认值，平衡渲染和响应性
    updateCellsBatchingPeriod: 50,      // 官方默认值，50ms批处理间隔
    initialNumToRender: 10,              // 官方默认值，确保首屏快速渲染
    windowSize: 21,                      // 官方默认值，适合大多数场景

    // 滚动体验
    scrollEventThrottle: 16,            // 60fps 滚动事件
    showsVerticalScrollIndicator: false, // 隐藏滚动条，更简洁

    // 交互优化
    keyboardShouldPersistTaps: 'handled' as const,
  },

  // 内容样式
  get contentStyle() {
    return {
      paddingTop: this.itemGap,
      paddingBottom: this.bottomPadding,
      alignItems: 'center' as const,
    };
  },

};