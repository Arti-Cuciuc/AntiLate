import {
  ALL_GROUPS_FILTER_ID,
  GROUP_COLOR_OPTIONS,
  GROUP_STARTING_COLOR_OPTIONS,
  MAX_GROUPS,
  UNGROUPED_FILTER_ID,
  UNGROUPED_GROUP,
} from '../constants/groups';
import { LIGHT_COLORS, type ThemeColors } from '../constants/theme';
import type { Group } from '../types/group';

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;
const RESERVED_GROUP_IDS = new Set([ALL_GROUPS_FILTER_ID, UNGROUPED_FILTER_ID]);
// Group colours are user data and remain identical in both appearance modes.
// Dark copy is reserved for truly pale backgrounds only. Medium and saturated
// colours deliberately keep the calmer white card typography.
const PALE_GROUP_BACKGROUND_LUMINANCE = 0.7;

export function isValidGroupColor(value: string) {
  return HEX_COLOR_PATTERN.test(value.toUpperCase());
}

export function getNextGroupColor(groups: Group[]) {
  const usedColors = new Set(groups.map((group) => group.color.toUpperCase()));
  const preferredOption = GROUP_STARTING_COLOR_OPTIONS[groups.length];

  return (
    (preferredOption && !usedColors.has(preferredOption.color)
      ? preferredOption.color
      : undefined) ??
    GROUP_STARTING_COLOR_OPTIONS.find((option) => !usedColors.has(option.color))
      ?.color ??
    GROUP_COLOR_OPTIONS.find((option) => !usedColors.has(option.color))
      ?.color ??
    GROUP_COLOR_OPTIONS[0].color
  );
}

export function getGroupPaletteOptions(currentGroup: Group, groups: Group[]) {
  const unavailableColors = new Set(
    groups
      .filter((group) => group.id !== currentGroup.id)
      .map((group) => group.color.toUpperCase()),
  );

  return GROUP_COLOR_OPTIONS.map((option) => ({
    ...option,
    isUnavailable: unavailableColors.has(option.color),
  }));
}

function parseHexColor(color: string) {
  const normalized = color.slice(1);

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toHex(value: number) {
  return Math.round(value).toString(16).padStart(2, '0').toUpperCase();
}

function darkenColor(color: string, factor: number) {
  const { red, green, blue } = parseHexColor(color);

  return `#${toHex(red * factor)}${toHex(green * factor)}${toHex(
    blue * factor,
  )}`;
}

function getLuminance(color: string) {
  const { red, green, blue } = parseHexColor(color);
  const channels = [red, green, blue].map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function getGroupAppearance(
  group: Pick<Group, 'color'> & Partial<Pick<Group, 'id'>>,
  colors: ThemeColors = LIGHT_COLORS,
) {
  const luminance = getLuminance(group.color);
  const isUngrouped = group.id === UNGROUPED_FILTER_ID;

  if (isUngrouped) {
    return {
      backgroundColor: colors.canvas,
      borderColor: colors.outline,
      textColor: colors.ink,
      mutedTextColor: colors.muted,
    };
  }
  // Only text colour is derived; a user's chosen background is never themed.
  // This intentionally does not choose the mathematically strongest contrast
  // for every shade: white remains the default for saturated group cards, and
  // dark copy appears only when a background is genuinely pale.
  const darkText = '#1C1A19';
  const lightText = '#FFFDFC';
  const textColor =
    luminance >= PALE_GROUP_BACKGROUND_LUMINANCE ? darkText : lightText;
  return {
    backgroundColor: group.color,
    borderColor:
      luminance < 0.06 && colors.paper !== LIGHT_COLORS.paper
        ? colors.outline
        : luminance > 0.92
          ? '#1C1A19'
          : darkenColor(group.color, 0.68),
    textColor,
    mutedTextColor: textColor,
  };
}

export function getGroup(groups: Group[], groupId?: string | null) {
  return groups.find((group) => group.id === groupId) ?? UNGROUPED_GROUP;
}

export function normalizeGroups(value: unknown): Group[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const ids = new Set<string>();
  const names = new Set<string>();
  const colors = new Set<string>();
  const groups: Group[] = [];

  for (const item of value) {
    if (groups.length >= MAX_GROUPS) {
      break;
    }

    if (!item || typeof item !== 'object') {
      continue;
    }

    const group = item as Partial<Group>;
    const id = typeof group.id === 'string' ? group.id : '';
    const name = typeof group.name === 'string' ? group.name.trim() : '';
    const color =
      typeof group.color === 'string' ? group.color.toUpperCase() : '';
    const normalizedName = name.toLocaleLowerCase('ru');

    if (
      !id ||
      RESERVED_GROUP_IDS.has(id) ||
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
