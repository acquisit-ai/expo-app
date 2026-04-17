/**
 * 全局冷却管理器
 *
 * 职责：
 * - 提供全局统一的冷却管理
 * - 防止用户通过页面切换绕过冷却保护
 * - 确保整个应用范围内的冷却状态一致
 *
 * 使用场景：
 * - 验证码发送冷却
 * - API 调用频率限制
 * - 任何需要全局冷却保护的操作
 */

/**
 * 全局冷却管理器 - 单例模式
 * 确保整个应用范围内的冷却状态一致
 * 防止用户通过页面切换绕过冷却保护
 */
export class GlobalCooldownManager {
  private static instance: GlobalCooldownManager;
  private cooldowns = new Map<string, number>();

  /**
   * 冷却配置映射
   * 根据键名自动设置对应的冷却时间
   */
  private static readonly COOLDOWN_CONFIG = {
    sendCode: 60,  // 发送验证码：60秒
    verify: 3,     // 验证操作：3秒
  } as const;

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {}

  /**
   * 获取全局单例实例
   */
  static getInstance(): GlobalCooldownManager {
    if (!GlobalCooldownManager.instance) {
      GlobalCooldownManager.instance = new GlobalCooldownManager();
    }
    return GlobalCooldownManager.instance;
  }

  /**
   * 启动冷却
   * @param key 冷却键名
   * @param seconds 冷却时间（秒），如果不提供则使用配置的默认值
   */
  startCooldown(key: string, seconds?: number): void {
    const cooldownTime = seconds ?? GlobalCooldownManager.COOLDOWN_CONFIG[key as keyof typeof GlobalCooldownManager.COOLDOWN_CONFIG];

    if (cooldownTime === undefined) {
      throw new Error(`未配置的冷却键: ${key}，请在 COOLDOWN_CONFIG 中添加配置或手动指定冷却时间`);
    }

    this.cooldowns.set(key, Date.now() + cooldownTime * 1000);
  }

  /**
   * 获取剩余冷却时间
   * @param key 冷却键名
   * @returns 剩余冷却时间（秒），0表示冷却结束
   */
  getRemainingTime(key: string): number {
    const endTime = this.cooldowns.get(key);
    if (!endTime) return 0;

    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    if (remaining === 0) {
      this.cooldowns.delete(key); // 自动清理过期的冷却
    }
    return remaining;
  }

  /**
   * 检查是否在冷却中
   * @param key 冷却键名
   * @returns true表示仍在冷却中
   */
  isInCooldown(key: string): boolean {
    return this.getRemainingTime(key) > 0;
  }

  /**
   * 清除指定冷却
   * @param key 冷却键名
   */
  clearCooldown(key: string): void {
    this.cooldowns.delete(key);
  }

  /**
   * 清除所有冷却
   * 主要用于测试或特殊场景
   */
  clearAllCooldowns(): void {
    this.cooldowns.clear();
  }

  /**
   * 获取所有活跃的冷却信息
   * 主要用于调试
   */
  getActiveCooldowns(): Array<{ key: string; remainingTime: number }> {
    const result: Array<{ key: string; remainingTime: number }> = [];

    for (const [key] of this.cooldowns) {
      const remainingTime = this.getRemainingTime(key);
      if (remainingTime > 0) {
        result.push({ key, remainingTime });
      }
    }

    return result;
  }
}

/**
 * 获取全局冷却管理器实例的便捷函数
 */
export const getGlobalCooldown = () => GlobalCooldownManager.getInstance();