import type { PlannedEvent } from '../types/event';
import { isValidLocalDateId, toLocalDateId } from './date';
import { formatMinutes, parseTime } from './time';

export const DEFAULT_PREPARATION_MINUTES = 30;

export function normalizePlannedEvent(value: unknown): PlannedEvent | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const event = value as Partial<PlannedEvent> & {
    categoryId?: unknown;
    cardTheme?: unknown;
  };

  const isValidEvent =
    typeof event.id === 'string' &&
    event.id.trim().length > 0 &&
    typeof event.place === 'string' &&
    event.place.trim().length > 0 &&
    isValidLocalDateId(event.eventDate) &&
    typeof event.arrivalTime === 'string' &&
    parseTime(event.arrivalTime) !== null &&
    typeof event.leaveTime === 'string' &&
    typeof event.travelMinutes === 'number' &&
    Number.isInteger(event.travelMinutes) &&
    event.travelMinutes > 0 &&
    event.travelMinutes <= 720 &&
    (event.preparationMinutes === undefined ||
      (typeof event.preparationMinutes === 'number' &&
        Number.isInteger(event.preparationMinutes) &&
        event.preparationMinutes > 0 &&
        event.preparationMinutes <= 720)) &&
    (event.state === 'active' || event.state === 'planned') &&
    (event.groupId === undefined ||
      event.groupId === null ||
      typeof event.groupId === 'string');

  if (!isValidEvent) {
    return null;
  }

  const legacyGroupId =
    typeof event.categoryId === 'string' && event.categoryId !== 'uncategorized'
      ? event.categoryId
      : typeof event.cardTheme === 'string' &&
          event.cardTheme !== 'uncategorized'
        ? event.cardTheme
        : null;
  const storedGroupId =
    event.groupId === undefined
      ? legacyGroupId
      : event.groupId;
  const groupId = storedGroupId || null;

  return {
    id: event.id!,
    place: event.place!,
    detail: typeof event.detail === 'string' ? event.detail : undefined,
    eventDate: event.eventDate,
    arrivalTime: event.arrivalTime!,
    leaveTime: formatMinutes(parseTime(event.arrivalTime!)! - event.travelMinutes!),
    travelMinutes: event.travelMinutes!,
    preparationMinutes:
      event.preparationMinutes ?? DEFAULT_PREPARATION_MINUTES,
    state: event.state!,
    groupId,
  };
}

export function isFutureEvent(event: PlannedEvent, now = new Date()) {
  if (!isValidLocalDateId(event.eventDate)) {
    return false;
  }

  const todayId = toLocalDateId(now);

  if (event.eventDate > todayId) {
    return true;
  }

  if (event.eventDate < todayId) {
    return false;
  }

  const arrivalMinutes = parseTime(event.arrivalTime);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return arrivalMinutes !== null && arrivalMinutes > currentMinutes;
}

export function getEventDepartureTimestamp(event: PlannedEvent) {
  if (!isValidLocalDateId(event.eventDate) || !Number.isFinite(event.travelMinutes) || event.travelMinutes < 0) {
    return Number.POSITIVE_INFINITY;
  }

  const [year, month, day] = event.eventDate.split('-').map(Number);
  const arrivalMinutes = parseTime(event.arrivalTime);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    arrivalMinutes === null
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const arrivalDate = new Date(
    year,
    month - 1,
    day,
    Math.floor(arrivalMinutes / 60),
    arrivalMinutes % 60,
  );

  return arrivalDate.getTime() - event.travelMinutes * 60_000;
}

export function getEventPreparationTimestamp(event: PlannedEvent) {
  return (
    getEventDepartureTimestamp(event) - event.preparationMinutes * 60_000
  );
}

export function sortEventsByDeparture<T extends PlannedEvent>(
  events: readonly T[],
) {
  return [...events].sort(
    (firstEvent, secondEvent) =>
      getEventDepartureTimestamp(firstEvent) -
      getEventDepartureTimestamp(secondEvent),
  );
}
