/**
 * Supabase 认证事件自动同步到 entities/user
 *
 * 这是唯一修改 entities/user 数据的地方
 * 实现严格的单向数据流：Supabase → entities/user
 */

import { useEffect } from 'react';
import { supabase } from '@/features/auth/api/supabase';
import { useUserStore } from '@/entities/user/model/store';
import { log, LogType } from '@/shared/lib/logger';

/**
 * Supabase 认证事件自动同步 Hook
 * 在根布局中调用，确保整个应用生命周期内的认证状态同步
 */
export const useSupabaseAuthSync = () => {
  const setSession = useUserStore(state => state.setSession);

  useEffect(() => {
    log('auth-sync', LogType.INFO, '🔄 初始化 Supabase 认证自动同步');

    // 获取初始会话状态
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        log('auth-sync', LogType.ERROR, `❌ 获取初始会话失败: ${error.message}`);
        return;
      }

      log('auth-sync', LogType.INFO, `📱 初始会话状态: ${session ? '已登录' : '未登录'}`);
      setSession(session);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        log('auth-sync', LogType.INFO, `🔔 认证事件: ${event}, 会话: ${session ? '有效' : '无效'}`);

        // 直接同步到 entities/user，无需任何业务逻辑处理
        // 这是单向数据流的起点
        setSession(session);
      }
    );

    return () => {
      log('auth-sync', LogType.INFO, '🛑 取消 Supabase 认证同步');
      subscription.unsubscribe();
    };
  }, [setSession]);
};