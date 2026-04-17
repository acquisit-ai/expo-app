import React, { useCallback, useMemo, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { TabPageLayout, BlurCard } from '@/shared/ui';
import { useForceStatusBarStyle } from '@/shared/hooks/useForceStatusBarStyle';
import { spacing, tabBar } from '@/shared/config/theme';
import type { ThemeColors } from '@/shared/config/theme';
import {
  WordCollectionList,
  useWordCollectionList,
  WORD_COLLECTION_SORT_OPTIONS,
  type WordCollectionSort,
} from '@/features/word-collection-list';
import { useNativePickerModal } from '@/shared/lib/modal';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/shared/navigation/types';

interface CollectionsRouteParams {
  collectionId?: string;
  title?: string;
}

export function CollectionsPage() {
  const route = useRoute();
  const params = (route.params as CollectionsRouteParams) ?? {};
  const collectionId = params.collectionId ?? 'default';
  const headerTitle = params.title ?? '我的词汇本';

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // 状态栏跟随 App 主题
  useForceStatusBarStyle('auto');

  const {
    items,
    sortedItems,
    isLoading,
    isRefreshing,
    error,
    lastSyncedAt,
    onRefresh,
    sort,
    setSort,
  } = useWordCollectionList({ collectionId });

  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const listBottomPadding = useMemo(() => {
    const tabBarBottom = screenHeight * 0.0168;
    const tabSpace = tabBarBottom + tabBar.height;
    const relativeMin = screenHeight * 0.05;
    const base = Math.max(tabSpace, relativeMin);
    return base + screenHeight * 0.02 + insets.bottom;
  }, [screenHeight, insets.bottom]);

  const horizontalPadding = useMemo(() => screenWidth * 0.05, [screenWidth]);

  const openNativePicker = useNativePickerModal<WordCollectionSort>();

  const currentSortOption = useMemo(() => (
    WORD_COLLECTION_SORT_OPTIONS.find(option => option.value === sort) ?? WORD_COLLECTION_SORT_OPTIONS[0]
  ), [sort]);

  const lastSortPressRef = useRef<number>(0);

  const handleSortPress = useCallback(() => {
    const now = Date.now();
    if (now - lastSortPressRef.current < 500) {
      return;
    }

    lastSortPressRef.current = now;
    Haptics.selectionAsync();
    openNativePicker({
      title: '选择排序方式',
      options: WORD_COLLECTION_SORT_OPTIONS,
      value: sort,
      onSelect: setSort,
      pickerHeight: 170,
    });
  }, [openNativePicker, sort, setSort]);

  const handleItemPress = useCallback((itemId: string) => {
    navigation.navigate('WordCollectionDetail', { id: itemId });
  }, [navigation]);

  const headerComponent = useMemo(() => (
    <>
      <BlurCard style={styles.headerCard} widthRatio={1} padding="lg" borderRadius={12}>
        <Text variant="titleLarge" style={styles.headerTitle}>
          {headerTitle}
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          共 {items.length} 个单词
        </Text>
        {lastSyncedAt && (
          <Text variant="bodySmall" style={styles.headerMeta}>
            上次同步：{formatDateTime(lastSyncedAt)}
          </Text>
        )}
        {error && (
          <Text variant="bodySmall" style={styles.errorText}>
            加载失败：{error}
          </Text>
        )}
      </BlurCard>
      <View style={styles.sortButtonRow}>
        <Pressable
          onPress={handleSortPress}
          style={({ pressed }) => [
            styles.sortButton,
            pressed && styles.sortButtonPressed,
          ]}
        >
          <Text style={styles.sortButtonLabel}>{currentSortOption.label}</Text>
          <Text style={styles.sortButtonArrow}>▼</Text>
        </Pressable>
      </View>
    </>
  ), [
    styles.headerCard,
    styles.headerTitle,
    styles.headerSubtitle,
    styles.headerMeta,
    styles.errorText,
    styles.sortButtonRow,
    styles.sortButton,
    styles.sortButtonPressed,
    styles.sortButtonLabel,
    styles.sortButtonArrow,
    headerTitle,
    items.length,
    lastSyncedAt,
    error,
    currentSortOption.label,
    handleSortPress,
  ]);

  return (
    <TabPageLayout scrollable={false} contentStyle={styles.layoutContent}>
      <WordCollectionList
        items={sortedItems}
        loading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        onRefresh={onRefresh}
        onItemPress={(item) => handleItemPress(item.id)}
        headerComponent={headerComponent}
        contentPaddingBottom={listBottomPadding}
        contentPaddingHorizontal={horizontalPadding}
      />
    </TabPageLayout>
  );
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    layoutContent: {
      flex: 1,
    },
    headerCard: {
      alignSelf: 'center',
      width: '100%',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    sortButtonRow: {
      width: '100%',
      alignItems: 'flex-end',
      marginBottom: spacing.md,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
      minWidth: 200,
    },
    sortButtonPressed: {
      opacity: 0.9,
    },
    sortButtonLabel: {
      color: colors.textMedium,
      fontSize: 14,
      fontWeight: '500',
    },
    sortButtonArrow: {
      marginLeft: spacing.xs,
      color: colors.textMedium,
      fontSize: 12,
    },
    headerTitle: {
      color: colors.onSurface,
      fontWeight: '600',
    },
    headerSubtitle: {
      color: colors.textMedium,
    },
    headerMeta: {
      color: colors.textMedium,
      opacity: 0.8,
    },
    errorText: {
      marginTop: spacing.sm,
      color: colors.error,
    },
  });
