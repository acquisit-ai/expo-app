/**
 * Supabase 客户端配置 - React Native/Expo 专用
 *
 * 专为移动端优化，移除 web 相关配置
 * 参考：https://supabase.com/docs/guides/auth/quickstarts/react-native
 */

import { createClient, processLock } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { getSupabaseConfig } from '@/shared/config/environment';
import { log, LogType } from '@/shared/lib/logger';

// 获取 Supabase 配置
const supabaseConfig = getSupabaseConfig();

// 验证配置
if (!supabaseConfig.isConfigured) {
  throw new Error('Supabase 配置无效');
}

/**
 * Supabase 客户端实例 - React Native/Expo 专用配置
 *
 * 配置了：
 * - AsyncStorage 用于会话持久化
 * - processLock 防止并发认证操作
 * - 自动令牌刷新 + AppState 监听器（官方推荐）
 */
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock, // 防止并发认证操作
  },
});

/**
 * AppState 变化处理函数 - Supabase 官方推荐
 *
 * 告诉 Supabase Auth 在应用前台时持续自动刷新会话
 * 这确保在应用在前台时接收到 `onAuthStateChange` 事件
 * 如果用户会话终止，会收到 `TOKEN_REFRESHED` 或 `SIGNED_OUT` 事件
 */
export const handleAppStateChange = (state: AppStateStatus) => {
  if (state === 'active') {
    log('auth', LogType.DEBUG, 'Supabase: 应用激活，开始自动刷新');
    supabase.auth.startAutoRefresh();
  } else {
    log('auth', LogType.DEBUG, 'Supabase: 应用进入后台，停止自动刷新');
    supabase.auth.stopAutoRefresh();
  }
};

/**
 * 导出 Supabase 客户端实例，供其他模块使用
 */
export default supabase;