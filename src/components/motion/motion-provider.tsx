import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

const ReducedMotionContext = createContext(false);

export function MotionProvider({ children }: PropsWithChildren) {
  const initialPreference = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialPreference);

  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReducedMotion(value);
      })
      .catch(() => {});
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <ReducedMotionContext.Provider value={reducedMotion}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useAppReducedMotion() {
  return useContext(ReducedMotionContext);
}
