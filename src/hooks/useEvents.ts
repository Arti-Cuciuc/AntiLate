import { useEffect } from 'react';
import { AppState } from 'react-native';

import { loadStoredEvents, saveStoredEvents } from '../storage/eventsStorage';
import type { PlannedEvent } from '../types/event';
import { isFutureEvent } from '../utils/events';
import { usePersistedCollection } from './use-persisted-collection';

export function useEvents() {
  const storage = usePersistedCollection(loadStoredEvents, saveStoredEvents);
  const { items: events, setItems: setEvents, isHydrated } = storage;

  useEffect(() => {
    if (!isHydrated) {
      return undefined;
    }

    const removeExpiredEvents = () => {
      setEvents((currentEvents) => {
        const activeEvents = currentEvents.filter((event) =>
          isFutureEvent(event),
        );

        return activeEvents.length === currentEvents.length
          ? currentEvents
          : activeEvents;
      });
    };

    const interval = setInterval(removeExpiredEvents, 60_000);
    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          removeExpiredEvents();
        }
      },
    );

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [isHydrated, setEvents]);

  const addEvent = (event: PlannedEvent) => {
    setEvents((currentEvents) => [event, ...currentEvents]);
  };

  const updateEvent = (event: PlannedEvent) => {
    setEvents((currentEvents) =>
      currentEvents.map((currentEvent) =>
        currentEvent.id === event.id ? event : currentEvent,
      ),
    );
  };

  const deleteEvent = (eventId: string) => {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId),
    );
  };

  const unassignDeletedGroups = (validGroupIds: string[]) => {
    const validIds = new Set(validGroupIds);

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.groupId === null || validIds.has(event.groupId)
          ? event
          : { ...event, groupId: null },
      ),
    );
  };

  return {
    storage,
    addEvent,
    deleteEvent,
    events,
    isHydrated,
    unassignDeletedGroups,
    updateEvent,
  };
}
