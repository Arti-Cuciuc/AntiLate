export type AlarmStage =
  | 'preparation'
  | 'midpoint'
  | 'departure'
  | 'test';

export type AlarmAction = 'acknowledge' | 'snooze' | 'left';

export type AlarmSource = 'event' | 'recurring' | 'test';

export type AlarmPayload = {
  notificationId: string;
  eventId: string;
  source: AlarmSource;
  recurringTemplateId?: string;
  stage: AlarmStage;
  place: string;
  detail?: string;
  eventDate: string;
  arrivalTime: string;
  arrivalTimestamp: number;
  preparationTimestamp: number;
  departureTimestamp: number;
  midpointTimestamp: number;
};

export type ScheduledNotificationPlan = {
  eventId: string;
  fingerprint: string;
  channelId: string;
  source: Exclude<AlarmSource, 'test'>;
  recurringTemplateId?: string;
  templateFingerprint?: string;
  departureTimestamp: number;
  preparationNotificationId?: string;
  midpointNotificationId?: string;
  departureNotificationId?: string;
};

export type NotificationStorageState = {
  plans: Record<string, ScheduledNotificationPlan>;
  activeAlarm: AlarmPayload | null;
  soundEnabled: boolean;
};

export type NotificationCapabilities = {
  supported: boolean;
  notificationsEnabled: boolean;
  exactAlarmsEnabled: boolean;
  fullScreenEnabled: boolean;
  batteryOptimizationEnabled: boolean;
  channelEnabled: boolean;
  hasVibrator: boolean;
};
