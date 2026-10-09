import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { parseSiteTheme, resolveSiteTheme, SITE_THEME_KEY, type SiteTheme, type SiteThemePreference } from '../lib/site-theme';

const ThemeContext = createContext<{
  preference: SiteThemePreference;
  theme: SiteTheme;
  setPreference: (value: SiteThemePreference) => void;
} | null>(null);

export function SiteThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<SiteThemePreference>(() => {
    try { return parseSiteTheme(localStorage.getItem(SITE_THEME_KEY)); }
    catch { return 'system'; }
  });
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = resolveSiteTheme(preference, systemDark);

  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    update();
    query.addEventListener('change', update);
    const sync = (event: StorageEvent) => {
      if (event.key === SITE_THEME_KEY || event.key === null) setPreference(parseSiteTheme(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => { query.removeEventListener('change', update); window.removeEventListener('storage', sync); };
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141516' : '#F7F5F1');
  }, [theme]);

  function change(value: SiteThemePreference) {
    setPreference(value);
    try { localStorage.setItem(SITE_THEME_KEY, value); } catch { /* Theme still works when storage is unavailable. */ }
  }

  return <ThemeContext.Provider value={{ preference, theme, setPreference: change }}>{children}</ThemeContext.Provider>;
}

export function useSiteTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useSiteTheme requires SiteThemeProvider');
  return context;
}
