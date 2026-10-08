import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const MIDNIGHT_UPDATE_DELAY_MS = 250;

function getNextMidnight(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  );
}

export function useCurrentDate() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    let midnightTimeout: ReturnType<typeof setTimeout>;

    const refreshDateAndScheduleNextUpdate = () => {
      const now = new Date();
      const nextMidnight = getNextMidnight(now);

      setCurrentDate(now);
      clearTimeout(midnightTimeout);
      midnightTimeout = setTimeout(
        refreshDateAndScheduleNextUpdate,
        nextMidnight.getTime() - now.getTime() + MIDNIGHT_UPDATE_DELAY_MS,
      );
    };

    refreshDateAndScheduleNextUpdate();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshDateAndScheduleNextUpdate();
      }
    });

    return () => {
      clearTimeout(midnightTimeout);
      appStateSubscription.remove();
    };
  }, []);

  return currentDate;
}
