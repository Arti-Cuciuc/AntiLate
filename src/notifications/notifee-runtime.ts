import { Platform } from 'react-native';

import { hasNativeAlarmSupport } from '../../modules/antilate-alarm/src';

export type NotifeePackage = typeof import('@notifee/react-native');

let cachedPackage: NotifeePackage | null | undefined;

export function getNotifeePackage(): NotifeePackage | null {
  if (cachedPackage !== undefined) {
    return cachedPackage;
  }

  if (Platform.OS !== 'android' || !hasNativeAlarmSupport()) {
    cachedPackage = null;
    return cachedPackage;
  }

  try {
    cachedPackage = require('@notifee/react-native') as NotifeePackage;
  } catch {
    cachedPackage = null;
  }

  return cachedPackage;
}

export function hasNotificationRuntime() {
  return getNotifeePackage() !== null;
}
