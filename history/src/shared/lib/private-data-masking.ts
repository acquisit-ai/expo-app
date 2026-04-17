/**
 * 数据脱敏工具函数
 * 提供邮箱、手机号、用户ID等敏感数据的脱敏处理功能
 * 用于日志记录时保护用户隐私
 */

/**
 * 邮箱脱敏处理
 * 保护用户隐私，防止日志中暴露完整邮箱地址
 * 
 * @param email - 原始邮箱地址
 * @returns 脱敏后的邮箱地址
 * 
 * @example
 * maskEmail('user@example.com') => 'u***@example.com'
 * maskEmail('ab@test.com') => 'a***@test.com'
 * maskEmail('longusername@domain.com') => 'lon***@domain.com'
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '***';
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return '***@***';
  }

  const [localPart, domain] = parts;
  
  // 处理本地部分（@ 前面的部分）
  let maskedLocal: string;
  if (localPart.length <= 1) {
    maskedLocal = '***';
  } else if (localPart.length === 2) {
    maskedLocal = localPart[0] + '***';
  } else {
    // 显示前3个字符（如果超过3个字符）或前1个字符
    const visibleLength = Math.min(3, Math.max(1, Math.floor(localPart.length / 3)));
    maskedLocal = localPart.substring(0, visibleLength) + '***';
  }

  return `${maskedLocal}@${domain}`;
}

/**
 * 手机号脱敏处理
 * 
 * @param phone - 原始手机号
 * @returns 脱敏后的手机号
 * 
 * @example
 * maskPhone('13812345678') => '138****5678'
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '***';
  }

  if (phone.length < 7) {
    return '***';
  }

  const start = phone.substring(0, 3);
  const end = phone.substring(phone.length - 4);
  return `${start}****${end}`;
}

/**
 * 用户ID脱敏处理
 * 
 * @param userId - 原始用户ID
 * @returns 脱敏后的用户ID
 * 
 * @example
 * maskUserId('123e4567-e89b-12d3-a456-426614174000') => '123e****4000'
 */
export function maskUserId(userId: string | null | undefined): string {
  if (!userId || typeof userId !== 'string') {
    return '***';
  }

  if (userId.length < 8) {
    return '***';
  }

  const start = userId.substring(0, 4);
  const end = userId.substring(userId.length - 4);
  return `${start}****${end}`;
}