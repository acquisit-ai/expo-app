/**
 * 页面焦点状态 Hook
 *
 * 用于跟踪 React Navigation 页面的焦点状态
 * 自动处理焦点获得和失去事件
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * 页面焦点状态 Hook
 *
 * @returns isFocused - 当前页面是否聚焦
 *
 * @example
 * ```typescript
 * function MyPage() {
 *   const isFocused = useFocusState();
 *
 *   // 只在页面聚焦时启用某些功能
 *   useBackHandler(handleBack, isFocused);
 *
 *   return <View>...</View>;
 * }
 * ```
 */
export function useFocusState(): boolean {
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  return isFocused;
}
