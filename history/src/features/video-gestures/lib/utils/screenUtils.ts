/**
 * Video Gestures - Screen Utilities
 * 屏幕相关的工具函数
 */

import { Dimensions } from 'react-native';
import type { ScreenContext } from '../../model/types';
import { calculateScreenDensity, adjustForScreenDensity } from '../../model/config';

/**
 * 获取当前屏幕上下文
 */
export function getCurrentScreenContext(): ScreenContext {
  const window = Dimensions.get('window');

  return {
    width: window.width,
    height: window.height,
    isLandscape: window.width > window.height,
    pixelDensity: calculateScreenDensity(window.width),
  };
}

/**
 * 计算手势区域
 * @param screenWidth - 屏幕宽度
 * @param leftRatio - 左区域占比
 * @param rightRatio - 右区域占比
 * @returns 区域边界
 */
export function calculateGestureZones(
  screenWidth: number,
  leftRatio: number = 0.4,
  rightRatio: number = 0.4
) {
  const leftBoundary = screenWidth * leftRatio;
  const rightBoundary = screenWidth * (1 - rightRatio);

  return {
    leftZone: {
      start: 0,
      end: leftBoundary,
    },
    centerZone: {
      start: leftBoundary,
      end: rightBoundary,
    },
    rightZone: {
      start: rightBoundary,
      end: screenWidth,
    },
  };
}

/**
 * 判断点击位置属于哪个区域
 * @param x - X坐标
 * @param screenWidth - 屏幕宽度
 * @param leftRatio - 左区域占比
 * @param rightRatio - 右区域占比
 * @returns 区域类型
 */
export function getGestureZone(
  x: number,
  screenWidth: number,
  leftRatio: number = 0.4,
  rightRatio: number = 0.4
): 'left' | 'center' | 'right' {
  const zones = calculateGestureZones(screenWidth, leftRatio, rightRatio);

  if (x <= zones.leftZone.end) {
    return 'left';
  }

  if (x >= zones.rightZone.start) {
    return 'right';
  }

  return 'center';
}

/**
 * 根据屏幕密度调整手势参数
 * @param params - 原始参数对象
 * @param screenDensity - 屏幕密度
 * @returns 调整后的参数
 */
export function adjustGestureParams<T extends Record<string, number>>(
  params: T,
  screenDensity: number = 1
): T {
  const adjusted = {} as T;

  for (const [key, value] of Object.entries(params)) {
    adjusted[key as keyof T] = adjustForScreenDensity(value, screenDensity) as T[keyof T];
  }

  return adjusted;
}

/**
 * 计算两点之间的距离
 * @param point1 - 第一个点
 * @param point2 - 第二个点
 * @returns 距离
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算手势速度
 * @param startPoint - 起始点
 * @param endPoint - 结束点
 * @param duration - 持续时间（ms）
 * @returns 速度（像素/秒）
 */
export function calculateVelocity(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  duration: number
): number {
  if (duration <= 0) return 0;

  const distance = calculateDistance(startPoint, endPoint);
  return (distance / duration) * 1000; // 转换为像素/秒
}

/**
 * 判断手势是否为水平滑动
 * @param startPoint - 起始点
 * @param endPoint - 结束点
 * @param threshold - 角度阈值（度）
 * @returns 是否为水平滑动
 */
export function isHorizontalGesture(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  threshold: number = 30
): boolean {
  const dx = Math.abs(endPoint.x - startPoint.x);
  const dy = Math.abs(endPoint.y - startPoint.y);

  if (dx === 0 && dy === 0) return false;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return angle <= threshold;
}

/**
 * 判断手势是否为垂直滑动
 * @param startPoint - 起始点
 * @param endPoint - 结束点
 * @param threshold - 角度阈值（度）
 * @returns 是否为垂直滑动
 */
export function isVerticalGesture(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  threshold: number = 30
): boolean {
  const dx = Math.abs(endPoint.x - startPoint.x);
  const dy = Math.abs(endPoint.y - startPoint.y);

  if (dx === 0 && dy === 0) return false;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return angle >= (90 - threshold);
}