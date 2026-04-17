/**
 * 网络状态检测工具
 *
 * 职责：
 * - 检测网络连接状态
 * - 检测互联网可达性
 * - 提供网络错误抛出
 */

import NetInfo from '@react-native-community/netinfo';
import { ApiError } from '../core/types';

/**
 * 检查网络状态
 * 如果网络不可用，抛出相应的 ApiError
 */
export async function checkNetworkState(): Promise<void> {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new ApiError('网络未连接', 0, 'NETWORK_OFFLINE');
  }

  if (state.isInternetReachable === false) {
    throw new ApiError('无法访问互联网', 0, 'NETWORK_UNREACHABLE');
  }
}

/**
 * 获取当前网络状态信息（用于调试）
 */
export async function getNetworkInfo() {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
    details: state.details,
  };
}
