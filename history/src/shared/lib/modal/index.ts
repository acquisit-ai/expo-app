/**
 * Modal系统导出
 * 提供统一的Modal功能接口
 */

// Provider
export { ModalProvider } from './provider/ModalProvider';

// Hooks
export { useModal } from 'react-native-modalfy';

// Config
export {
  createModalStack,
  defaultModalOptions,
  Dimensions,
  Easing
} from './config/createModalStack';

export { NativePickerModal, useNativePickerModal } from './native-picker';
export type { NativePickerModalParams } from './native-picker';

// Re-export modalfy types
export type {
  ModalComponentProp,
  ModalComponentWithOptions,
  ModalEventCallback,
  ModalEventListener,
  ModalOptions,
  ModalStackConfig
} from 'react-native-modalfy';
