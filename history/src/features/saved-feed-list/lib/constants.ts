import { Dimensions } from 'react-native';
import { tabBar } from '@/shared/config/theme';
import { blurism } from '@/shared/config/theme/blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SAVED_FEED_LIST_CONSTANTS = {
  itemGap: screenWidth * 0.05,
  cardWidthRatio: 0.9,
  cardAspectRatio: 16 / 9,
  cardContentPadding: blurism.components.card.padding.md,
  cardContentTextHeight: 18,

  get cardHeight() {
    const cardWidth = screenWidth * this.cardWidthRatio;
    const imageHeight = cardWidth / this.cardAspectRatio;
    const contentHeight = this.cardContentPadding * 2 + this.cardContentTextHeight;
    return imageHeight + contentHeight;
  },

  get itemHeight() {
    return this.cardHeight + this.itemGap;
  },

  tabBarBottom: screenHeight * 0.0168,
  get tabBarSpace() {
    return this.tabBarBottom + tabBar.height;
  },
  get bottomPadding() {
    return this.tabBarSpace + screenHeight * 0.02;
  },

  flatListConfig: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 21,
    scrollEventThrottle: 16,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
  },

  get contentStyle() {
    return {
      paddingTop: this.itemGap,
      paddingBottom: this.bottomPadding,
      alignItems: 'center' as const,
    };
  },
};
