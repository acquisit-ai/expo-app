import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Easing,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BlurModal, BlurButton } from '@/shared/ui/blur';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { spacing } from '@/shared/config/theme';

export interface PickerOption<Value extends string | number> {
  label: string;
  value: Value;
}

export interface NativePickerModalContentProps<Value extends string | number> {
  title: string;
  options: readonly PickerOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  onConfirm: (value: Value) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  pickerHeight?: number;
}

export function NativePickerModalContent<Value extends string | number>({
  title,
  options,
  value,
  onChange,
  onConfirm,
  onCancel,
  confirmText = '完成',
  cancelText = '取消',
  pickerHeight = 170,
}: NativePickerModalContentProps<Value>) {
  const { theme } = useTheme();

  return (
    <BlurModal
      type="square"
      sizeRatio={0.85}
      padding="lg"
      variant="default"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
        </View>

        <View
          style={[
            styles.pickerContainer,
            {
              borderColor: theme.colors.outlineVariant,
              backgroundColor: theme.colors.surfaceVariant ?? theme.colors.backdrop ?? '#111',
            },
          ]}
        >
          <Picker<Value>
            selectedValue={value}
            onValueChange={onChange}
            style={[styles.picker, { color: theme.colors.onSurface, height: pickerHeight }]}
            itemStyle={[styles.pickerItem, { color: theme.colors.onSurface }]}
          >
            {options.map(option => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>

        <View style={styles.footer}>
          <BlurButton style={styles.modalButton} onPress={onCancel}>
            {cancelText}
          </BlurButton>
          <BlurButton
            style={styles.modalButton}
            onPress={() => onConfirm(value)}
            primary
          >
            {confirmText}
          </BlurButton>
        </View>
      </View>
    </BlurModal>
  );
}

NativePickerModalContent.modalOptions = {
  backdropOpacity: 0.5,
  transitionOptions: (animatedValue: any) => ({
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  picker: {
    width: '100%',
  },
  pickerItem: {
    fontSize: 18,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
