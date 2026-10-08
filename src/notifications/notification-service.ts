import { Platform } from 'react-native';
import type { Event as NotifeeEvent, Notification } from '@notifee/react-native';

import {
  canUseFullScreenIntent,
  hasVibrator,
  openFullScreenIntentSettings,
  startAlarmVibration,
  stopAlarmVibration,
} from '../../modules/antilate-alarm/src';
import { loadStoredTemplates } from '../storage/templates-storage';
import {
  loadNotificationState,
  setNotificationSoundEnabled,
  setStoredActiveAlarm,
  updateNotificationState,
} from '../storage/notifications-storage';
import type { DisplayEvent } from '../types/display-event';
import type { PlannedEvent } from '../types/event';
import type {
  AlarmAction,
  AlarmPayload,
  NotificationCapabilities,
  ScheduledNotificationPlan,
} from '../types/notification';
import type { MeetingTemplate } from '../types/template';
import { sortEventsByDeparture } from '../utils/events';
import {
  createAlarmPayload,
  createTestAlarmPayload,
  getAlarmTriggerTimestamp,
  getNotificationFingerprint,
  getTemplateNotificationFingerprint,
  hasValidEventTime,
  parseAlarmPayload,
  serializeAlarmPayload,
} from '../utils/notification-plan';
import {
  getNextRecurringEvent,
  getNextRecurringEvents,
} from '../utils/templates';
import { getNotifeePackage, hasNotificationRuntime } from './notifee-runtime';

export const SILENT_ALARM_CHANNEL_ID = 'antilate_alarms_silent_v2';
export const SOUND_ALARM_CHANNEL_ID = 'antilate_alarms_sound_v2';
const MAX_SCHEDULED_OCCURRENCES = 24;
const MINIMUM_TRIGGER_DELAY_MS = 2_000;
const MINIMUM_SNOOZE_WINDOW_MS = 2 * 60_000;

export const NOTIFICATION_ACTION_IDS = {
  acknowledge: 'antilate_acknowledge',
  snooze: 'antilate_snooze',
  left: 'antilate_left',
} as const;

let foregroundServiceResolve: (() => void) | null = null;
let backgroundHandlersRegistered = false;

function formatClock(timestamp: number) {
  const date = new Date(timestamp);

  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function formatRemainingMinutes(milliseconds: number) {
  return Math.max(1, Math.ceil(milliseconds / 60_000));
}

function getAlarmCopy(payload: AlarmPayload) {
  if (payload.stage === 'departure') {
    return {
      title: 'Пора выходить',
      body: `${payload.place} · встреча в ${payload.arrivalTime}`,
    };
  }

  if (payload.stage === 'midpoint') {
    return {
      title: 'Сборы продолжаются',
      body: `До выхода ${formatRemainingMinutes(
        payload.departureTimestamp - payload.midpointTimestamp,
      )} мин · ${payload.place}`,
    };
  }

  if (payload.stage === 'test') {
    return {
      title: 'Тест AntiLate',
      body: 'Полноэкранное напоминание и вибрация работают',
    };
  }

  return {
    title: 'Пора собираться',
    body: `${payload.place} · выход в ${formatClock(
      payload.departureTimestamp,
    )}`,
  };
}

function getAlarmActions(payload: AlarmPayload) {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return [];
  }

  if (payload.stage === 'departure') {
    return [
      {
        title: 'Я вышел',
        pressAction: { id: NOTIFICATION_ACTION_IDS.left },
      },
    ];
  }

  if (payload.stage === 'preparation') {
    return [
      {
        title: 'ОК',
        pressAction: { id: NOTIFICATION_ACTION_IDS.acknowledge },
      },
      {
        title: 'Напомнить чуть позже',
        pressAction: { id: NOTIFICATION_ACTION_IDS.snooze },
      },
    ];
  }

  return [
    {
      title: 'ОК',
      pressAction: { id: NOTIFICATION_ACTION_IDS.acknowledge },
    },
  ];
}

function getAlarmChannelId(soundEnabled: boolean) {
  return soundEnabled ? SOUND_ALARM_CHANNEL_ID : SILENT_ALARM_CHANNEL_ID;
}

