import { useCallback } from 'react';
import { useModal } from 'react-native-modalfy';
import type { NativePickerModalParams } from './types';

export function useNativePickerModal<Value extends string | number>() {
  const { openModal } = useModal();

  return useCallback((params: NativePickerModalParams<Value>) => {
    openModal('NativePickerModal', params);
  }, [openModal]);
}
