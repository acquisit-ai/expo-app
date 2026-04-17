import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useVideoInfoDisplay } from '../hooks/VideoInfoDisplayContext';

export const VideoInfoSection = React.memo(function VideoInfoSection() {
  const { theme } = useTheme();

  // 从Context获取视频数据，不直接依赖entity
  const { videoMetadata } = useVideoInfoDisplay();

  // 如果没有视频数据，显示空状态
  if (!videoMetadata) {
    return null;
  }

  const dynamicStyles = React.useMemo(() => StyleSheet.create({
    contentContainer: {
      backgroundColor: theme.colors.background,
      minHeight: 600,
    },
    description: {
      marginBottom: 16,
      lineHeight: 20,
      color: theme.colors.onSurface,
    },
    tag: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  }), [theme]);

  const styles = StyleSheet.create({
    infoContainer: {
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 32,
    },
    title: {
      marginTop: 12,
      marginBottom: 12,
      fontWeight: '600',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
  });

  return (
    <View style={dynamicStyles.contentContainer}>
      <View style={styles.infoContainer}>
        <Text variant="headlineSmall" style={styles.title}>
          {videoMetadata.title}
        </Text>

        <Text variant="bodyMedium" style={dynamicStyles.description}>
          {videoMetadata.description}
        </Text>

        <View style={styles.tagsContainer}>
          {videoMetadata.tags.map((tag: string, index: number) => (
            <View key={index} style={dynamicStyles.tag}>
              <Text variant="labelSmall" style={dynamicStyles.tagText}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});