function createNotification(
  payload: AlarmPayload,
  soundEnabled: boolean,
): Notification | null {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return null;
  }

  const copy = getAlarmCopy(payload);

  return {
    id: payload.notificationId,
    title: copy.title,
    body: copy.body,
    data: serializeAlarmPayload(payload),
    android: {
      channelId: getAlarmChannelId(soundEnabled),
      category: notifeePackage.AndroidCategory.ALARM,
      importance: notifeePackage.AndroidImportance.HIGH,
      visibility: notifeePackage.AndroidVisibility.PUBLIC,
      color: '#9D174D',
      autoCancel: false,
      ongoing: true,
      asForegroundService: true,
      loopSound: false,
      vibrationPattern: [850, 160, 850, 160, 1_150, 260],
      pressAction: { id: 'default' },
      fullScreenAction: { id: 'default' },
      actions: getAlarmActions(payload),
    },
  };
}

export async function ensureAlarmChannels() {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return null;
  }

  return Promise.all([
    notifeePackage.default.createChannel({
      id: SILENT_ALARM_CHANNEL_ID,
      name: 'Важные напоминания AntiLate',
      description: 'Сборы и время выхода без звука',
      importance: notifeePackage.AndroidImportance.HIGH,
      bypassDnd: false,
      vibration: true,
      vibrationPattern: [850, 160, 850, 160, 1_150, 260],
      lights: true,
      lightColor: '#9D174D',
      visibility: notifeePackage.AndroidVisibility.PUBLIC,
    }),
    notifeePackage.default.createChannel({
      id: SOUND_ALARM_CHANNEL_ID,
      name: 'Важные напоминания AntiLate со звуком',
      description: 'Сборы и время выхода с коротким звуком',
      importance: notifeePackage.AndroidImportance.HIGH,
      sound: 'default',
      bypassDnd: false,
      vibration: true,
      vibrationPattern: [850, 160, 850, 160, 1_150, 260],
      lights: true,
      lightColor: '#9D174D',
      visibility: notifeePackage.AndroidVisibility.PUBLIC,
    }),
  ]);
}

export async function getNotificationCapabilities(
  soundEnabled = false,
): Promise<NotificationCapabilities> {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage || Platform.OS !== 'android') {
    return {
      supported: false,
      notificationsEnabled: false,
      exactAlarmsEnabled: false,
      fullScreenEnabled: false,
      batteryOptimizationEnabled: true,
      channelEnabled: false,
      hasVibrator: false,
    };
  }

  await ensureAlarmChannels();

  const [settings, batteryOptimizationEnabled, channel] =
    await Promise.all([
      notifeePackage.default.getNotificationSettings(),
      notifeePackage.default.isBatteryOptimizationEnabled(),
      notifeePackage.default.getChannel(getAlarmChannelId(soundEnabled)),
    ]);

  return {
    supported: true,
    notificationsEnabled:
      settings.authorizationStatus ===
      notifeePackage.AuthorizationStatus.AUTHORIZED,
    exactAlarmsEnabled:
      settings.android.alarm !==
      notifeePackage.AndroidNotificationSetting.DISABLED,
    fullScreenEnabled: canUseFullScreenIntent(),
    batteryOptimizationEnabled,
    channelEnabled:
      Boolean(channel) &&
      channel?.blocked !== true &&
      channel?.vibration === true &&
      (channel?.importance ?? 0) >= notifeePackage.AndroidImportance.HIGH,
    hasVibrator: hasVibrator(),
  };
}

export async function requestNotificationPermission() {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return;
  }

  await ensureAlarmChannels();
  await notifeePackage.default.requestPermission();
}

export async function openExactAlarmSettings() {
  await getNotifeePackage()?.default.openAlarmPermissionSettings();
}

export async function openFullScreenAlarmSettings() {
  await openFullScreenIntentSettings();
}

export async function openAlarmChannelSettings(soundEnabled = false) {
  await getNotifeePackage()?.default.openNotificationSettings(
    getAlarmChannelId(soundEnabled),
  );
}

export async function openBackgroundActivitySettings() {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return;
  }

  const powerManagerInfo = await notifeePackage.default.getPowerManagerInfo();

  if (powerManagerInfo.activity) {
    await notifeePackage.default.openPowerManagerSettings();
  } else {
    await notifeePackage.default.openBatteryOptimizationSettings();
  }
}

