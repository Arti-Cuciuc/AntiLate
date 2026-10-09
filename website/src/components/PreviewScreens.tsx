import { PREVIEW_TEXT } from '../lib/app-design';

export function PreviewHeader({ title, onBack, backLabel = 'Вернуться на главный экран примера' }: { title: string; onBack: () => void; backLabel?: string }) {
  return <header className="preview-page-header">
    <h3 style={PREVIEW_TEXT.large}>{title}</h3>
    <button className="preview-back" aria-label={backLabel} onClick={onBack}>←</button>
  </header>;
}

// Presentation only: navigation works, settings and form fields are not editable.
export function SettingsPreview({ onBack, dark }: { onBack: () => void; dark: boolean }) {
  const rows = [
    ['Группы', 'Названия и цвета для сортировки'],
    ['Шаблоны встреч', 'Быстрое создание планов'],
    ['Уведомления', 'Полный экран, вибрация и точное время'],
    ['Тема', dark ? 'Тёмная' : 'Светлая'],
    ['О приложении', 'Версия и информация'],
  ];
  return <section className="preview-page" aria-label="Экран настроек — демонстрация">
    <PreviewHeader title="Настройки" onBack={onBack} />
    <div className="preview-settings-list">{rows.map(([title, detail]) => <div className="preview-settings-row" key={title}>
      <div><h4 style={PREVIEW_TEXT.mediumStrong}>{title}</h4><p style={PREVIEW_TEXT.small}>{detail}</p></div><span aria-hidden="true">›</span>
    </div>)}</div>
  </section>;
}

function Field({ label, example, numeric = false, minutes = false }: { label: string; example: string; numeric?: boolean; minutes?: boolean }) {
  return <div className="preview-form-field">
    <span className="preview-field-label" style={PREVIEW_TEXT.mediumStrong}>{label}</span>
    <div className={'preview-input ' + (label === 'КОММЕНТАРИЙ' ? 'preview-input-comment' : '')}>
      <span style={numeric ? PREVIEW_TEXT.large : PREVIEW_TEXT.medium}>{example}</span>
      {minutes && <span style={PREVIEW_TEXT.small}>мин</span>}
    </div>
  </div>;
}

export function NewEventPreview({ onBack }: { onBack: () => void }) {
  return <section className="preview-page preview-form-page" aria-label="Новая встреча — демонстрация формы">
    <PreviewHeader title="Новая встреча" onBack={onBack} />
    <div className="preview-form-fields">
      <Field label="МЕСТО" example="Например, Gym One" />
      <Field label="КОММЕНТАРИЙ" example="Например, встреча с Максимом" />
      <div className="preview-form-times">
        <Field label="БЫТЬ К" example="14:30" numeric />
        <Field label="В ДОРОГЕ" example="30" numeric minutes />
        <Field label="НА СБОРЫ" example="30" numeric minutes />
      </div>
      <div className="preview-form-field"><span className="preview-field-label" style={PREVIEW_TEXT.mediumStrong}>ДАТА</span>
        <div className="preview-choice-frame preview-date-choices" style={PREVIEW_TEXT.medium}>
          <span className="selected" style={PREVIEW_TEXT.mediumStrong}>Сегодня</span><span>Завтра</span><span>Другой день</span>
        </div>
      </div>
      <div className="preview-form-field"><span className="preview-field-label" style={PREVIEW_TEXT.mediumStrong}>ГРУППА</span>
        <div className="preview-choice-frame preview-group-choices" style={PREVIEW_TEXT.medium}>
          <span className="selected" style={PREVIEW_TEXT.mediumStrong}><i className="chip-dot chip-dot-empty" />Без группы</span>
          <span><i className="chip-dot" />Личное</span><span><i className="chip-dot chip-dot-work" />Работа</span>
        </div>
      </div>
    </div>
    <div className="preview-add-static" style={PREVIEW_TEXT.mediumStrong}>Добавить</div>
  </section>;
}
