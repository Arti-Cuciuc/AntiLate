import { GROUP_COLOR_OPTIONS, MAX_GROUPS } from '../../../src/constants/groups';
import { MAX_TEMPLATES } from '../../../src/constants/templates';
import { useId } from 'react';
import { DARK_COLORS, LIGHT_COLORS, type ThemeColors, type ThemePreference } from '../../../src/constants/theme';
import { PREVIEW_TEXT } from '../lib/app-design';
import { PreviewHeader } from './PreviewScreens';

const demoGroups = [
  { name: 'Работа', color: '#4F46E5' },
  { name: 'Учёба', color: '#0284C7' },
  { name: 'Личное', color: '#9F1239' },
];

export function GroupsPreview({ onBack }: { onBack: () => void }) {
  return <section className="preview-page preview-management-page" aria-label="Пример управления группами">
    <PreviewHeader title="Группы" onBack={onBack} backLabel="Вернуться к настройкам примера" />
    <div className="preview-management-list">
      {demoGroups.map((group, index) => <article className="preview-group-card" key={group.name}>
        <div className="preview-group-row">
          <span className={'preview-group-color ' + (index === 0 ? 'expanded' : '')}><i style={{ background: group.color }} /></span>
          <span className="preview-group-name" style={PREVIEW_TEXT.medium}>{group.name}</span>
          <span className="preview-group-delete" style={PREVIEW_TEXT.small}>Удалить</span>
        </div>
        {index === 0 && <div className="preview-color-grid" aria-label="Палитра из 20 цветов">
          {GROUP_COLOR_OPTIONS.map(option => <span key={option.color} title={option.name} className={option.color === group.color ? 'selected' : ''} style={{ opacity: demoGroups.slice(1).some(other => other.color === option.color) ? .14 : 1 }}><i style={{ background: option.color }} /></span>)}
        </div>}
      </article>)}
    </div>
    <div className="preview-management-footer">
      <div className="preview-management-actions"><span style={PREVIEW_TEXT.small}>{demoGroups.length} из {MAX_GROUPS}</span><span className="preview-outline-action" style={PREVIEW_TEXT.mediumStrong}>+ Новая группа</span></div>
      <div className="preview-add-static" style={PREVIEW_TEXT.mediumStrong}>Сохранить</div>
    </div>
  </section>;
}

export function TemplatesPreview({ onBack }: { onBack: () => void }) {
  const templates = [
    { name: 'Университет', place: 'Первая пара · корпус А', schedule: 'Пн — Пт · 09:00', travel: 15, preparation: 20, group: demoGroups[1] },
    { name: 'Работа', place: 'Офис', schedule: 'Пн — Пт · 10:00', travel: 30, preparation: 20, group: demoGroups[0] },
    { name: 'Тренировка', place: 'Gym One', schedule: 'Вт, Чт, Сб · 18:30', travel: 15, preparation: 15, group: demoGroups[2] },
  ];
  return <section className="preview-page preview-management-page" aria-label="Пример повторяющихся шаблонов">
    <PreviewHeader title="Шаблоны встреч" onBack={onBack} backLabel="Вернуться к настройкам примера" />
    <div className="preview-management-list">{templates.map(template => <article className="preview-template-card" key={template.name}>
      <div className="preview-template-title"><div><h4 style={PREVIEW_TEXT.large}>{template.name}</h4><p style={PREVIEW_TEXT.medium}>{template.place}</p></div><span aria-hidden="true">›</span></div>
      <p className="preview-template-schedule" style={PREVIEW_TEXT.mediumStrong}>↻ {template.schedule}</p>
      <div className="preview-template-details" style={PREVIEW_TEXT.small}><span>В дороге {template.travel} мин · На сборы {template.preparation} мин</span><span><i style={{ background: template.group.color }} />{template.group.name}</span></div>
    </article>)}</div>
    <div className="preview-management-footer"><div className="preview-management-actions"><span style={PREVIEW_TEXT.small}>{templates.length} из {MAX_TEMPLATES}</span><span className="preview-outline-action" style={PREVIEW_TEXT.mediumStrong}>+ Новый шаблон</span></div></div>
  </section>;
}

export function AppearancePreview({ onBack, preference, onChange }: { onBack: () => void; preference: ThemePreference; onChange?: (preference: ThemePreference) => void }) {
  const radioName = useId();
  const options: { id: ThemePreference; name: string; description: string; palettes: ThemeColors[] }[] = [
    { id: 'light', name: 'Светлая', description: 'Светлые поверхности и чёткие линии', palettes: [LIGHT_COLORS] },
    { id: 'dark', name: 'Тёмная', description: 'Мягкий графит и тёплый свет', palettes: [DARK_COLORS] },
    { id: 'system', name: 'Как в системе', description: 'Меняется вместе с телефоном', palettes: [LIGHT_COLORS, DARK_COLORS] },
  ];
  return <section className="preview-page" aria-label="Пример настроек темы">
    <PreviewHeader title="Тема" onBack={onBack} backLabel="Вернуться к настройкам примера" />
    <div className="preview-appearance-options" role="group" aria-label="Тема оформления">{options.map(option => <label className={'preview-appearance-option ' + (option.id === preference ? 'selected' : '')} key={option.id}>
      <input className="preview-theme-input" type="radio" name={radioName} value={option.id} checked={option.id === preference} onChange={() => onChange?.(option.id)} disabled={!onChange} aria-label={option.name} />
      <div className="preview-theme-thumbnail" aria-hidden="true">{option.palettes.map((palette, index) => <div key={index} style={{ background: palette.paper }}><i style={{ background: palette.ink }} /><span style={{ background: palette.feature }} /><span style={{ background: palette.canvas, border: `1px solid ${palette.outline}` }} /></div>)}</div>
      <div className="preview-appearance-copy"><h4 style={PREVIEW_TEXT.mediumStrong}>{option.name}</h4><p style={PREVIEW_TEXT.small}>{option.description}</p></div>
      <span className="preview-radio" aria-hidden="true"><i /></span>
    </label>)}</div>
    <p className="preview-appearance-note" style={PREVIEW_TEXT.small}>Цвета ваших групп сохраняются в любой теме.</p>
  </section>;
}