async function scheduleAlarmPayload(
  payload: AlarmPayload,
  timestamp = getAlarmTriggerTimestamp(payload),
  soundEnabled = false,
) {
  const notifeePackage = getNotifeePackage();
  const notification = createNotification(payload, soundEnabled);

  if (!notifeePackage || !notification) {
    return null;
  }

  const triggerTimestamp = Math.max(
    Date.now() + MINIMUM_TRIGGER_DELAY_MS,
    timestamp,
  );

  await notifeePackage.default.createTriggerNotification(notification, {
    type: notifeePackage.TriggerType.TIMESTAMP,
    timestamp: triggerTimestamp,
    alarmManager: {
      type: notifeePackage.AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
    },
  });

  return payload.notificationId;
}

async function cancelNotificationIds(ids: Array<string | undefined>) {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return;
  }

  await Promise.all(
    ids
      .filter((id): id is string => typeof id === 'string')
      .map((id) => notifeePackage.default.cancelNotification(id)),
  );
}

async function cancelPlan(plan: ScheduledNotificationPlan) {
  await cancelNotificationIds([
    plan.preparationNotificationId,
    plan.midpointNotificationId,
    plan.departureNotificationId,
  ]);
}

async function scheduleEventPlan(
  event: DisplayEvent,
  template?: MeetingTemplate,
  soundEnabled = false,
) {
  const now = Date.now();
  const preparationPayload = createAlarmPayload(event, 'preparation');
  const departurePayload = createAlarmPayload(event, 'departure');
  const preparationTime =
    preparationPayload.preparationTimestamp > now
      ? preparationPayload.preparationTimestamp
      : now + MINIMUM_TRIGGER_DELAY_MS;
  const preparationNotificationId =
    departurePayload.departureTimestamp - now > 30_000
      ? await scheduleAlarmPayload(
          preparationPayload,
          preparationTime,
          soundEnabled,
        )
      : null;
  const departureNotificationId =
    departurePayload.departureTimestamp > now
      ? await scheduleAlarmPayload(departurePayload, undefined, soundEnabled)
      : null;

  return {
    eventId: event.id,
    fingerprint: getNotificationFingerprint(event),
    channelId: getAlarmChannelId(soundEnabled),
    source: event.recurringTemplateId ? 'recurring' : 'event',
    recurringTemplateId: event.recurringTemplateId,
    templateFingerprint: template
      ? getTemplateNotificationFingerprint(template)
      : undefined,
    departureTimestamp: departurePayload.departureTimestamp,
    preparationNotificationId: preparationNotificationId ?? undefined,
    departureNotificationId: departureNotificationId ?? undefined,
  } satisfies ScheduledNotificationPlan;
}

let syncQueue: Promise<unknown> = Promise.resolve();

export function syncMeetingNotifications(
  events: readonly PlannedEvent[],
  templates: readonly MeetingTemplate[],
  now = new Date(),
) {
  const result = syncQueue.catch(() => undefined).then(() =>
    synchronizeMeetingNotifications(events, templates, now));
  syncQueue = result;
  return result;
}

