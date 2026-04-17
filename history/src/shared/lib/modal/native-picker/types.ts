import type { PickerOption } from '@/shared/ui/NativePickerModalContent';

export interface NativePickerModalParams<Value extends string | number = string> {
  title: string;
  options: readonly PickerOption<Value>[];
  value: Value;
  confirmText?: string;
  cancelText?: string;
  pickerHeight?: number;
  onSelect?: (value: Value) => void;
  onCancel?: () => void;
}
