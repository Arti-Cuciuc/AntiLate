import { Easing, ReduceMotion } from 'react-native-reanimated';

// One restrained motion language; all durations are milliseconds.
export const MOTION = {
  press: 100,
  release: 180,
  enter: 260,
  exit: 140,
  layout: 240,
  screen: 300,
  distance: 12,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

export const MOTION_TIMING = {
  duration: MOTION.layout,
  easing: MOTION.easing,
  reduceMotion: ReduceMotion.System,
};
