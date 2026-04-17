/**
 * 共享库模块导出
 * 
 * 统一导出所有可复用的工具函数和服务
 */

// 响应式尺寸工具
export * from './metrics';

// 样式系统已迁移到 React Native Paper
// 使用 Paper 组件和 StyleSheet 替代自定义样式工具

// 日志工具
export {
  log,
  setLogLevel,
  getLogLevel,
  LogType
} from './logger';

// 数据脱敏工具
export { maskEmail, maskPhone, maskUserId } from './private-data-masking';

// 时间格式化工具
export { formatTime, formatTimeDetailed, formatTimeCompact, parseTime } from './time-format';

// Supabase 客户端已移至 @/features/auth/lib/supabase
// 认证相关功能应使用认证功能模块内的 supabase 实例