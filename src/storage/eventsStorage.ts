import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PlannedEvent } from '../types/event';
import { isFutureEvent, normalizePlannedEvent } from '../utils/events';

const EVENTS_STORAGE_KEY = '@antilate/events/v2';
const LEGACY_EVENTS_STORAGE_KEY = '@antilate/events/v1';

export async function loadStoredEvents() {
  const storedEvents = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
  const legacyEvents =
    storedEvents === null
      ? await AsyncStorage.getItem(LEGACY_EVENTS_STORAGE_KEY)
      : null;
  const serializedEvents = storedEvents ?? legacyEvents;
  const parsedEvents: unknown =
    serializedEvents === null ? [] : JSON.parse(serializedEvents);

  if (!Array.isArray(parsedEvents)) {
    throw new Error('Invalid stored events');
  }

  const normalizedEvents = parsedEvents.map(normalizePlannedEvent);
  if (
    storedEvents !== null &&
    normalizedEvents.some((event) => event === null)
  ) {
    throw new Error('Invalid stored event');
  }
  return normalizedEvents
    .filter((event): event is PlannedEvent => event !== null)
    .filter((event) => isFutureEvent(event));
}

export async function saveStoredEvents(events: PlannedEvent[]) {
  await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}
