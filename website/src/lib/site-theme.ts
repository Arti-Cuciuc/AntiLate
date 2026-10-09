export type SiteThemePreference = 'system' | 'light' | 'dark';
export type SiteTheme = 'light' | 'dark';
export const SITE_THEME_KEY = 'antilate:site-theme:v1';

export function parseSiteTheme(value: unknown): SiteThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveSiteTheme(preference: SiteThemePreference, systemDark: boolean): SiteTheme {
  return preference === 'system' ? systemDark ? 'dark' : 'light' : preference;
}