async function synchronizeMeetingNotifications(
  events: readonly PlannedEvent[],
  templates: readonly MeetingTemplate[],
  now = new Date(),
) {
  const storedState = await loadNotificationState();
  const soundEnabled = storedState.soundEnabled;
  const channelId = getAlarmChannelId(soundEnabled);
  const capabilities = await getNotificationCapabilities(soundEnabled);

  if (
    !capabilities.supported ||
    !capabilities.notificationsEnabled ||
    !capabilities.exactAlarmsEnabled ||
    !capabilities.channelEnabled
  ) {
    return capabilities;
  }

  // Change only still-pending triggers. Rebuilding the whole plan would replay
  // acknowledged preparation alarms and discard a user's midpoint reminder.
  const notifeePackage = getNotifeePackage();
  if (notifeePackage && Object.values(storedState.plans).some(plan => plan.channelId !== channelId)) {
    const pending = await notifeePackage.default.getTriggerNotifications();
    for (const { notification, trigger } of pending) {
      if (parseAlarmPayload(notification.data)) {
        await notifeePackage.default.createTriggerNotification({
          ...notification,
          android: { ...notification.android, channelId },
        }, trigger);
      }
    }
    for (const plan of Object.values(storedState.plans)) plan.channelId = channelId;
  }

  const recurringEvents = getNextRecurringEvents(templates, now);
  const candidates = sortEventsByDeparture<DisplayEvent>([
    ...events,
    ...recurringEvents,
  ])
    .filter(
      (event) =>
        hasValidEventTime(event) &&
        createAlarmPayload(event, 'departure').departureTimestamp >
          now.getTime(),
    )
    .slice(0, MAX_SCHEDULED_OCCURRENCES);
  const expectedIds = new Set(candidates.map((event) => event.id));
  const templatesById = new Map(
    templates.map((template) => [template.id, template]),
  );
  const nextPlans: Record<string, ScheduledNotificationPlan> = {};

  for (const plan of Object.values(storedState.plans)) {
    if (expectedIds.has(plan.eventId)) {
      continue;
    }

    const template = plan.recurringTemplateId
      ? templatesById.get(plan.recurringTemplateId)
      : undefined;
    const shouldPreserveFutureRecurringPlan =
      plan.source === 'recurring' &&
      plan.departureTimestamp > now.getTime() &&
      plan.channelId === channelId &&
      template?.recurrence.isEnabled === true &&
      plan.templateFingerprint === getTemplateNotificationFingerprint(template);

    if (shouldPreserveFutureRecurringPlan) {
      nextPlans[plan.eventId] = plan;
    } else {
      await cancelPlan(plan);
    }
  }

  for (const event of candidates) {
    const storedPlan = storedState.plans[event.id];
    const fingerprint = getNotificationFingerprint(event);

    if (
      storedPlan?.fingerprint === fingerprint &&
      storedPlan.channelId === channelId
    ) {
      nextPlans[event.id] = storedPlan;
      continue;
    }

    if (storedPlan) {
      await cancelPlan(storedPlan);
    }

    const template = event.recurringTemplateId
      ? templatesById.get(event.recurringTemplateId)
      : undefined;
    nextPlans[event.id] = await scheduleEventPlan(
      event,
      template,
      soundEnabled,
    );
  }

  await updateNotificationState((state) => ({ ...state, plans: nextPlans }));
  return capabilities;
}

async function scheduleNextRecurringOccurrence(payload: AlarmPayload) {
  if (!payload.recurringTemplateId || payload.stage !== 'departure') {
    return;
  }

  const templates = await loadStoredTemplates();
  const template = templates.find(
    (item) => item.id === payload.recurringTemplateId,
  );

  if (!template) {
    return;
  }

  const nextOccurrence = getNextRecurringEvent(
    template,
    new Date(payload.arrivalTimestamp + 60_000),
  );

  if (!nextOccurrence) {
    return;
  }

  const state = await loadNotificationState();
  const nextPlan = await scheduleEventPlan(
    nextOccurrence,
    template,
    state.soundEnabled,
  );

  await updateNotificationState((state) => ({
    ...state,
    plans: { ...state.plans, [nextPlan.eventId]: nextPlan },
  }));
}

async function activateAlarm(payload: AlarmPayload) {
  const state = await loadNotificationState();

  if (
    state.activeAlarm &&
    state.activeAlarm.notificationId !== payload.notificationId
  ) {
    await cancelNotificationIds([state.activeAlarm.notificationId]);
  }

  startAlarmVibration();
  await setStoredActiveAlarm(payload);
  await scheduleNextRecurringOccurrence(payload);
}

export async function stopAlarmSignal() {
  stopAlarmVibration();
  foregroundServiceResolve?.();
  foregroundServiceResolve = null;

  try {
    await getNotifeePackage()?.default.stopForegroundService();
  } catch {
    // No foreground service is active.
  }
}

async function scheduleMidpointReminder(payload: AlarmPayload) {
  const now = Date.now();
  const latestUsefulTime = payload.departureTimestamp - 30_000;
  const desiredTime = payload.midpointTimestamp;
  const triggerTime =
    desiredTime > now + MINIMUM_TRIGGER_DELAY_MS
      ? desiredTime
      : Math.min(now + 60_000, latestUsefulTime);

  if (
    payload.departureTimestamp - now < MINIMUM_SNOOZE_WINDOW_MS ||
    triggerTime <= now
  ) {
    return false;
  }

  const midpointPayload: AlarmPayload = {
    ...payload,
    notificationId: payload.notificationId.replace(
      '_preparation_',
      '_midpoint_',
    ),
    stage: 'midpoint',
    midpointTimestamp: triggerTime,
  };
  const { soundEnabled } = await loadNotificationState();
  const id = await scheduleAlarmPayload(
    midpointPayload,
    triggerTime,
    soundEnabled,
  );

  if (!id) {
    return false;
  }

  await updateNotificationState((state) => {
    const plan = state.plans[payload.eventId];

    if (!plan) {
      return state;
    }

    return {
      ...state,
      plans: {
        ...state.plans,
        [payload.eventId]: { ...plan, midpointNotificationId: id },
      },
    };
  });

  return true;
}

