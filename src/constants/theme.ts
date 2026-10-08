export type ThemePreference = 'system' | 'light' | 'dark';
export type ThemeName = Exclude<ThemePreference, 'system'>;

export const LIGHT_COLORS = {
  paper: '#F7F5F1',
  canvas: '#FFFDFC',
  ink: '#1C1A19',
  muted: '#817A73',
  placeholder: '#A49D96',
  outline: '#1C1A19',
  divider: '#D8D2CB',
  action: '#1C1A19',
  onAction: '#FFFDFC',
  onActionMuted: '#CBC7C3',
  tint: '#F7F3EF',
  wine: '#9D174D',
  wineDark: '#701137',
  error: '#B4233B',
  danger: '#C62F3F',
  onDanger: '#FFFFFF',
  nav: '#E7E2DC',
  navBorder: '#D2CCC5',
  sheet: '#E6E1DB',
  overlay: 'rgba(28,26,25,0.38)',
  feature: '#171717',
  onFeature: '#FFFDFC',
  featureMuted: '#B7B0AA',
  featureDivider: '#3B3B3B',
} as const;

export type ThemeColors = { [K in keyof typeof LIGHT_COLORS]: string };

export const DARK_COLORS: ThemeColors = {
  paper: '#141516',
  canvas: '#1F2123',
  ink: '#F0ECE5',
  muted: '#B2ADA6',
  placeholder: '#96918A',
  outline: '#484A4D',
  divider: '#37393C',
  action: '#E9E3DA',
  onAction: '#1C1A19',
  onActionMuted: '#57514B',
  tint: '#252729',
  wine: '#F19AAF',
  wineDark: '#F19AAF',
  error: '#FF9BA8',
  danger: '#C93549',
  onDanger: '#FFFFFF',
  nav: '#292B2D',
  navBorder: '#45474A',
  sheet: '#292B2D',
  overlay: 'rgba(0,0,0,0.65)',
  feature: '#282A2D',
  onFeature: '#F4F0E9',
  featureMuted: '#B9B4AD',
  featureDivider: '#46484B',
};

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Как в системе',
  light: 'Светлая',
  dark: 'Тёмная',
};

export function resolveTheme(
  preference: ThemePreference,
  system: string | null | undefined,
): ThemeName {
  return preference === 'system'
    ? system === 'dark'
      ? 'dark'
      : 'light'
    : preference;
}
