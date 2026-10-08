import type {
  MeetingTemplate,
  TemplateWeekday,
} from '../types/template';
import type {
  DisplayEvent,
  RecurringDisplayEvent,
} from '../types/display-event';
import { addDays, toLocalDateId } from './date';
import { formatMinutes, parseTime } from './time';

export const TEMPLATE_WEEKDAY_SHORT_LABELS: Record<
  TemplateWeekday,
  string
> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
};

export const TEMPLATE_WEEKDAY_FULL_LABELS: Record<
  TemplateWeekday,
  string
> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье',
};

export const TEMPLATE_WEEKDAYS: TemplateWeekday[] = [1, 2, 3, 4, 5, 6, 7];
const WORKDAYS: TemplateWeekday[] = [1, 2, 3, 4, 5];
const WEEKEND: TemplateWeekday[] = [6, 7];

function isTemplateWeekday(value: unknown): value is TemplateWeekday {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

function getNormalizedWeekdays(values: readonly TemplateWeekday[]) {
  return TEMPLATE_WEEKDAYS.filter((weekday) => values.includes(weekday));
}

function hasExactWeekdays(
  weekdays: readonly TemplateWeekday[],
  expected: readonly TemplateWeekday[],
) {
  return (
    weekdays.length === expected.length &&
    weekdays.every((weekday, index) => weekday === expected[index])
  );
}

function getLocalWeekday(date: Date): TemplateWeekday {
  const weekday = date.getDay();

  return (weekday === 0 ? 7 : weekday) as TemplateWeekday;
}

function hasValidDuration(value: number) {
  return Number.isInteger(value) && value > 0 && value <= 720;
}

export function getRecurringWeekdaysLabel(
  weekdays: readonly TemplateWeekday[],
) {
  const normalizedWeekdays = getNormalizedWeekdays(weekdays);

  if (hasExactWeekdays(normalizedWeekdays, WORKDAYS)) {
    return 'Пн–Пт';
  }

  if (hasExactWeekdays(normalizedWeekdays, WEEKEND)) {
    return 'Сб–Вс';
  }

  return normalizedWeekdays
    .map((weekday) => TEMPLATE_WEEKDAY_SHORT_LABELS[weekday])
    .join(', ');
}

export function getNextRecurringEvent(
  template: MeetingTemplate,
  now = new Date(),
): RecurringDisplayEvent | null {
  const arrivalTime = template.arrivalTime;
  const arrivalMinutes = arrivalTime ? parseTime(arrivalTime) : null;
  const recurrenceWeekdays = Array.isArray(template.recurrence?.weekdays)
    ? template.recurrence.weekdays
    : [];

  if (
    !template.recurrence?.isEnabled ||
    !arrivalTime ||
    arrivalMinutes === null ||
    recurrenceWeekdays.length === 0 ||
    !recurrenceWeekdays.every(isTemplateWeekday) ||
    !hasValidDuration(template.travelMinutes) ||
    !hasValidDuration(template.preparationMinutes)
  ) {
    return null;
  }

  const normalizedWeekdays = getNormalizedWeekdays(recurrenceWeekdays);

  for (let offset = 0; offset <= 7; offset += 1) {
    const eventDay = addDays(now, offset);

    if (!normalizedWeekdays.includes(getLocalWeekday(eventDay))) {
      continue;
    }

    const arrivalDate = new Date(
      eventDay.getFullYear(),
      eventDay.getMonth(),
      eventDay.getDate(),
      Math.floor(arrivalMinutes / 60),
      arrivalMinutes % 60,
      0,
      0,
    );

    if (arrivalDate.getTime() <= now.getTime()) {
      continue;
    }

    const eventDate = toLocalDateId(arrivalDate);

    return {
      id: `recurring:${template.id}:${eventDate}`,
      place: template.place,
      detail: template.detail,
      eventDate,
      arrivalTime,
      leaveTime: formatMinutes(arrivalMinutes - template.travelMinutes),
      travelMinutes: template.travelMinutes,
      preparationMinutes: template.preparationMinutes,
      state: 'planned',
      groupId: template.groupId,
      recurringTemplateId: template.id,
      recurrenceWeekdays: normalizedWeekdays,
    };
  }

  return null;
}

export function getNextRecurringEvents(
  templates: readonly MeetingTemplate[],
  now = new Date(),
): DisplayEvent[] {
  return templates.reduce<DisplayEvent[]>((events, template) => {
    const event = getNextRecurringEvent(template, now);

    if (event) {
      events.push(event);
    }

    return events;
  }, []);
}
