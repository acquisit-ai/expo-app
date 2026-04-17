/**
 * Modal Provider封装
 * 提供全局Modal管理功能
 */

import React from 'react';
import { ModalProvider as RNModalProvider, ModalStack, ModalfyParams } from 'react-native-modalfy';

interface ModalProviderProps<P extends ModalfyParams = ModalfyParams> {
  children: React.ReactNode;
  stack: ModalStack<P>; // Modal stack配置，使用正确的类型
}

/**
 * Modal Provider组件
 * 封装react-native-modalfy的Provider
 */
export function ModalProvider<P extends ModalfyParams = ModalfyParams>({ children, stack }: ModalProviderProps<P>) {
  return (
    <RNModalProvider stack={stack}>
      {children}
    </RNModalProvider>
  );
}

export default ModalProvider;