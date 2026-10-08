import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';

import {
  getNotificationCapabilities,
  openAlarmChannelSettings,
  openBackgroundActivitySettings,
  openExactAlarmSettings,
  openFullScreenAlarmSettings,
  performAlarmAction,
  requestNotificationPermission,
  restoreActiveAlarmFromLaunch,
  scheduleTestAlarm,
  subscribeToForegroundNotificationEvents,
  syncMeetingNotifications,
  updateNotificationSoundEnabled,
} from '../notifications/notification-service';
import {
  loadNotificationState,
  subscribeToActiveAlarm,
} from '../storage/notifications-storage';
import type { PlannedEvent } from '../types/event';
import type {
  AlarmAction,
  AlarmPayload,
  NotificationCapabilities,
} from '../types/notification';
import type { MeetingTemplate } from '../types/template';

const INITIAL_CAPABILITIES: NotificationCapabilities = {
  supported: false,
  notificationsEnabled: false,
  exactAlarmsEnabled: false,
  fullScreenEnabled: false,
  batteryOptimizationEnabled: true,
  channelEnabled: false,
  hasVibrator: false,
};

type UseNotificationsOptions = {
  events: readonly PlannedEvent[];
  templates: readonly MeetingTemplate[];
  isHydrated: boolean;
};

export function useNotifications({
  events,
  templates,
  isHydrated,
}: UseNotificationsOptions) {
  const [activeAlarm, setActiveAlarm] = useState<AlarmPayload | null>(null);
  const [capabilities, setCapabilities] =
    useState<NotificationCapabilities>(INITIAL_CAPABILITIES);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const errorReported = useRef(false);
  const reportError = useCallback(() => {
    setIsRefreshing(false);
    if (!errorReported.current) {
      errorReported.current = true;
      Alert.alert('Не удалось настроить напоминания',
        'Откройте настройки уведомлений и проверьте разрешения. Затем перезапустите приложение.');
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const state = await loadNotificationState();
      const nextCapabilities = await getNotificationCapabilities(
        state.soundEnabled,
      );
      setSoundEnabled(state.soundEnabled);
      setCapabilities(nextCapabilities);
      return nextCapabilities;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      restoreActiveAlarmFromLaunch(),
      loadNotificationState(),
    ]).then(async ([launchedAlarm, storedState]) => {
      const nextCapabilities = await getNotificationCapabilities(
        storedState.soundEnabled,
      );

      if (!isMounted) {
        return;
      }

      setActiveAlarm(launchedAlarm);
      setSoundEnabled(storedState.soundEnabled);
      setCapabilities(nextCapabilities);
      setIsRefreshing(false);
    }).catch(reportError);

    const unsubscribeAlarm = subscribeToActiveAlarm(setActiveAlarm);
    const unsubscribeNotifee = subscribeToForegroundNotificationEvents(reportError);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh().catch(reportError);
        void loadNotificationState().then((storedState) => {
          if (isMounted) {
            setActiveAlarm(storedState.activeAlarm);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAlarm();
      unsubscribeNotifee();
      appStateSubscription.remove();
    };
  }, [refresh, reportError]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let isCancelled = false;

    void syncMeetingNotifications(events, templates).then(
      (nextCapabilities) => {
        if (!isCancelled) {
          setCapabilities(nextCapabilities);
        }
      },
    ).catch(reportError);

    return () => {
      isCancelled = true;
    };
  }, [
    capabilities.channelEnabled,
    capabilities.exactAlarmsEnabled,
    capabilities.notificationsEnabled,
    events,
    isHydrated,
    soundEnabled,
    templates,
  ]);

  const requestPermission = useCallback(async () => {
    await requestNotificationPermission();
    await refresh();
  }, [refresh]);

  const runTest = useCallback(async () => {
    const didSchedule = await scheduleTestAlarm();
    await refresh();
    return didSchedule;
  }, [refresh]);

  const updateSoundEnabled = useCallback(
    async (nextSoundEnabled: boolean) => {
      setIsRefreshing(true);

      try {
        await updateNotificationSoundEnabled(nextSoundEnabled);
        setSoundEnabled(nextSoundEnabled);
        const nextCapabilities = await getNotificationCapabilities(nextSoundEnabled);
        setCapabilities(nextCapabilities);
      } finally {
        setIsRefreshing(false);
      }
    },
    [events, templates],
  );

  const actOnAlarm = useCallback(
    async (alarm: AlarmPayload, action: AlarmAction) => {
      await performAlarmAction(alarm, action);
    },
    [],
  );

  return {
    activeAlarm,
    capabilities,
    isRefreshing,
    soundEnabled,
    actOnAlarm,
    openAlarmChannelSettings: () => openAlarmChannelSettings(soundEnabled),
    openBackgroundActivitySettings,
    openExactAlarmSettings,
    openFullScreenAlarmSettings,
    refresh,
    requestPermission,
    runTest,
    updateSoundEnabled,
  };
}
