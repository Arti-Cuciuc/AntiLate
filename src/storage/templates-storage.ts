import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_TEMPLATES } from '../constants/templates';
import type { MeetingTemplate, TemplateWeekday } from '../types/template';
import { parseTime } from '../utils/time';

const TEMPLATES_STORAGE_KEY = '@antilate/templates/v1';
const MAX_DURATION_MINUTES = 720;

function isValidDuration(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_DURATION_MINUTES
  );
}

function normalizeWeekdays(value: unknown): TemplateWeekday[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value)]
    .filter(
      (weekday): weekday is TemplateWeekday =>
        typeof weekday === 'number' &&
        Number.isInteger(weekday) &&
        weekday >= 1 &&
        weekday <= 7,
    )
    .sort((firstWeekday, secondWeekday) => firstWeekday - secondWeekday);
}

export function normalizeMeetingTemplate(
  value: unknown,
): MeetingTemplate | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const template = value as Partial<MeetingTemplate>;
  const id = typeof template.id === 'string' ? template.id.trim() : '';
  const name = typeof template.name === 'string' ? template.name.trim() : '';
  const place = typeof template.place === 'string' ? template.place.trim() : '';

  if (
    !id ||
    !name ||
    !place ||
    !isValidDuration(template.travelMinutes) ||
    !isValidDuration(template.preparationMinutes) ||
    typeof template.createdAt !== 'number' ||
    !Number.isFinite(template.createdAt) ||
    template.createdAt < 0
  ) {
    return null;
  }

  const detail =
    typeof template.detail === 'string' && template.detail.trim()
      ? template.detail.trim()
      : undefined;
  const arrivalTime =
    typeof template.arrivalTime === 'string' &&
    parseTime(template.arrivalTime) !== null
      ? template.arrivalTime
      : undefined;
  const groupId =
    typeof template.groupId === 'string' && template.groupId.trim()
      ? template.groupId.trim()
      : null;
  const recurrenceValue =
    template.recurrence && typeof template.recurrence === 'object'
      ? template.recurrence
      : null;

  return {
    id,
    name,
    place,
    detail,
    arrivalTime,
    travelMinutes: template.travelMinutes,
    preparationMinutes: template.preparationMinutes,
    groupId,
    recurrence: {
      isEnabled: recurrenceValue?.isEnabled === true,
      weekdays: normalizeWeekdays(recurrenceValue?.weekdays),
    },
    createdAt: template.createdAt,
  };
}

export function normalizeMeetingTemplates(value: unknown): MeetingTemplate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = new Set<string>();
  const names = new Set<string>();
  const templates: MeetingTemplate[] = [];

  for (const item of value) {
    if (templates.length >= MAX_TEMPLATES) {
      break;
    }

    const template = normalizeMeetingTemplate(item);

    if (!template) {
      continue;
    }

    const normalizedName = template.name.toLocaleLowerCase('ru');

    if (ids.has(template.id) || names.has(normalizedName)) {
      continue;
    }

    ids.add(template.id);
    names.add(normalizedName);
    templates.push(template);
  }

  return templates;
}

export async function loadStoredTemplates() {
  const storedTemplates = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);

  const parsed: unknown =
    storedTemplates === null ? [] : JSON.parse(storedTemplates);
  if (!Array.isArray(parsed)) throw new Error('Invalid stored templates');
  const templates = normalizeMeetingTemplates(parsed);
  if (templates.length !== parsed.length)
    throw new Error('Invalid stored template');
  return templates;
}

export async function saveStoredTemplates(templates: MeetingTemplate[]) {
  await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}
