/**
 * 环境配置管理
 *
 * 集中管理应用的环境变量和运行环境检测
 * 提供统一的接口来判断当前运行环境
 */

import { log, LogType } from '../lib/logger';

/**
 * 环境类型枚举
 */
export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production'
}


/**
 * 环境配置类
 */
class EnvironmentConfig {
  private readonly nodeEnv: string;
  private readonly isDev: boolean;
  private readonly currentEnvironment: Environment;

  constructor() {
    // 读取环境变量，优先使用 EXPO_PUBLIC_NODE_ENV
    this.nodeEnv = process.env.EXPO_PUBLIC_NODE_ENV || 'production';

    // 兼容 React Native 的 __DEV__ 标志
    this.isDev = __DEV__ || this.nodeEnv === Environment.Development;

    // 初始化时计算环境
    this.currentEnvironment = this.determineEnvironment();

    // 初始化时自动检查环境变量
    this.checkEnvironmentVariables();

    // 初始化时记录环境信息（确保检查完成后再记录）
    this.logEnvironment();
  }

  /**
   * 确定当前环境
   */
  private determineEnvironment(): Environment {
    switch (this.nodeEnv.toLowerCase()) {
      case 'development':
      case 'dev':
        return Environment.Development;
      case 'staging':
      case 'stage':
        return Environment.Staging;
      case 'production':
      case 'prod':
        return Environment.Production;
      default:
        log('environment', LogType.WARNING, `未知环境: ${this.nodeEnv}, 默认使用 production`);
        return Environment.Production;
    }
  }

  /**
   * 是否为开发环境
   */
  isDevelopment(): boolean {
    return this.isDev;
  }

  /**
   * 是否为生产环境
   */
  isProduction(): boolean {
    return this.currentEnvironment === Environment.Production && !this.isDev;
  }


  /**
   * 获取环境特定的配置
   */
  getConfig() {
    return {
      environment: this.currentEnvironment,
      isDevelopment: this.isDevelopment(),
      isProduction: this.isProduction(),
      features: {
        devTools: this.isDevelopment(),
      },
      // API 配置
      api: this.getApiConfig(),
      // Supabase 配置
      supabase: this.getSupabaseConfig(),
    };
  }

  /**
   * 获取 Supabase 配置
   */
  getSupabaseConfig() {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      log('environment', LogType.WARNING,
        `Supabase 配置缺失 - URL: ${!!url}, AnonKey: ${!!anonKey}`);
    }

    return {
      url: url || '',
      anonKey: anonKey || '',
      isConfigured: !!(url && anonKey),
    };
  }

  /**
   * 获取 API 配置
   */
  private getApiConfig() {
    switch (this.currentEnvironment) {
      case Environment.Development:
        const host = process.env.EXPO_PUBLIC_API_DEV_HOST;
        const port = process.env.EXPO_PUBLIC_API_DEV_PORT;
        return {
          baseUrl: host && port ? `http://${host}:${port}` : 'http://localhost:8000',
        };

      case Environment.Staging:
        return {
          baseUrl: process.env.EXPO_PUBLIC_API_STAGING_BASE_URL || 'https://api-staging.example.com',
        };

      case Environment.Production:
        return {
          baseUrl: process.env.EXPO_PUBLIC_API_PROD_BASE_URL || 'https://api.example.com',
        };

      default:
        return {
          baseUrl: 'https://api.example.com',
        };
    }
  }

  /**
   * 记录当前环境信息
   */
  private logEnvironment() {
    const config = this.getConfig();
    log('environment', LogType.INFO,
      `环境配置完成 - 模式: ${config.environment}, 开发模式: ${config.isDevelopment}, ` +
      `DevTools: ${config.features.devTools}`
    );
  }

  /**
   * .env 中期望的环境变量列表
   */
  private readonly EXPECTED_ENV_VARS = [
    'EXPO_PUBLIC_NODE_ENV',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_API_DEV_HOST',
    'EXPO_PUBLIC_API_DEV_PORT',
    'EXPO_PUBLIC_API_STAGING_BASE_URL',
    'EXPO_PUBLIC_API_PROD_BASE_URL'
  ] as const;

  /**
   * 简单检查环境变量是否可读
   */
  checkEnvironmentVariables(): void {
    const unrecognized: string[] = [];

    for (const envName of this.EXPECTED_ENV_VARS) {
      const value = process.env[envName];
      if (value === undefined) {
        unrecognized.push(envName);
      }
    }

    if (unrecognized.length > 0 && this.isDevelopment()) {
      log('environment', LogType.WARNING, `未识别到的环境变量: ${unrecognized.join(', ')}`);
    }
  }

}

// 导出单例实例
const envConfig = new EnvironmentConfig();

// 导出环境判断函数
export const isDevelopment = () => envConfig.isDevelopment();
export const isProduction = () => envConfig.isProduction();

// 导出配置获取函数
export const getEnvironmentConfig = () => envConfig.getConfig();
export const getSupabaseConfig = () => envConfig.getSupabaseConfig();

// 导出环境变量检查函数
export const checkEnvironmentVariables = () => envConfig.checkEnvironmentVariables();