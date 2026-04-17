import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { SavedFeedController, SavedFeedKind } from './types';
import { getSavedFeedConfig } from './savedFeedConfigs';
import type { VideoMetaData } from '@/shared/types';
import type { RootStackParamList } from '@/shared/navigation/types';
import { enterStandaloneVideo, exitStandaloneVideo } from '@/features/standalone-video';
import { log, LogType } from '@/shared/lib/logger';
import { toast } from '@/shared/lib/toast';

export function useSavedFeedController(kind: SavedFeedKind): SavedFeedController {
  const config = useMemo(() => getSavedFeedConfig(kind), [kind]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const videoIds = config.dataSource.useIds();
  const loadingState = config.dataSource.useLoading();

  const initialize = useCallback(() => config.dataSource.initialize(), [config]);
  const loadMore = useCallback(() => config.dataSource.loadMore(), [config]);
  const refresh = useCallback(() => config.dataSource.refresh(), [config]);

  const handleStandalonePress = useCallback(async (video: VideoMetaData) => {
    try {
      log('saved-feed-controller', LogType.INFO,
        `Preparing standalone playback (kind=${kind}, video=${video.id})`);

      await enterStandaloneVideo(video.id);

      navigation.navigate('StandaloneVideoStack', {
        screen: 'StandaloneVideoFullscreen',
        params: {
          autoPlay: true,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log('saved-feed-controller', LogType.ERROR,
        `Failed to enter standalone video (${video.id}): ${message}`);

      await exitStandaloneVideo();

      toast.show({
        type: 'error',
        title: '无法播放视频',
        message: '请稍后重试',
        duration: 2500,
      });
    }
  }, [kind, navigation]);

  return {
    title: config.title,
    emptyState: config.emptyState,
    videoIds,
    loading: loadingState,
    initialize,
    loadMore,
    refresh,
    onItemPress: config.interactions?.onItemPress ?? handleStandalonePress,
    listEmptyComponent: config.listEmptyComponent,
  };
}
