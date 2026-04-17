import { z } from 'zod';

/**
 * 标准化邮箱地址
 * @param email 原始邮箱地址
 * @returns 清理并标准化后的邮箱地址
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * 标准化验证码
 * @param code 原始验证码
 * @returns 清理后的验证码
 */
export const normalizeCode = (code: string): string => {
  return code.trim();
};

/**
 * 标准化密码
 * @param password 原始密码
 * @returns 清理后的密码
 */
export const normalizePassword = (password: string): string => {
  return password.trim();
};

/**
 * 邮箱验证 Schema - 可重用的邮箱验证逻辑
 */
export const emailValidationSchema = z
  .string({ message: "邮箱不能为空" })
  .min(1, { message: "邮箱不能为空" })
  .email({ message: "请输入有效的邮箱地址" })
  .transform(normalizeEmail);

/**
 * 验证码验证 Schema - 可重用的验证码验证逻辑
 */
export const codeValidationSchema = z
  .string({ message: "验证码不能为空" })
  .min(1, { message: "验证码不能为空" })
  .length(6, { message: "验证码必须是 6 位" })
  .regex(/^\d+$/, { message: "验证码必须全部是数字" })
  .transform(normalizeCode);

/**
 * 密码验证 Schema - 可重用的基础密码验证逻辑
 */
export const passwordValidationSchema = z
  .string({ message: "密码不能为空" })
  .min(1, { message: "密码不能为空" })
  .min(8, { message: "密码至少需要8个字符" })
  .transform(normalizePassword);

/**
 * 强密码验证 Schema - 用于重置密码等需要强密码的场景
 */
export const strongPasswordValidationSchema = z
  .string({ message: "密码不能为空" })
  .min(1, { message: "密码不能为空" })
  .min(8, { message: "密码至少 8 位" })
  // 要求包含数字
  .regex(/[0-9]/, { message: "密码必须包含数字" })
  // 要求包含大写字母
  .regex(/[A-Z]/, { message: "密码必须包含大写字母" })
  // 要求包含小写字母
  .regex(/[a-z]/, { message: "密码必须包含小写字母" })
  .transform(normalizePassword);

/**
 * 登录表单验证 Schema
 * 定义邮箱和密码的验证规则
 */
export const loginSchema = z.object({
  // 邮箱验证
  email: emailValidationSchema,

  // 密码验证
  password: passwordValidationSchema
});

/**
 * 验证码登录表单验证 Schema
 * 定义邮箱和验证码的验证规则
 */
export const emailCodeSchema = z.object({
  // 邮箱验证（与登录表单相同）
  email: emailValidationSchema,

  // 验证码验证
  code: codeValidationSchema
});

/**
 * 重置密码表单验证 Schema
 * 定义新密码和确认密码的验证规则
 */
export const resetPasswordSchema = z.object({
  password: strongPasswordValidationSchema,
  confirmPassword: z.string({ message: "请确认密码" })
    .min(1, { message: "请确认密码" })
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "两次输入的密码不一致",
      path: ["confirmPassword"],
    });
  }
});

/**
 * 登录数据类型
 * 从 Schema 推断出的类型定义
 */
export type AuthLoginData = z.infer<typeof loginSchema>;

/**
 * 验证码登录表单数据类型
 * 从 Schema 推断出的类型定义
 */
export type EmailCodeFormData = z.infer<typeof emailCodeSchema>;

/**
 * 重置密码表单数据类型
 * 从 Schema 推断出的类型定义
 */
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;