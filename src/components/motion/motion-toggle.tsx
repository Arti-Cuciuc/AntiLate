import { useTheme } from '../theme-provider';
import { useEffect } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MOTION_TIMING } from '../../constants/motion';
import { useAppReducedMotion } from './motion-provider';

export function MotionToggle({ checked }: { checked: boolean }) {
  const { colors } = useTheme();
  const reducedMotion = useAppReducedMotion();
  const progress = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, {
      ...MOTION_TIMING,
      duration: reducedMotion ? 0 : MOTION_TIMING.duration,
    });
  }, [checked, progress, reducedMotion]);
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.divider, colors.action],
    ),
  }));
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 18 }],
  }));
  return (
    <Animated.View
      className="h-6 w-[42px] justify-center rounded-xl p-[3px]"
      style={track}
      pointerEvents="none"
    >
      <Animated.View
        className="h-[18px] w-[18px] rounded-[9px] bg-on-action"
        style={thumb}
      />
    </Animated.View>
  );
}
