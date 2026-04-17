import { 
  useForm, 
  UseFormProps, 
  FieldValues, 
  SubmitHandler, 
  SubmitErrorHandler,
  Path,
  FieldErrors,
  PathValue
} from 'react-hook-form';
import { useFormErrorToast } from './error-utils';
import { toast } from '@/shared/lib/toast';
import { UI_TEXTS } from './config';

/**
 * 增强的表单验证 Hook
 * 自动处理验证错误的 Toast 显示
 * 
 * @example
 * ```typescript
 * const form = useFormValidation({
 *   resolver: zodResolver(schema),
 *   defaultValues: { email: '', password: '' }
 * });
 * 
 * // 验证单个字段
 * const isValid = await form.triggerWithToast('email');
 * 
 * // 验证多个字段
 * const isValid = await form.triggerWithToast(['email', 'password']);
 * 
 * // 验证整个表单
 * const isValid = await form.triggerWithToast();
 * 
 * // 提交表单（自动处理错误）
 * <button onClick={form.handleSubmitWithToast(onSubmit)}>
 * ```
 */
export function useFormValidation<TFieldValues extends FieldValues = FieldValues>(
  props?: UseFormProps<TFieldValues>
) {
  const { showFieldErrors } = useFormErrorToast();
  const form = useForm<TFieldValues>(props);
  
  /**
   * 触发验证并自动显示 Toast 错误
   * @param name 要验证的字段名，不传则验证整个表单
   * @returns 验证是否通过
   */
  const triggerWithToast = async (
    name?: Path<TFieldValues> | Path<TFieldValues>[] | readonly Path<TFieldValues>[]
  ): Promise<boolean> => {
    const isValid = await form.trigger(name);
    
    if (!isValid) {
      const errors: FieldErrors = {};
      
      if (name) {
        // 单字段或多字段验证 - 直接获取错误状态
        const fields = Array.isArray(name) ? name : [name];
        fields.forEach(field => {
          const state = form.getFieldState(field as Path<TFieldValues>);
          if (state.error) {
            errors[field as string] = state.error;
          }
        });
      } else {
        // 全表单验证 - 直接使用 formState.errors，它在 trigger() 完成后是最新的
        const formStateErrors = form.formState.errors;
        Object.keys(formStateErrors).forEach(key => {
          const error = formStateErrors[key as Path<TFieldValues>];
          if (error) {
            errors[key] = error;
          }
        });
        
        // 如果 formState.errors 为空，尝试从 defaultValues 获取字段名并检查
        if (Object.keys(errors).length === 0) {
          const defaultFields = Object.keys(props?.defaultValues || {});
          defaultFields.forEach(key => {
            const state = form.getFieldState(key as Path<TFieldValues>);
            if (state.error) {
              errors[key] = state.error;
            }
          });
        }
      }
      
      // 显示收集到的错误
      if (Object.keys(errors).length > 0) {
        showFieldErrors(errors);
      } else {
        // 验证失败但找不到具体错误的情况 - 直接显示通用 toast
        console.warn('Form validation failed but no specific errors found, showing generic toast');
        
        toast.show({
          title: UI_TEXTS.validation.failed,
          message: UI_TEXTS.validation.checkInput,
          duration: 4000,
          type: 'error'
        });
      }
    }
    
    return isValid;
  };
  
  /**
   * 增强的 handleSubmit，自动处理验证错误
   * @param onValid 验证通过时的处理函数
   * @param onInvalid 验证失败时的处理函数（可选，默认显示 Toast）
   */
  const handleSubmitWithToast = (
    onValid: SubmitHandler<TFieldValues>,
    onInvalid?: SubmitErrorHandler<TFieldValues>
  ) => {
    return form.handleSubmit(
      onValid,
      onInvalid || ((errors) => showFieldErrors(errors as FieldErrors))
    );
  };
  
  /**
   * 设置字段值并清除该字段的错误
   * @param name 字段名
   * @param value 字段值
   */
  const setValueWithClearError = (
    name: Path<TFieldValues>,
    value: PathValue<TFieldValues, Path<TFieldValues>>
  ) => {
    form.clearErrors(name);
    form.setValue(name, value);
  };
  
  return {
    ...form,
    triggerWithToast,
    handleSubmitWithToast,
    setValueWithClearError,
  };
}

// 导出类型，方便使用
export type UseFormValidationReturn<TFieldValues extends FieldValues = FieldValues> = 
  ReturnType<typeof useFormValidation<TFieldValues>>;