/**
 * User Entity 公共 API - 重构版
 *
 * 导出纯粹的用户数据管理接口
 * 遵循 FSD 架构原则：entities 层只管理数据，不含业务逻辑
 */

// ========== 数据存储导出 ==========
export { useUserStore } from './model/store';

// ========== 类型导出 ==========
export type {
  UserMetadata,
  AppMetadata
} from './model/types';

// ========== 纯数据选择器导出 ==========
export {
  // 基础数据选择器
  useSession,
  useUser,
  useUserId,
  useUserEmail,

  // 认证状态选择器
  useIsAuthenticated,
  useHasPassword,
  useAuthProvider,
  useIsAuthInitialized,

  // 令牌选择器
  useAccessToken,
  useRefreshToken,
  useTokenExpiry,

  // 元数据选择器
  useLastSignInAt,
  useUserCreatedAt,
  useLastUpdated,

  // 组合选择器
  useAuthStatus,
  useUserProfile,
  useTokenInfo,
  useUserSnapshot,
} from './hooks/selectors';

// ========== 设计说明 ==========
//
// 此 entity 只负责数据管理，不包含：
// - 业务逻辑（移至 features/auth）
// - API 调用（移至 features/auth/api）
// - 表单验证（移至 features/auth/model）
// - UI 状态管理（移至各组件本地状态）
//
// 数据流：
// Supabase Events → useSupabaseAuthSync → UserStore → Components