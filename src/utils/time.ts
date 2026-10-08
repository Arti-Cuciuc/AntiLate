export function parseTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatTimeInput(value: string, previousValue = '') {
  if (
    previousValue.endsWith(':') &&
    value === previousValue.slice(0, -1)
  ) {
    return value.replace(/\D/g, '').slice(0, -1);
  }

  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length === 0) {
    return '';
  }

  if (digits.length === 1) {
    return /^[3-9]$/.test(digits) ? `0${digits}:` : digits;
  }

  if (digits.length === 2) {
    return `${digits}:`;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function getTimeInputError(value: string) {
  const match = /^(\d{2}):(\d{0,2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = match[2];

  if (hours > 23) {
    return 'Часы должны быть от 00 до 23.';
  }

  if (minutes.length > 0 && Number(minutes[0]) > 5) {
    return 'Минуты должны быть от 00 до 59.';
  }

  if (minutes.length === 2 && Number(minutes) > 59) {
    return 'Минуты должны быть от 00 до 59.';
  }

  return null;
}

export function formatMinutes(totalMinutes: number) {
  const minutesInDay = 24 * 60;
  const normalizedMinutes =
    ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
