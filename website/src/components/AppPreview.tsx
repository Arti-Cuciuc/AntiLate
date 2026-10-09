import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { ThemePreference } from '../../../src/constants/theme';
import { PREVIEW_SCREEN, PREVIEW_TEXT, previewDesign } from '../lib/app-design';
import { SettingsIcon } from './Icons';
import { NewEventPreview, SettingsPreview } from './PreviewScreens';
import { AppearancePreview, GroupsPreview, TemplatesPreview } from './FeatureScreens';
import { useSiteTheme } from './SiteThemeProvider';

export type PreviewTheme = 'light' | 'dark';
export type PreviewMode = 'groups' | 'schedule' | 'themes';
type PreviewScreen = 'home' | 'settings' | 'new' | 'groups' | 'templates' | 'appearance';
export const STAGES = [
  { clock: '08:20', countdown: '15 мин', label: 'до сборов', status: 'Можно не спешить', dot: '#22C55E' },
  { clock: '08:35', countdown: '20 мин', label: 'до выхода', status: 'Пора собирать вещи', dot: '#FACC15' },
  { clock: '08:55', countdown: '1 сек', label: 'после времени выхода', status: 'Нужно выходить', dot: '#EF4444' },
];

type DemoEvent = {
  id: string; group: string; place: string; comment: string;
  time: string; leave: string; travel: number; color: string; recurring?: boolean;
};

function EventPreview({ event, dark }: { event: DemoEvent; dark: boolean }) {
  const appearance = previewDesign(dark).event(event.color);
  const style = {
    backgroundColor: appearance.backgroundColor,
    borderColor: appearance.borderColor,
    color: appearance.textColor,
    '--event-border': appearance.borderColor,
  } as CSSProperties;
  // DOM adaptation of EventCard.tsx: same structure, dimensions and text styles.
  return <article className="preview-event" style={style}>
    <div className="preview-event-top">
      <div className="preview-event-copy">
        <h3 style={PREVIEW_TEXT.large}>{event.place}</h3>
        <p style={PREVIEW_TEXT.small}>{event.comment}</p>
      </div>
      <div className="preview-event-date">
        <strong style={PREVIEW_TEXT.large}>{event.time}</strong>
        <p style={PREVIEW_TEXT.small}>сегодня</p>
        {event.recurring && <p style={PREVIEW_TEXT.small}>↻ Пн — Пт</p>}
      </div>
    </div>
    <div className="preview-event-divider" />
    <div className="preview-event-bottom" style={PREVIEW_TEXT.medium}>
      <span>Выход <b style={PREVIEW_TEXT.mediumStrong}>{event.leave}</b></span>
      <span>В дороге <b style={PREVIEW_TEXT.mediumStrong}>{event.travel} мин</b></span>
    </div>
  </article>;
}

