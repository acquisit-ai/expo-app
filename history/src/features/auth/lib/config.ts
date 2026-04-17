/**
 * 认证功能统一配置
 * 
 * 集中管理所有认证相关的配置常量和文案
 * 包括：冷却时间、Toast提示、UI文案、操作名称等
 * 提供类型安全的配置管理，便于统一修改和维护
 */

// ================================
// 系统配置常量
// ================================

/**
 * 冷却时间配置（秒）
 */
export const COOLDOWN_TIMES = {
  /** 发送验证码冷却时间 */
  SEND_CODE: 60,
  /** 验证操作冷却时间 */
  VERIFY: 3,
} as const;

/**
 * Toast 提示标题配置
 */
export const TOAST_TITLES = {
  // 错误提示
  LOGIN_FAILED: '登录失败',
  LOGIN_EXCEPTION: '登录异常',
  SEND_CODE_FAILED: '发送验证码失败',
  SEND_RESET_EMAIL_FAILED: '发送重置邮件失败',
  VERIFY_LOGIN_FAILED: '登录验证失败',
  VERIFY_RESET_FAILED: '重置验证失败',
  SET_PASSWORD_FAILED: '设置密码失败',
  RESET_PASSWORD_FAILED: '重置密码失败',
  LOGOUT_FAILED: '退出登录失败',
  VERIFY_FAILED: '验证异常',
  SET_PASSWORD_EXCEPTION: '设置密码异常',
  RESET_PASSWORD_EXCEPTION: '重置密码异常',

  // 成功提示
  CODE_SENT: '验证码已发送',
  RESET_EMAIL_SENT: '已发送',
  PASSWORD_SET_SUCCESS: '设置密码成功',
  PASSWORD_RESET_SUCCESS: '重置密码成功',

  // 警告提示
  SEND_TOO_FREQUENT: '发送过于频繁',
  OPERATION_TOO_FREQUENT: '操作过于频繁',
} as const;

/**
 * Toast 提示消息配置
 */
export const TOAST_MESSAGES = {
  // 验证码相关
  CHECK_EMAIL_AND_ENTER_CODE: '请检查您的邮箱并输入验证码',
  RESET_EMAIL_SENT_INFO: '如果该邮箱已注册，您将收到重置密码的验证码',
  CODE_INVALID_OR_EXPIRED: '验证码无效或已过期，请重新获取',

  // 密码设置相关
  PASSWORD_SET_SUCCESS_REDIRECT: '密码已设置，正在跳转到主应用...',
  PASSWORD_RESET_SUCCESS_REDIRECT: '密码已成功重置，正在跳转到主应用...',

  // 网络错误相关
  NETWORK_ERROR_LOCAL_LOGOUT: '网络错误，但已清除本地登录状态',
  SERVER_RESPONSE_EXCEPTION: '服务器响应异常，请重试',

  // 通用错误消息
  LOGIN_EXCEPTION_RETRY: '登录异常，请重试',
  VERIFY_EXCEPTION_RETRY: '验证异常，请重试',

  // 冷却相关
  WAIT_SECONDS_TO_RESEND: (seconds: number) => `请等待 ${seconds} 秒后重新发送`,
  WAIT_SECONDS_TO_RETRY: (seconds: number) => `请等待 ${seconds} 秒后重试`,
} as const;

/**
 * 操作名称配置
 */
export const OPERATION_NAMES = {
  LOGIN: '登录操作',
  SEND_OTP: '发送OTP',
  SEND_RESET_EMAIL: '发送密码重置邮件',
  LOGIN_VERIFICATION: '登录验证',
  RESET_VERIFICATION: '重置密码验证',
  SET_PASSWORD: '设置密码操作',
  RESET_PASSWORD: '重置密码操作',
} as const;

/**
 * 日志消息配置
 */