export function canSnoozeAlarm(payload: AlarmPayload, now = Date.now()) {
  return (
    payload.stage === 'preparation' &&
    payload.departureTimestamp - now >= MINIMUM_SNOOZE_WINDOW_MS
  );
}

export async function performAlarmAction(
  payload: AlarmPayload,
  action: AlarmAction,
) {
  const { activeAlarm } = await loadNotificationState();
  if (activeAlarm && activeAlarm.notificationId !== payload.notificationId) {
    // A delayed action from an older notification must not silence the new alarm.
    await cancelNotificationIds([payload.notificationId]);
    return;
  }
  await stopAlarmSignal();
  await cancelNotificationIds([payload.notificationId]);

  if (action === 'snooze') {
    await scheduleMidpointReminder(payload);
  }

  await setStoredActiveAlarm(null);
}

async function handleNotifeeEvent(event: NotifeeEvent) {
  const notifeePackage = getNotifeePackage();
  const notification = event.detail.notification;
  const payload = parseAlarmPayload(notification?.data);

  if (!notifeePackage || !payload) {
    return;
  }

  if (event.type === notifeePackage.EventType.DELIVERED) {
    await activateAlarm(payload);
    return;
  }

  if (event.type === notifeePackage.EventType.PRESS) {
    await setStoredActiveAlarm(payload);
    return;
  }

  if (event.type !== notifeePackage.EventType.ACTION_PRESS) {
    return;
  }

  const actionId = event.detail.pressAction?.id;

  if (actionId === NOTIFICATION_ACTION_IDS.snooze) {
    await performAlarmAction(payload, 'snooze');
  } else if (actionId === NOTIFICATION_ACTION_IDS.left) {
    await performAlarmAction(payload, 'left');
  } else {
    await performAlarmAction(payload, 'acknowledge');
  }
}

export function registerNotificationBackgroundHandlers() {
  if (backgroundHandlersRegistered) {
    return;
  }

  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return;
  }

  backgroundHandlersRegistered = true;
  notifeePackage.default.onBackgroundEvent(handleNotifeeEvent);
  notifeePackage.default.registerForegroundService((notification) => {
    const payload = parseAlarmPayload(notification.data);

    if (payload) {
      startAlarmVibration();
    }

    foregroundServiceResolve?.();

    return new Promise<void>((resolve) => {
      foregroundServiceResolve = resolve;
    });
  });
}

export function subscribeToForegroundNotificationEvents(onError: () => void) {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return () => undefined;
  }

  return notifeePackage.default.onForegroundEvent((event) => {
    void handleNotifeeEvent(event).catch(onError);
  });
}

export async function restoreActiveAlarmFromLaunch() {
  const notifeePackage = getNotifeePackage();

  if (!notifeePackage) {
    return null;
  }

  const initialNotification = await notifeePackage.default.getInitialNotification();
  const launchedAlarm = parseAlarmPayload(
    initialNotification?.notification.data,
  );

  if (launchedAlarm && Date.now() < launchedAlarm.arrivalTimestamp + 60 * 60_000) {
    await setStoredActiveAlarm(launchedAlarm);
    return launchedAlarm;
  }

  const state = await loadNotificationState();
  const activeAlarm = state.activeAlarm;

  if (
    activeAlarm &&
    Date.now() < activeAlarm.arrivalTimestamp + 60 * 60_000
  ) {
    return activeAlarm;
  }

  if (activeAlarm) {
    await setStoredActiveAlarm(null);
  }

  return null;
}

export async function scheduleTestAlarm() {
  const { soundEnabled } = await loadNotificationState();
  const capabilities = await getNotificationCapabilities(soundEnabled);

  if (
    !capabilities.notificationsEnabled ||
    !capabilities.exactAlarmsEnabled ||
    !capabilities.channelEnabled
  ) {
    return false;
  }

  const payload = createTestAlarmPayload();
  await scheduleAlarmPayload(payload, undefined, soundEnabled);
  return true;
}

export async function updateNotificationSoundEnabled(soundEnabled: boolean) {
  await setNotificationSoundEnabled(soundEnabled);
}

export function isNotificationSystemSupported() {
  return hasNotificationRuntime();
}
