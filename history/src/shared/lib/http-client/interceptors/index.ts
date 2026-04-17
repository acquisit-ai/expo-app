/**
 * 拦截器自动加载
 *
 * 导入顺序决定拦截器执行顺序：
 * 1. auth - 认证注入
 * 2. logging - 日志记录
 * 3. performance - 性能监控
 */

import './auth';
import './logging';
import './performance';
