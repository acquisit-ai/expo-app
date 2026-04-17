/**
 * 轻量级日志工具
 *
 * 零依赖、高性能的日志系统
 * 支持日志级别控制
 */

/**
 * 日志类型枚举（按优先级排序）
 */
export enum LogType {
  ERROR = 0,    // 最高优先级
  WARNING = 1,
  INFO = 2,
  DEBUG = 3     // 最低优先级
}

// 内部状态 - 设置为最详细级别，打印所有日志
let currentLogLevel = LogType.DEBUG;
let cachedTimestamp = '';
let lastTimestampCheck = 0;

// 性能优化：预计算常量
const EMOJI_MAP = ['🔴', '🟡', '🟢', '🔵'] as const;
const CONSOLE_METHODS = [console.error, console.warn, console.log, console.log] as const;

/**
 * 获取格式化时间戳（带缓存优化）
 */
function getTimestamp(): string {
  const now = Date.now();
  // 1秒内复用同一时间戳，减少格式化开销
  if (now - lastTimestampCheck > 1000) {
    cachedTimestamp = new Date(now).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    lastTimestampCheck = now;
  }
  return cachedTimestamp;
}

/**
 * 主要日志函数
 * @param source 来源标识 (如: 'auth', 'api', 'route', 'ui')
 * @param type 日志类型和优先级
 * @param message 日志信息
 */
export const log = (source: string, type: LogType, message: string): void => {
  // 早期返回优化：跳过不需要的日志
  if (type > currentLogLevel) return;
  
  const emoji = EMOJI_MAP[type];
  const timestamp = getTimestamp();
  const formatted = `[${timestamp}] [${source}] ${emoji} ${message}`;
  
  // 直接调用对应的控制台方法
  CONSOLE_METHODS[type](formatted);
};

/**
 * 设置日志级别
 * @param level 新的日志级别
 */
export const setLogLevel = (level: LogType): void => {
  currentLogLevel = level;
};

/**
 * 获取当前日志级别
 */
export const getLogLevel = (): LogType => currentLogLevel;


