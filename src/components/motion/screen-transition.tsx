import {
  type PropsWithChildren,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';

import { MOTION } from '../../constants/motion';
import { useAppReducedMotion } from './motion-provider';

type ScreenTransitionProps = PropsWithChildren<{
  screenKey: string;
  depth: number;
  urgent?: boolean;
}>;

export function ScreenTransition({
  children,
  screenKey,
  depth,
  urgent = false,
}: ScreenTransitionProps) {
  const reducedMotion = useAppReducedMotion();
  const previous = useRef({ screenKey, depth });
  const direction = useRef(1);
  if (previous.current.screenKey !== screenKey) {
    direction.current = depth < previous.current.depth ? -1 : 1;
  }
  const offset = direction.current * 18;
  useLayoutEffect(() => {
    previous.current = { screenKey, depth };
  }, [screenKey, depth]);
  const entering = useMemo(() => {
    const preference = reducedMotion
      ? ReduceMotion.Always
      : ReduceMotion.System;
    return urgent
      ? FadeIn.duration(MOTION.exit).reduceMotion(preference)
      : FadeInRight.duration(MOTION.screen)
          .easing(MOTION.easing)
          .withInitialValues({ transform: [{ translateX: offset }] })
          .reduceMotion(preference);
  }, [offset, reducedMotion, urgent]);

  return (
    <View className="flex-1 overflow-hidden bg-paper">
      <Animated.View
        key={screenKey}
        className="absolute inset-0 bg-paper"
        entering={entering}
        exiting={FadeOut.duration(urgent ? 0 : MOTION.exit).reduceMotion(
          reducedMotion ? ReduceMotion.Always : ReduceMotion.System,
        )}
      >
        {children}
      </Animated.View>
    </View>
  );
}
