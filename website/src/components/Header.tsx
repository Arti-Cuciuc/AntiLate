import { DownloadButton } from './DownloadProvider';
import { useSiteTheme } from './SiteThemeProvider';
import { parseSiteTheme } from '../lib/site-theme';

export function Header() {
  const { preference, setPreference } = useSiteTheme();
  return <header className="site-header">
    <div className="page-container header-island flex items-center justify-between gap-6">
      <a className="wordmark" href="#top" aria-label="AntiLate — в начало">AntiLate</a>
      <nav className="hidden items-center gap-8 md:flex" aria-label="Основная навигация">
        <a href="#how-it-works">Как это работает</a><a href="#features">Возможности</a><a href="#questions">Вопросы</a>
      </nav>
      <div className="header-actions">
        <select className="site-theme-select" aria-label="Тема сайта" value={preference} onChange={event => setPreference(parseSiteTheme(event.target.value))}>
          <option value="system">Как в системе</option><option value="light">Светлая</option><option value="dark">Тёмная</option>
        </select>
        <DownloadButton compact />
      </div>
    </div>
  </header>;
}
