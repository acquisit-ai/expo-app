import React from 'react';
import { Separator } from '@/shared/ui';
import { AuthLoginCard, SocialLoginButtons } from '@/features/auth/ui';
import { log, LogType } from '@/shared/lib/logger';
import { AuthPageLayout } from './AuthPageLayout';

/**
 * 登录页面
 * 提供密码登录和社交登录功能
 */
export function LoginPage() {
  // 处理社交登录
  const handleSocialLogin = async (provider: string) => {
    log('auth', LogType.INFO, `社交登录 - 提供商: ${provider}`);
    // 社交登录功能待实现
  };

  return (
    <AuthPageLayout>
      <AuthLoginCard />
      <Separator text="or" spacing="md" />
      <SocialLoginButtons 
        onSocialLogin={handleSocialLogin}
        disabled={false}
      />
    </AuthPageLayout>
  );
}