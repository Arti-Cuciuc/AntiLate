import { Header } from './components/Header';
import { DownloadProvider } from './components/DownloadProvider';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';
import { Features } from './sections/Features';
import { Questions } from './sections/Questions';
import { REPOSITORY, RELEASES_URL } from './lib/release';

export function App() {
  return <DownloadProvider><a href="#main" className="skip-link">Перейти к содержимому</a><div id="top" /><Header /><main id="main"><Hero /><HowItWorks /><Features /><Questions /></main><footer className="page-container site-footer"><div><a href="#top" className="wordmark">AntiLate<span className="brand-dot" /></a><p>Для встреч. Для жизни. Вовремя.</p></div><nav aria-label="Ссылки проекта"><a href={REPOSITORY} target="_blank" rel="noreferrer">Исходный код ↗</a><a href={RELEASES_URL} target="_blank" rel="noreferrer">Версии приложения ↗</a></nav><span className="footer-year">© {new Date().getFullYear()} AntiLate</span></footer></DownloadProvider>;
}
