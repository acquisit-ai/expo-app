import React, { ComponentType } from 'react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface BaseInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  [key: string]: any;
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  /** React Hook Form 的 control 对象 */
  control: Control<TFieldValues>;
  /** 字段名称 */
  name: TName;
  /** 输入组件类型 */
  Component: ComponentType<BaseInputProps>;
  /** 传递给输入组件的额外属性 */
  componentProps?: Omit<BaseInputProps, 'value' | 'onChangeText'>;
}

/**
 * 通用表单字段组件
 * 封装 React Hook Form 的 Controller，减少重复代码
 * 自动处理字段验证、错误显示和输入变更
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  Component,
  componentProps = {}
}: FormFieldProps<TFieldValues, TName>) {
  
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Component
          placeholder=""
          {...componentProps}
          value={value || ''}
          onChangeText={onChange}
        />
      )}
    />
  );
}