import { useEffect, useState } from 'react';
import { resolveTheme, type ThemePreference } from '../../../src/constants/theme';
import { AppPreview, type PreviewMode } from '../components/AppPreview';
import { Arrow } from '../components/Icons';

const features: { id: PreviewMode; title: string; description: string; note: string }[] = [
  { id: 'groups', title: 'Группы встреч', description: 'Работа, учёба, личное. Создайте свои группы, дайте им названия и выберите цвета. На главном экране можно оставить только нужные встречи.', note: 'До 8 групп. Названия и цвета выбираете вы.' },
  { id: 'schedule', title: 'Повторяющиеся шаблоны', description: 'Каждый день в университет или на работу по будням. Один раз задайте время и дни повторения — следующая встреча появится сама.', note: 'Все регулярные планы — в умной группе «Расписание».' },
  { id: 'themes', title: 'Светлая и тёмная тема', description: 'Выберите светлое оформление, мягкий графит или тему телефона. Цвета ваших групп остаются прежними — меняется только окружение.', note: 'Нажмите на вариант темы прямо в телефоне.' },
];

export function Features() {
  const [active, setActive] = useState<PreviewMode>('groups');
  const [theme, setTheme] = useState<ThemePreference>('light');
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const [previewRevision, setPreviewRevision] = useState(0);
  const current = features.find(feature => feature.id === active)!;
  return <section id="features" className="features-section" aria-labelledby="features-title">
    <div className="page-container features-grid">
      <div className="feature-copy"><p className="section-index">02 / В вашем ритме</p><h2 id="features-title">Не новая привычка.<br /><span>Просто легче жить.</span></h2>
        <div className="feature-options" aria-label="Возможности приложения">{features.map((feature, index) => <button key={feature.id} aria-controls="feature-preview" aria-pressed={feature.id === active} className={feature.id === active ? 'active' : ''} onClick={() => { setActive(feature.id); setPreviewRevision(value => value + 1); }}><span className="feature-number">0{index + 1}</span><span>{feature.title}</span><Arrow /></button>)}</div>
        <div className="feature-description" aria-live="polite"><p>{current.description}</p><span>{current.note}</span></div>
        <p className="privacy-note">Ваши планы остаются на вашем телефоне.<br />Без аккаунта и облачной синхронизации.</p>
      </div>
      <div id="feature-preview" className="feature-product">
        <AppPreview key={`${active}-${previewRevision}`} theme={active === 'themes' ? resolveTheme(theme, systemDark ? 'dark' : 'light') : 'light'} appearancePreference={theme} onAppearanceChange={setTheme} mode={active} initialScreen={active === 'groups' ? 'groups' : active === 'schedule' ? 'templates' : 'appearance'} />
        <p className="feature-preview-label">{active === 'groups' ? 'Настройки → Группы' : active === 'schedule' ? 'Настройки → Шаблоны встреч' : 'Настройки → Тема'}</p>
      </div>
    </div>
  </section>;
}
