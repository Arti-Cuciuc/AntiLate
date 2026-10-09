import { DownloadButton } from './DownloadProvider';

export function Header() {
  return <header className="site-header">
    <div className="page-container header-island flex items-center justify-between gap-6">
      <a className="wordmark" href="#top" aria-label="AntiLate — в начало">AntiLate</a>
      <nav className="hidden items-center gap-8 md:flex" aria-label="Основная навигация">
        <a href="#how-it-works">Как это работает</a><a href="#features">Возможности</a><a href="#questions">Вопросы</a>
      </nav>
      <DownloadButton compact />
    </div>
  </header>;
}
