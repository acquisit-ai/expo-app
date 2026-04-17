import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { IconButton } from '@/shared/ui/IconButton';
import { LAYOUT_CONSTANTS } from '@/shared/config/layout-constants';
import { useVideoInteraction } from '../hooks/VideoInteractionContext';

export const VideoInteractionBar = React.memo(function VideoInteractionBar() {
  const { theme } = useTheme();

  // 从专用Context获取交互状态
  const {
    isLiked,
    isFavorited,
    showSubtitles,
    showTranslation,
    toggleLike,
    toggleFavorite,
    toggleSubtitles,
    toggleTranslation
  } = useVideoInteraction();

  const dynamicStyles = React.useMemo(() => StyleSheet.create({
    controlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      height: LAYOUT_CONSTANTS.CONTROL_BAR_HEIGHT,
    },
  }), [theme]);

  return (
    <View style={dynamicStyles.controlBar}>
      <IconButton
        iconName="heart"
        iconNameOutline="heart-outline"
        isActive={isLiked}
        onPress={toggleLike}
        activeColor={theme.colors.error}
        iconLibrary="Ionicons"
      />

      <IconButton
        iconName="star"
        iconNameOutline="star-outline"
        isActive={isFavorited}
        onPress={toggleFavorite}
        activeColor={theme.colors.warning}
        iconLibrary="MaterialCommunityIcons"
      />

      <IconButton
        iconName="translate"
        isActive={showTranslation}
        onPress={toggleTranslation}
        activeColor={theme.colors.primary}
        iconLibrary="MaterialCommunityIcons"
      />

      <IconButton
        iconName="subtitles"
        iconNameOutline="subtitles-outline"
        isActive={showSubtitles}
        onPress={toggleSubtitles}
        activeColor={theme.colors.primary}
        iconLibrary="MaterialCommunityIcons"
      />
    </View>
  );
});