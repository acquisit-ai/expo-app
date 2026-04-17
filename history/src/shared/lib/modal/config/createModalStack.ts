/**
 * Modal Stack创建工具
 * 用于创建和配置Modal栈
 */

import { createModalStack as createRNModalStack, ModalOptions, ModalStackConfig, ModalfyParams } from 'react-native-modalfy';
import { Dimensions, Easing } from 'react-native';

/**
 * 默认Modal配置选项
 */
export const defaultModalOptions: ModalOptions = {
  backdropOpacity: 0.5,
  transitionOptions: animatedValue => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, 1, 0.6],
    }),
    transform: [
      {
        perspective: 2000,
      },
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0.95, 1, 0.88],
        }),
      },
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [20, 0, -40],
        }),
      },
    ],
  }),
  animateInConfig: {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    duration: 100,
  },
  animateOutConfig: {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    duration: 250,
  },
};

/**
 * 创建Modal栈
 * @param config Modal配置对象
 * @param options 默认选项
 */
export function createModalStack<P extends ModalfyParams>(
  config: ModalStackConfig,
  options: ModalOptions = defaultModalOptions
) {
  return createRNModalStack<P>(config, options);
}

export { Dimensions, Easing };