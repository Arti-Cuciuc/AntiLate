export function isValidLocalDateId(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function resolveEventDay(value: string, today: Date) {
  const day = Number(value);

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return null;
  }

  const monthOffset = day < today.getDate() ? 1 : 0;
  const expectedMonth = (today.getMonth() + monthOffset) % 12;
  const expectedYear =
    today.getFullYear() + (today.getMonth() + monthOffset > 11 ? 1 : 0);
  const date = new Date(expectedYear, expectedMonth, day);

  if (
    date.getFullYear() !== expectedYear ||
    date.getMonth() !== expectedMonth ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatResolvedDate(date: Date) {
  const monthNames = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];

  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
}

export function toLocalDateId(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function formatEventDateLabel(eventDate?: string, today = new Date()) {
  if (!eventDate) {
    return 'к этому времени';
  }

  const todayId = toLocalDateId(today);
  const tomorrowId = toLocalDateId(addDays(today, 1));

  if (eventDate === todayId) {
    return 'сегодня';
  }

  if (eventDate === tomorrowId) {
    return 'завтра';
  }

  const [year, month, day] = eventDate.split('-').map(Number);
  const monthNames = [
    'янв.',
    'февр.',
    'мар.',
    'апр.',
    'мая',
    'июн.',
    'июл.',
    'авг.',
    'сент.',
    'окт.',
    'нояб.',
    'дек.',
  ];
  const yearSuffix = year === today.getFullYear() ? '' : ` ${year}`;

  return `${day} ${monthNames[month - 1]}${yearSuffix}`;
}
