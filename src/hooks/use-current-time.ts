import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useCurrentTime(refreshInterval = 30_000) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setCurrentTime(new Date());
    const interval = setInterval(refresh, refreshInterval);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshInterval]);

  return currentTime;
}
