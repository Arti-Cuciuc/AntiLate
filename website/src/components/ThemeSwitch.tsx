import { useRef } from 'react';
import { useSiteTheme } from './SiteThemeProvider';

function ThemeGlyph({ dark }: { dark: boolean }) {
  return <span className={`theme-glyph ${dark ? 'theme-glyph-dark' : ''}`} aria-hidden="true">
    <svg className="theme-sun" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" /><path className="theme-rays" d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
    <svg className="theme-moon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 13.1A9 9 0 0 1 10.9 3.2 9 9 0 1 0 20.8 13.1Z" />
    </svg>
  </span>;
}

export function ThemeSwitch() {
  const { theme, preference, setPreference } = useSiteTheme();
  const toggle = useRef<HTMLButtonElement>(null);

  function changeTheme() {
    const rect = toggle.current?.getBoundingClientRect();
    setPreference(theme === 'dark' ? 'light' : 'dark', rect ? {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    } : undefined);
  }

  return <div className="theme-switch">
    <button ref={toggle} className="theme-toggle" aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'} onClick={changeTheme}>
      <ThemeGlyph dark={theme === 'dark'} />
      {preference === 'system' && <span className="theme-system-dot" aria-hidden="true" />}
    </button>
  </div>;
}
