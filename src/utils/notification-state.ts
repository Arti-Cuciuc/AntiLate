import type { NotificationStorageState, ScheduledNotificationPlan } from '../types/notification';
import { parseAlarmPayload } from './notification-plan';

export function normalizeNotificationState(value: unknown): NotificationStorageState {
  const state = value && typeof value === 'object'
    ? value as Partial<NotificationStorageState> : {};
  const plans: Record<string, ScheduledNotificationPlan> = {};
  for (const [id, plan] of Object.entries(state.plans ?? {})) {
    if (!plan || typeof plan !== 'object' || id !== plan.eventId ||
      ['__proto__', 'constructor', 'prototype'].includes(id) ||
      typeof plan.fingerprint !== 'string' ||
      (plan.channelId !== undefined && typeof plan.channelId !== 'string') ||
      !['event', 'recurring'].includes(plan.source) ||
      !Number.isFinite(plan.departureTimestamp) ||
      ['preparationNotificationId', 'midpointNotificationId', 'departureNotificationId',
        'recurringTemplateId', 'templateFingerprint'].some(key => {
          const field = plan[key as keyof ScheduledNotificationPlan];
          return field !== undefined && typeof field !== 'string';
        })) continue;
    plans[id] = plan;
  }
  return {
    plans,
    activeAlarm: state.activeAlarm && typeof state.activeAlarm === 'object'
      ? parseAlarmPayload({ ...state.activeAlarm, antilateAlarm: 'true' }) : null,
    soundEnabled: state.soundEnabled === true,
  };
}
