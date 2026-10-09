import { AppPreview } from '../components/AppPreview';
import { DownloadButton, DownloadStatus } from '../components/DownloadProvider';
import { Arrow } from '../components/Icons';

export function Hero() {
  return <section className="hero page-container" aria-labelledby="hero-title">
    <div className="hero-copy">
      <div className="hero-platform"><span className="status-dot" />Ваше время. Под контролем.</div>
      <h1 id="hero-title">Вовремя.<br /><span>Без суеты.</span></h1>
      <p className="hero-description">Не только когда быть на месте.<br className="hidden sm:block" /> А когда собираться и когда выходить.</p>
      <div className="hero-actions"><DownloadButton /><a href="#how-it-works" className="text-link">Посмотреть, как работает <Arrow /></a></div>
      <p className="hero-note">Для Android · Без регистрации</p>
      <DownloadStatus />
    </div>
    <div className="hero-product">
      <AppPreview hero />
    </div>
    <div className="hero-bottom" aria-hidden="true" />
  </section>;
}
