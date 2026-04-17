import React, { useCallback, useMemo, useState } from 'react';
import type { ModalComponentProp, ModalComponentWithOptions } from 'react-native-modalfy';
import { NativePickerModalContent } from '@/shared/ui/NativePickerModalContent';
import type { NativePickerModalParams } from './types';
import type { AppModalStackParamsList } from '@/app/config/modal-registry';

type PickerModalProp = ModalComponentProp<
  AppModalStackParamsList,
  NativePickerModalParams,
  'NativePickerModal'
>;

export const NativePickerModal: ModalComponentWithOptions<PickerModalProp> = ({
  modal: { getParam, closeModal },
}) => {
  const title = getParam('title');
  const options = getParam('options');
  const value = getParam('value');
  const confirmText = getParam('confirmText', '完成');
  const cancelText = getParam('cancelText', '取消');
  const pickerHeight = getParam('pickerHeight', 170);
  const onSelect = getParam('onSelect', undefined);
  const onCancel = getParam('onCancel', undefined);

  const [currentValue, setCurrentValue] = useState(value);

  const handleChange = useCallback((newValue: typeof currentValue) => {
    setCurrentValue(newValue);
  }, []);

  const handleCancel = useCallback(() => {
    onCancel?.();
    closeModal();
  }, [closeModal, onCancel]);

  const handleConfirm = useCallback((selected: typeof currentValue) => {
    onSelect?.(selected);
    closeModal();
  }, [closeModal, onSelect]);

  const optionList = useMemo(() => options, [options]);

  return (
    <NativePickerModalContent
      title={title}
      options={optionList}
      value={currentValue}
      onChange={handleChange}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmText={confirmText}
      cancelText={cancelText}
      pickerHeight={pickerHeight}
    />
  );
};

NativePickerModal.modalOptions = NativePickerModalContent.modalOptions;
