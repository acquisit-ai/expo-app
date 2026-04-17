import { createVideoPlayer, type VideoPlayer } from 'expo-video';
import { log, LogType } from '@/shared/lib/logger';
import { useVideoMetaStore } from '@/entities/video-meta';
import { useVideoStore } from '@/entities/video';
import type { PlayerMeta } from '@/shared/types';

const LOG_TAG = 'standalone-video';

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

async function releasePlayer(player: VideoPlayer | null | undefined): Promise<void> {
  if (!player) {
    return;
  }

  try {
    await player.pause();
  } catch (error) {
    log(LOG_TAG, LogType.WARNING, `Failed to pause standalone player: ${formatError(error)}`);
  }

  try {
    await player.replaceAsync(null);
  } catch (error) {
    log(LOG_TAG, LogType.WARNING, `Failed to reset standalone player source: ${formatError(error)}`);
  }

  try {
    player.release();
  } catch (error) {
    log(LOG_TAG, LogType.WARNING, `Failed to release standalone player: ${formatError(error)}`);
  }
}

export async function enterStandaloneVideo(videoId: string): Promise<PlayerMeta> {
  const videoMetaStore = useVideoMetaStore.getState();
  const videoMeta = videoMetaStore.getVideo(videoId);

  if (!videoMeta) {
    const error = new Error(`Video ${videoId} not found in meta store`);
    log(LOG_TAG, LogType.ERROR, error.message);
    throw error;
  }

  if (!videoMeta.video_url) {
    const error = new Error(`Video ${videoId} has no playable URL`);
    log(LOG_TAG, LogType.ERROR, error.message);
    throw error;
  }

  const videoStore = useVideoStore.getState();

  if (videoStore.playbackContext === 'standalone') {
    await releasePlayer(videoStore.currentPlayerMeta?.playerInstance ?? null);
    videoStore.clearCurrentVideo();
  } else if (videoStore.playbackContext === 'pool') {
    videoStore.clearCurrentVideo();
  }

  const player = createVideoPlayer(null);
  player.loop = false;
  player.muted = false;

  const source = {
    uri: videoMeta.video_url,
    contentType: 'hls' as const,
    useCaching: false,
  };

  log(LOG_TAG, LogType.INFO, `Preparing standalone player for video: ${videoId}`);

  await player.replaceAsync(source);

  const playerMeta: PlayerMeta = {
    videoId,
    playerInstance: player,
  };

  videoStore.setCurrentPlayerMeta(playerMeta, 'standalone');

  log(LOG_TAG, LogType.INFO, `Standalone player ready for video: ${videoId}`);

  return playerMeta;
}

export async function exitStandaloneVideo(): Promise<void> {
  const videoStore = useVideoStore.getState();

  if (videoStore.playbackContext !== 'standalone') {
    videoStore.clearCurrentVideo();
    return;
  }

  const player = videoStore.currentPlayerMeta?.playerInstance ?? null;

  await releasePlayer(player);

  videoStore.clearCurrentVideo();

  log(LOG_TAG, LogType.INFO, 'Standalone player released');
}
