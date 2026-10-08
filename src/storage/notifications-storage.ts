import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeNotificationState } from '../utils/notification-state';

import type {
  AlarmPayload,
  NotificationStorageState,
} from '../types/notification';

const NOTIFICATIONS_STORAGE_KEY = '@antilate/notifications/v1';

const EMPTY_STATE: NotificationStorageState = {
  plans: {},
  activeAlarm: null,
  soundEnabled: false,
};

let writeQueue: Promise<unknown> = Promise.resolve();
const activeAlarmListeners = new Set<(alarm: AlarmPayload | null) => void>();

export async function loadNotificationState(): Promise<NotificationStorageState> {
  try {
    const serialized = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

    if (!serialized) {
      return EMPTY_STATE;
    }

    const value: unknown = JSON.parse(serialized);

    if (!value || typeof value !== 'object') {
      return EMPTY_STATE;
    }

    return normalizeNotificationState(value);
  } catch {
    return EMPTY_STATE;
  }
}

export async function updateNotificationState(
  updater: (
    currentState: NotificationStorageState,
  ) => NotificationStorageState | Promise<NotificationStorageState>,
) {
  let result = EMPTY_STATE;

  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    const currentState = await loadNotificationState();
    result = await updater(currentState);

    await AsyncStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(result),
    );
  });

  await writeQueue;
  return result;
}

export async function setStoredActiveAlarm(alarm: AlarmPayload | null) {
  await updateNotificationState((state) => ({ ...state, activeAlarm: alarm }));
  activeAlarmListeners.forEach((listener) => listener(alarm));
}

export async function setNotificationSoundEnabled(soundEnabled: boolean) {
  await updateNotificationState((state) => ({ ...state, soundEnabled }));
}

export function subscribeToActiveAlarm(
  listener: (alarm: AlarmPayload | null) => void,
) {
  activeAlarmListeners.add(listener);

  return () => {
    activeAlarmListeners.delete(listener);
  };
}
