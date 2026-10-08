import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ALL_GROUPS_FILTER_ID,
  GROUP_COLOR_OPTIONS,
  MAX_GROUPS,
  UNGROUPED_FILTER_ID,
} from '../constants/groups';
import type { Group } from '../types/group';
import { isValidGroupColor, normalizeGroups } from '../utils/groups';

const GROUPS_STORAGE_KEY = '@antilate/groups/v1';
const LEGACY_STORAGE_KEYS = [
  '@antilate/categories/v3',
  '@antilate/categories/v2',
  '@antilate/categories/v1',
] as const;
const LEGACY_AUTOMATIC_NAMES = new Set(
  [
    ...GROUP_COLOR_OPTIONS.map((option) => option.name),
    'Ice Blue',
    'Sky',
    'Ocean',
    'Royal Blue',
    'Indigo',
    'Mint',
    'Emerald',
    'Forest',
    'Olive',
    'Lime',
    'Cream',
    'Amber',
    'Orange',
    'Coral',
    'Red',
    'Rose',
    'Burgundy',
    'Violet',
    'Purple',
    'Midnight',
    'Pure White',
    'Snow',
    'Pearl',
    'Cloud Gray',
    'Silver Mist',
    'Slate Gray',
    'Steel',
    'Charcoal',
    'Graphite',
    'Dark Slate',
    'Obsidian',
    'Обычный',
    'Белый',
    'Бордо',
    'Шалфей',
    'Небо',
    'Песок',
    'Песочный',
    'Лавандовый',
    'Пудровый',
    'Ванильный',
  ].map((name) => name.toLocaleLowerCase('ru')),
);

function migrateNamedLegacyGroups(value: unknown): Group[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = new Set<string>();
  const names = new Set<string>();
  const colors = new Set<string>();
  const groups: Group[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object' || groups.length >= MAX_GROUPS) {
      continue;
    }

    const legacyItem = item as {
      id?: unknown;
      name?: unknown;
      color?: unknown;
      isNameCustomized?: unknown;
    };
    const id = typeof legacyItem.id === 'string' ? legacyItem.id : '';
    const name =
      typeof legacyItem.name === 'string' ? legacyItem.name.trim() : '';
    const color =
      typeof legacyItem.color === 'string'
        ? legacyItem.color.toUpperCase()
        : '';
    const normalizedName = name.toLocaleLowerCase('ru');
    const hasUserName =
      legacyItem.isNameCustomized === true ||
      (legacyItem.isNameCustomized === undefined &&
        !LEGACY_AUTOMATIC_NAMES.has(normalizedName));

    if (
      !hasUserName ||
      !id ||
      id === ALL_GROUPS_FILTER_ID ||
      id === UNGROUPED_FILTER_ID ||
      ids.has(id) ||
      !name ||
      name.length > 24 ||
      names.has(normalizedName) ||
      !isValidGroupColor(color) ||
      colors.has(color)
    ) {
      continue;
    }

    ids.add(id);
    names.add(normalizedName);
    colors.add(color);
    groups.push({ id, name, color });
  }

  return groups;
}

export async function loadStoredGroups() {
  const storedGroups = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);

  if (storedGroups !== null) {
    const parsed: unknown = JSON.parse(storedGroups);
    const groups = normalizeGroups(parsed);
    if (
      groups === null ||
      !Array.isArray(parsed) ||
      groups.length !== parsed.length
    ) {
      throw new Error('Invalid stored groups');
    }
    return groups;
  }

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const storedLegacyGroups = await AsyncStorage.getItem(legacyKey);

    if (storedLegacyGroups !== null) {
      const legacyGroups: unknown = JSON.parse(storedLegacyGroups);
      if (!Array.isArray(legacyGroups))
        throw new Error('Invalid legacy groups');
      return migrateNamedLegacyGroups(legacyGroups);
    }
  }

  return [];
}

export async function saveStoredGroups(groups: Group[]) {
  await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
}