export const LOG_MESSAGES = {
  // 登录相关
  START_REAL_LOGIN: '开始真实登录',
  COMPONENT_UNMOUNTED_CANCEL_LOGIN: 'AuthOperations: 组件已卸载，取消登录操作',
  LOGIN_FLOW_END: 'AuthOperations: 登录流程结束',

  // 退出登录相关
  COMPONENT_UNMOUNTED_SKIP_LOGOUT: 'AuthOperations: 组件已卸载，跳过退出登录操作',

  // 验证相关
  START_VERIFICATION: (operation: string, additionalInfo: string = '') =>
    `开始${operation}${additionalInfo ? ` - ${additionalInfo}` : ''}`,

  // 密码相关
  SET_PASSWORD_FLOW_END: 'AuthOperations: 设置密码流程结束',
} as const;

// ================================
// UI 文案配置
// ================================

/**
 * 通用UI文案
 */
export const COMMON_TEXTS = {
  buttons: {
    confirm: '确认',
    cancel: '取消',
    back: '返回',
    loading: '处理中...',
  },
  placeholders: {
    email: '邮箱地址',
    password: '密码',
    confirmPassword: '确认密码',
    verificationCode: '验证码',
  }
} as const;

/**
 * 各卡片特定文案
 */
export const CARD_TEXTS = {
  login: {
    title: '登录',
    subtitle: '欢迎回来',
    icon: 'shield-checkmark',
    buttons: {
      signin: '登录',
      emailCodeLogin: '验证码登录',
    }
  },

  emailCode: {
    login: {
      title: '验证码登录/注册',
      subtitle: '未注册将自动创建账号',
      icon: 'mail-outline',
      buttons: {
        submit: '登录/注册',
      }
    },
    forgotPassword: {
      title: '忘记密码',
      subtitle: '验证邮箱找回密码',
      icon: 'key-outline',
      buttons: {
        submit: '验证',
      }
    }
  },

  password: {
    reset: {
      title: '重置密码',
      subtitle: '至少8位，包含数字、大小写字母',
      icon: 'lock-closed-outline',
      buttons: {
        submit: '确认重置',
      }
    },
    set: {
      title: '设置密码',
      subtitle: '至少8位，包含数字、大小写字母',
      icon: 'lock-closed-outline',
      buttons: {
        submit: '确认设置',
      }
    }
  }
} as const;

/**
 * UI 界面文本配置
 */
export const UI_TEXTS = {
  loading: {
    signin: '登录中...',
    verifying: '验证中...',
    sending: '发送中...',
  },
  validation: {
    failed: '验证失败',
    checkInput: '请检查表单输入内容',
    inputError: '输入错误',
  },
  actions: {
    forgotPasswordClick: '点击忘记密码链接，导航到忘记密码页面'
  }
} as const;

/**
 * 表单字段标签配置
 */
export const FIELD_LABELS = {
  email: '邮箱',
  password: '密码',
  confirmPassword: '确认密码',
  name: '姓名',
  phone: '手机号',
  code: '验证码',
} as const;

// ================================
// 统一配置对象
// ================================

/**
 * 认证配置类型
 */
export type AuthConfigType = {
  cooldownTimes: typeof COOLDOWN_TIMES;
  toastTitles: typeof TOAST_TITLES;
  toastMessages: typeof TOAST_MESSAGES;
  operationNames: typeof OPERATION_NAMES;
  logMessages: typeof LOG_MESSAGES;
  uiTexts: typeof UI_TEXTS;
  fieldLabels: typeof FIELD_LABELS;
};

/**
 * 统一的认证配置对象
 * 提供所有认证相关的配置和文案
 */
export const AuthConfig: AuthConfigType = {
  cooldownTimes: COOLDOWN_TIMES,
  toastTitles: TOAST_TITLES,
  toastMessages: TOAST_MESSAGES,
  operationNames: OPERATION_NAMES,
  logMessages: LOG_MESSAGES,
  uiTexts: UI_TEXTS,
  fieldLabels: FIELD_LABELS,
} as const;