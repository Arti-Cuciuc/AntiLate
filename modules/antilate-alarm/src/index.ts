import { requireOptionalNativeModule } from 'expo';

type AntiLateAlarmNativeModule = {
  hasVibrator(): boolean;
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): Promise<void>;
  startAlarmVibration(): boolean;
  stopAlarmVibration(): void;
};

const nativeModule =
  requireOptionalNativeModule<AntiLateAlarmNativeModule>('AntiLateAlarm');

export function hasNativeAlarmSupport() {
  return nativeModule !== null;
}

export function hasVibrator() {
  return nativeModule?.hasVibrator() ?? false;
}

export function canUseFullScreenIntent() {
  return nativeModule?.canUseFullScreenIntent() ?? false;
}

export async function openFullScreenIntentSettings() {
  await nativeModule?.openFullScreenIntentSettings();
}

export function startAlarmVibration() {
  return nativeModule?.startAlarmVibration() ?? false;
}

export function stopAlarmVibration() {
  nativeModule?.stopAlarmVibration();
}
