import { useMemo } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

import { MOTION } from '../../constants/motion';
import { useAppReducedMotion } from './motion-provider';

type MotionViewProps = ViewProps & {
  className?: string;
  delay?: number;
  enter?: boolean;
};

export function MotionView({
  delay = 0,
  enter = true,
  ...props
}: MotionViewProps) {
  const reducedMotion = useAppReducedMotion();
  const motion = useMemo(() => {
    const preference = reducedMotion
      ? ReduceMotion.Always
      : ReduceMotion.System;
    return {
      entering: FadeInDown.duration(MOTION.enter)
        .delay(Math.min(delay, 80))
        .easing(MOTION.easing)
        .withInitialValues({ transform: [{ translateY: MOTION.distance }] })
        .reduceMotion(preference),
      exiting: FadeOut.duration(MOTION.exit).reduceMotion(preference),
      layout: LinearTransition.duration(MOTION.layout)
        .easing(MOTION.easing)
        .reduceMotion(preference),
    };
  }, [delay, reducedMotion]);

  return (
    <Animated.View
      {...props}
      entering={enter ? motion.entering : undefined}
      exiting={motion.exiting}
      layout={motion.layout}
    />
  );
}
