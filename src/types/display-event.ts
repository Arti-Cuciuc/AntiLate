import type { PlannedEvent } from './event';
import type { TemplateWeekday } from './template';

/**
 * Event prepared for the home screen. Recurring metadata is present only for
 * derived occurrences, while ordinary persisted events remain unchanged.
 */
export type DisplayEvent = PlannedEvent & {
  recurringTemplateId?: string;
  recurrenceWeekdays?: TemplateWeekday[];
};

export type RecurringDisplayEvent = DisplayEvent & {
  recurringTemplateId: string;
  recurrenceWeekdays: TemplateWeekday[];
};

export function isRecurringDisplayEvent(
  event: DisplayEvent,
): event is RecurringDisplayEvent {
  return typeof event.recurringTemplateId === 'string';
}
