/**
 * 时间格式化工具函数集合
 * 提供统一的时间显示格式
 */

/**
 * 将秒数格式化为时间字符串
 * 自动选择合适的格式：MM:SS 或 HH:MM:SS
 *
 * @param seconds 秒数
 * @returns 格式化的时间字符串
 *
 * @example
 * formatTime(65) // "1:05"
 * formatTime(3665) // "1:01:05"
 * formatTime(0) // "0:00"
 */
export function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * 将秒数格式化为详细的时间字符串（始终显示小时）
 * 格式：HH:MM:SS
 *
 * @param seconds 秒数
 * @returns 格式化的时间字符串
 *
 * @example
 * formatTimeDetailed(65) // "0:01:05"
 * formatTimeDetailed(3665) // "1:01:05"
 */
export function formatTimeDetailed(seconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 将秒数格式化为紧凑的时间字符串
 * 仅在需要时显示小时，使用较短的格式
 *
 * @param seconds 秒数
 * @returns 格式化的时间字符串
 *
 * @example
 * formatTimeCompact(65) // "1:05"
 * formatTimeCompact(30) // "0:30"
 * formatTimeCompact(3665) // "1h 1m"
 */
export function formatTimeCompact(seconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    // 对于超过1小时的视频，显示小时和分钟
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    // 对于小于1小时的视频，显示分钟和秒
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * 解析时间字符串为秒数
 * 支持 MM:SS 和 HH:MM:SS 格式
 *
 * @param timeString 时间字符串
 * @returns 秒数，解析失败返回0
 *
 * @example
 * parseTime("1:05") // 65
 * parseTime("1:01:05") // 3665
 * parseTime("invalid") // 0
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(part => parseInt(part, 10));

  if (parts.length === 2 && parts.every(part => !isNaN(part))) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3 && parts.every(part => !isNaN(part))) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}