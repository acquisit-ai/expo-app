/**
 * 视频 Feed 项
 *
 * 对应真实场景中后端返回的 feed 数据结构
 */
export interface VideoItem {
  metaId: string;      // 视频唯一标识（模拟后端数据库 ID）
  video_url: string;   // 视频播放 URL
}

const baseVideos = [
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/public-vedios/1_hls/playlist.m3u8',
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/public-vedios/2_hls/playlist.m3u8',
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/public-vedios/3_hls/playlist.m3u8',
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/public-vedios/4_hls/playlist.m3u8',
  },
];

/**
 * 模拟 feed 列表
 *
 * 循环20次生成80个视频 feed 项
 * 每个 feed 项都有唯一的 metaId（模拟后端返回的数据）
 *
 * 真实场景中，这些数据来自后端 API：
 * const feedList = await fetchFeedAPI();
 * feedList.map(item => ({ metaId: item.metaId, video_url: item.videoUrl }))
 */
export const videoData: VideoItem[] = Array.from({ length: 20 }, (_, batchIndex) =>
  baseVideos.map((video, videoIndex) => ({
    metaId: `video-${batchIndex}-${videoIndex}`,  // 模拟后端的 metaId
    ...video,
  }))
).flat();
