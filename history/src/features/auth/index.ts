/**
 * 认证功能模块统一导出 - 重构版
 *
 * 提供纯粹的认证业务逻辑API，遵循FSD架构原则
 * 不再包含用户数据管理（移至 entities/user）
 */

// API 模块
export * from './api';

// 工具库模块 (包含业务逻辑)
export * from './lib';

// 模型模块 (验证schemas等)
export * from './model';

// UI 组件模块
export * from './ui';

// 注意：
// - AuthProvider 已废弃，使用 useSupabaseAuthSync 替代
// - 用户数据管理已移至 entities/user
// - 认证操作使用 useAuthOperations