import type { DisplayEvent } from '../types/display-event';
import type {
  AlarmPayload,
  AlarmSource,
  AlarmStage,
} from '../types/notification';
import type { MeetingTemplate } from '../types/template';
import {
  getEventDepartureTimestamp,
  getEventPreparationTimestamp,
} from './events';
import { parseTime } from './time';
import { isValidLocalDateId } from './date';

export function getEventArrivalTimestamp(event: DisplayEvent) {
  const departureTimestamp = getEventDepartureTimestamp(event);

  return departureTimestamp + event.travelMinutes * 60_000;
}

export function getEventMidpointTimestamp(event: DisplayEvent) {
  const preparationTimestamp = getEventPreparationTimestamp(event);
  const departureTimestamp = getEventDepartureTimestamp(event);

  return preparationTimestamp + Math.floor(
    (departureTimestamp - preparationTimestamp) / 2,
  );
}

export function getNotificationFingerprint(event: DisplayEvent) {
  return JSON.stringify({
    place: event.place,
    detail: event.detail ?? '',
    eventDate: event.eventDate ?? '',
    arrivalTime: event.arrivalTime,
    travelMinutes: event.travelMinutes,
    preparationMinutes: event.preparationMinutes,
    recurringTemplateId: event.recurringTemplateId ?? '',
  });
}

export function getTemplateNotificationFingerprint(
  template: MeetingTemplate,
) {
  return JSON.stringify({
    place: template.place,
    detail: template.detail ?? '',
    arrivalTime: template.arrivalTime ?? '',
    travelMinutes: template.travelMinutes,
    preparationMinutes: template.preparationMinutes,
    weekdays: template.recurrence.weekdays,
    isEnabled: template.recurrence.isEnabled,
  });
}

function getNotificationId(eventId: string, stage: AlarmStage) {
  const safeId = eventId.replace(/[^a-zA-Z0-9_.]/g, '_').slice(-80);

  return `antilate_${stage}_${safeId}`;
}

export function createAlarmPayload(
  event: DisplayEvent,
  stage: AlarmStage,
  source: AlarmSource = event.recurringTemplateId ? 'recurring' : 'event',
): AlarmPayload {
  const departureTimestamp = getEventDepartureTimestamp(event);
  const preparationTimestamp = getEventPreparationTimestamp(event);
  const arrivalTimestamp = getEventArrivalTimestamp(event);
  const midpointTimestamp = getEventMidpointTimestamp(event);

  return {
    notificationId: getNotificationId(event.id, stage),
    eventId: event.id,
    source,
    recurringTemplateId: event.recurringTemplateId,
    stage,
    place: event.place,
    detail: event.detail,
    eventDate: event.eventDate ?? '',
    arrivalTime: event.arrivalTime,
    arrivalTimestamp,
    preparationTimestamp,
    departureTimestamp,
    midpointTimestamp,
  };
}

export function createTestAlarmPayload(now = Date.now()): AlarmPayload {
  const triggerTimestamp = now + 3_000;
  const arrivalTimestamp = triggerTimestamp + 30 * 60_000;
  const arrivalDate = new Date(arrivalTimestamp);
  const dateId = `${arrivalDate.getFullYear()}-${String(
    arrivalDate.getMonth() + 1,
  ).padStart(2, '0')}-${String(arrivalDate.getDate()).padStart(2, '0')}`;
  const arrivalMinutes =
    arrivalDate.getHours() * 60 + arrivalDate.getMinutes();

  return {
    notificationId: `antilate_test_${now}`,
    eventId: `test-${now}`,
    source: 'test',
    stage: 'test',
    place: 'Тестовое напоминание',
    eventDate: dateId,
    arrivalTime: `${String(Math.floor(arrivalMinutes / 60)).padStart(
      2,
      '0',
    )}:${String(arrivalMinutes % 60).padStart(2, '0')}`,
    arrivalTimestamp,
    preparationTimestamp: triggerTimestamp,
    departureTimestamp: triggerTimestamp + 10 * 60_000,
    midpointTimestamp: triggerTimestamp + 5 * 60_000,
  };
}

export function serializeAlarmPayload(payload: AlarmPayload) {
  return {
    antilateAlarm: 'true',
    notificationId: payload.notificationId,
    eventId: payload.eventId,
    source: payload.source,
    recurringTemplateId: payload.recurringTemplateId ?? '',
    stage: payload.stage,
    place: payload.place,
    detail: payload.detail ?? '',
    eventDate: payload.eventDate,
    arrivalTime: payload.arrivalTime,
    arrivalTimestamp: String(payload.arrivalTimestamp),
    preparationTimestamp: String(payload.preparationTimestamp),
    departureTimestamp: String(payload.departureTimestamp),
    midpointTimestamp: String(payload.midpointTimestamp),
  };
}

export function parseAlarmPayload(
  data: Record<string, unknown> | undefined,
): AlarmPayload | null {
  if (!data || data.antilateAlarm !== 'true') {
    return null;
  }

  const stage = data.stage;
  const source = data.source;
  const arrivalTimestamp = Number(data.arrivalTimestamp);
  const preparationTimestamp = Number(data.preparationTimestamp);
  const departureTimestamp = Number(data.departureTimestamp);
  const midpointTimestamp = Number(data.midpointTimestamp);

  if (
    (stage !== 'preparation' &&
      stage !== 'midpoint' &&
      stage !== 'departure' &&
      stage !== 'test') ||
    (source !== 'event' && source !== 'recurring' && source !== 'test') ||
    typeof data.notificationId !== 'string' ||
    typeof data.eventId !== 'string' ||
    typeof data.place !== 'string' ||
    typeof data.eventDate !== 'string' ||
    typeof data.arrivalTime !== 'string' ||
    !data.notificationId ||
    !data.eventId ||
    !isValidLocalDateId(data.eventDate) ||
    parseTime(data.arrivalTime) === null ||
    !Number.isFinite(arrivalTimestamp) ||
    !Number.isFinite(preparationTimestamp) ||
    !Number.isFinite(departureTimestamp) ||
    !Number.isFinite(midpointTimestamp) ||
    preparationTimestamp <= 0 ||
    preparationTimestamp > midpointTimestamp ||
    midpointTimestamp > departureTimestamp ||
    departureTimestamp > arrivalTimestamp
  ) {
    return null;
  }

  return {
    notificationId: data.notificationId,
    eventId: data.eventId,
    source,
    recurringTemplateId:
      typeof data.recurringTemplateId === 'string' &&
      data.recurringTemplateId
        ? data.recurringTemplateId
        : undefined,
    stage,
    place: data.place,
    detail:
      typeof data.detail === 'string' && data.detail
        ? data.detail
        : undefined,
    eventDate: data.eventDate,
    arrivalTime: data.arrivalTime,
    arrivalTimestamp,
    preparationTimestamp,
    departureTimestamp,
    midpointTimestamp,
  };
}

export function getAlarmTriggerTimestamp(payload: AlarmPayload) {
  if (payload.stage === 'preparation' || payload.stage === 'test') {
    return payload.preparationTimestamp;
  }

  if (payload.stage === 'midpoint') {
    return payload.midpointTimestamp;
  }

  return payload.departureTimestamp;
}

export function hasValidEventTime(event: DisplayEvent) {
  return parseTime(event.arrivalTime) !== null &&
    Number.isFinite(getEventDepartureTimestamp(event)) &&
    Number.isInteger(event.preparationMinutes) && event.preparationMinutes > 0;
}
