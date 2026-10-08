import { useEffect } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { cssInterop } from 'nativewind';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MOTION, MOTION_TIMING } from '../../constants/motion';
import { useAppReducedMotion } from './motion-provider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MotionPressableProps = Omit<PressableProps, 'style'> & {
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function MotionPressable({
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: MotionPressableProps) {
  const reducedMotion = useAppReducedMotion();
  const pressed = useSharedValue(0);
  const base = StyleSheet.flatten(style) ?? {};
  const baseOpacity = typeof base.opacity === 'number' ? base.opacity : 1;
  const background = useSharedValue(
    String(base.backgroundColor ?? 'transparent'),
  );
  const border = useSharedValue(String(base.borderColor ?? 'transparent'));

  useEffect(() => {
    const timing = {
      ...MOTION_TIMING,
      duration: reducedMotion ? 0 : MOTION.release,
    };
    background.value = withTiming(
      String(base.backgroundColor ?? 'transparent'),
      timing,
    );
    border.value = withTiming(
      String(base.borderColor ?? 'transparent'),
      timing,
    );
  }, [
    base.backgroundColor,
    base.borderColor,
    background,
    border,
    reducedMotion,
  ]);

  useEffect(() => {
    if (disabled || reducedMotion) pressed.value = 0;
  }, [disabled, pressed, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.018 }],
    opacity: baseOpacity * (1 - pressed.value * 0.16),
    ...(base.backgroundColor !== undefined
      ? { backgroundColor: background.value }
      : {}),
    ...(base.borderColor !== undefined ? { borderColor: border.value } : {}),
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        if (!disabled && !reducedMotion) {
          pressed.value = withTiming(1, {
            ...MOTION_TIMING,
            duration: MOTION.press,
          });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withTiming(0, {
          ...MOTION_TIMING,
          duration: reducedMotion ? 0 : MOTION.release,
        });
        onPressOut?.(event);
      }}
    />
  );
}

// Resolve NativeWind classes before animating their colors and opacity.
cssInterop(MotionPressable, { className: 'style' });
