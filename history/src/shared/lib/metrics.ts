// Re-export all functions from react-native-size-matters for consistent scaling
import {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  ScaledSheet,
} from 'react-native-size-matters';

export {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  ScaledSheet,
};

// You can add custom scaling functions here if needed
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;