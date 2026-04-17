import { Alert as RNAlert, AlertButton } from 'react-native';

interface AlertOptions {
  /** 弹窗标题 */
  title: string;
  /** 弹窗消息内容 */
  message?: string;
  /** 按钮配置数组 */
  buttons?: AlertButton[];
  /** 是否可以通过点击外部区域取消 (仅 Android) */
  cancelable?: boolean;
}

/**
 * 通用 Alert 组件
 * 基于 React Native 原生 Alert 系统
 */
export class Alert {
  /**
   * 显示信息提示框
   */
  static info(title: string, message?: string, onOk?: () => void) {
    RNAlert.alert(
      title,
      message,
      [
        {
          text: '确定',
          onPress: onOk,
        },
      ]
    );
  }

  /**
   * 显示确认对话框
   */
  static confirm(
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) {
    RNAlert.alert(
      title,
      message,
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: '确定',
          onPress: onConfirm,
        },
      ]
    );
  }

  /**
   * 显示警告提示框
   */
  static warning(title: string, message?: string, onOk?: () => void) {
    RNAlert.alert(
      title,
      message,
      [
        {
          text: '知道了',
          onPress: onOk,
        },
      ]
    );
  }

  /**
   * 显示错误提示框
   */
  static error(title: string, message?: string, onOk?: () => void) {
    RNAlert.alert(
      title,
      message,
      [
        {
          text: '确定',
          onPress: onOk,
        },
      ]
    );
  }

  /**
   * 显示成功提示框
   */
  static success(title: string, message?: string, onOk?: () => void) {
    RNAlert.alert(
      title,
      message,
      [
        {
          text: '确定',
          onPress: onOk,
        },
      ]
    );
  }

  /**
   * 显示自定义 Alert
   */
  static show({ title, message, buttons = [{ text: '确定' }], cancelable = true }: AlertOptions) {
    RNAlert.alert(title, message, buttons, { cancelable });
  }

  /**
   * 显示删除确认对话框
   */
  static delete(
    title: string = '确认删除',
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) {
    RNAlert.alert(
      title,
      message,
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    );
  }

  /**
   * 显示退出确认对话框
   */
  static exit(
    title: string = '确认退出',
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) {
    RNAlert.alert(
      title,
      message,
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: '退出',
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    );
  }
}