import { useEffect, useRef, useState } from 'react';
import { Modal, type ModalProps } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MOTION, MOTION_TIMING } from '../../constants/motion';
import { useAppReducedMotion } from './motion-provider';
import { useTheme } from '../theme-provider';

export function MotionModal({
  visible = false,
  children,
  ...props
}: ModalProps) {
  const { variables } = useTheme();
  const [mounted, setMounted] = useState(visible);
  const isVisible = useRef(visible);
  isVisible.current = visible;
  const reducedMotion = useAppReducedMotion();
  const progress = useSharedValue(0);
  const finishClosing = () => {
    if (!isVisible.current) setMounted(false);
  };

  useEffect(() => {
    if (visible) setMounted(true);
    progress.value = withTiming(
      visible ? 1 : 0,
      {
        ...MOTION_TIMING,
        duration: reducedMotion ? 0 : visible ? MOTION.enter : MOTION.exit,
      },
      (finished) => {
        if (finished && !visible) runOnJS(finishClosing)();
      },
    );
    return () => cancelAnimation(progress);
  }, [visible, reducedMotion, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Modal {...props} animationType="none" visible={mounted}>
      <Animated.View
        className="flex-1"
        style={[variables, animatedStyle]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}