export function AppPreview({ theme: previewTheme, mode = 'groups', stage = 0, hero = false, initialScreen = 'home', appearancePreference, onAppearanceChange }: {
  theme?: PreviewTheme; mode?: PreviewMode; stage?: number; hero?: boolean;
  initialScreen?: PreviewScreen;
  appearancePreference?: ThemePreference;
  onAppearanceChange?: (preference: ThemePreference) => void;
}) {
  const [group, setGroup] = useState('Все');
  const [screen, setScreen] = useState<PreviewScreen>(initialScreen);
  const [scale, setScale] = useState(1);
  const frame = useRef<HTMLDivElement>(null);
  const { theme: siteTheme } = useSiteTheme();
  const theme = previewTheme ?? siteTheme;
  const dark = theme === 'dark';
  const design = previewDesign(dark);
  const state = STAGES[stage];
  const schedule = mode === 'schedule';
  const events: DemoEvent[] = [
    { id: 'personal', group: schedule ? 'Расписание' : 'Личное', place: schedule ? 'Университет' : 'Встреча за кофе', comment: schedule ? 'Первая пара · корпус А' : 'Взять с собой хорошее настроение', time: schedule ? '09:30' : '09:15', leave: '08:55', travel: schedule ? 35 : 20, color: '#9F1239', recurring: schedule },
    { id: 'work', group: 'Работа', place: 'Встреча команды', comment: 'Обсудить новый проект', time: '14:00', leave: '13:30', travel: 30, color: '#4F46E5' },
  ];
  const chips = schedule ? ['Все', 'Расписание', 'Работа'] : ['Все', 'Личное', 'Работа'];
  const visible = group === 'Все' ? events : events.filter(event => event.group === group);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const resize = () => setScale(element.clientWidth / PREVIEW_SCREEN.width);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function returnHome() {
    setGroup('Все');
  }

  return <div className={'app-preview ' + (dark ? 'app-preview-dark ' : '') + (hero ? 'app-preview-hero' : '')} style={design.variables}>
    <div className="preview-scale-space" ref={frame}>
      <div className="preview-scene" style={{ transform: 'scale(' + scale + ')' }}>
        <div className="preview-status" aria-hidden="true"><span>{state.clock}</span><span className="flex items-center gap-2"><svg width="15" height="14" viewBox="0 0 15 14" fill="currentColor"><path d="M0 11h3v3H0zm4-3h3v6H4zm4-4h3v10H8zm4-4h3v14h-3z" /></svg><span className="battery" /></span></div>
        <div className="preview-screen-transition" key={screen}>
        {screen === 'home' ? <><div className="preview-nav">
          <button className="preview-settings" aria-label="Открыть настройки примера" onClick={() => setScreen('settings')}><SettingsIcon size={25} strokeWidth={2.4} /></button>
          <button className="preview-brand" onClick={returnHome} style={PREVIEW_TEXT.large} aria-label="В начало примера">AntiLate</button>
          <button className="preview-plus" onClick={() => setScreen('new')} aria-label="Добавить новую встречу в примере">+</button>
        </div>
        <div className="preview-scroll" role="region" aria-label="Пример главного экрана AntiLate">
          <div className="preview-content">
            <div className="preview-countdown">
              <div className="preview-countdown-top">
                <div className="preview-countdown-time"><strong style={PREVIEW_TEXT.large}>{state.countdown}</strong><p style={PREVIEW_TEXT.small}>{state.label}</p></div>
                <div className="preview-mood" style={PREVIEW_TEXT.medium}><span>{state.status}</span><i style={{ backgroundColor: state.dot }} /></div>
              </div>
              <div className="preview-countdown-divider" />
              <div className="preview-countdown-bottom" style={PREVIEW_TEXT.medium}><span>Сборы <b style={PREVIEW_TEXT.mediumStrong}>08:35</b></span><span>Выход <b style={PREVIEW_TEXT.mediumStrong}>08:55</b></span></div>
            </div>
            <div className="preview-filters" aria-label="Пример фильтрации встреч">
              {chips.map(chip => <button key={chip} onClick={() => setGroup(chip)} aria-pressed={group === chip} className={group === chip ? 'selected' : ''}>
                {chip === 'Расписание' ? <span style={PREVIEW_TEXT.medium}>↻</span> : chip !== 'Все' && <i className={'chip-dot ' + (chip === 'Работа' ? 'chip-dot-work' : '')} />}
                <span style={group === chip ? PREVIEW_TEXT.mediumStrong : PREVIEW_TEXT.medium}>{chip}</span>
                <span className="preview-filter-count" style={PREVIEW_TEXT.small}>{chip === 'Все' ? events.length : events.filter(event => event.group === chip).length}</span>
              </button>)}
            </div>
            <div className="preview-event-list" key={group}>{visible.map(event => <EventPreview key={event.id} event={event} dark={dark} />)}</div>
          </div>
        </div>
        </> : screen === 'settings'
          ? <SettingsPreview dark={dark} onBack={() => setScreen('home')} />
          : screen === 'new' ? <NewEventPreview onBack={() => setScreen('home')} />
          : screen === 'groups' ? <GroupsPreview onBack={() => setScreen('settings')} />
          : screen === 'templates' ? <TemplatesPreview onBack={() => setScreen('settings')} />
          : <AppearancePreview preference={appearancePreference ?? theme} onChange={onAppearanceChange} onBack={() => setScreen('settings')} />}
        </div>
        <div className="preview-system-navigation" aria-hidden="true"><span className="home-indicator" /></div>
      </div>
    </div>
  </div>;
}
