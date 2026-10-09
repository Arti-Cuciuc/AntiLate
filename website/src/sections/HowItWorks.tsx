import { useState } from 'react';
import { Arrow } from '../components/Icons';

const steps = [
  { time: '08:35', title: 'Начните собираться', description: 'Первый сигнал — за 20 минут до выхода. Если нужно, повторное напоминание прозвучит на середине сборов.', status: 'Пора собирать вещи', value: '20 мин', label: 'до выхода', dot: '#FACC15' },
  { time: '08:55', title: 'Выходите вовремя', description: 'Ещё один сигнал: пора в дорогу. Возьмите вещи и нажмите «Я вышел» — на путь заложено 20 минут.', status: 'Пора выходить', value: '20 мин', label: 'на дорогу', dot: '#EF4444' },
  { time: '09:15', title: 'Начало встречи', description: 'Это время, которое вы указали. Начало сборов и выход AntiLate рассчитает автоматически.', status: 'Встреча за кофе', value: '09:15', label: 'быть на месте', dot: '#817A73' },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const stage = steps[active];
  return <section id="how-it-works" className="section-spacing page-container" aria-labelledby="how-title">
    <div className="section-heading"><p className="section-index">01 / Меньше считать в голове</p><h2 id="how-title">У встречи есть время.<br /><span className="text-muted">У вас — понятный план.</span></h2></div>
    <div className="timeline-context"><p>Например: встреча в <strong>09:15</strong>, сборы — 20 минут, дорога — 20 минут.</p><span>Выберите этап, чтобы увидеть подсказку ↓</span></div>
    <div className="timeline-grid" role="group" aria-label="Этапы плана встречи">
      {steps.map((step, index) => <button key={step.title} className={`timeline-step ${index === active ? 'active' : ''}`} onClick={() => setActive(index)} aria-pressed={active === index} aria-controls="plan-example">
        <span className="timeline-top"><span>0{index + 1}</span><span className="timeline-line" /><span className="timeline-node" /></span>
        <span className="timeline-time">{step.time}</span><span className="timeline-title">{step.title}</span><span className="timeline-description">{step.description}</span>
        <span className="timeline-select">{index === active ? 'Выбранный этап' : 'Показать этап'}<Arrow /></span>
      </button>)}
    </div>
    <div id="plan-example" className="live-example" aria-live="polite" key={active}><div className="flex items-center gap-3"><span className="status-dot" style={{ backgroundColor: stage.dot }} /><span>{stage.status}</span></div><div><strong>{stage.value}</strong><span>{stage.label}</span></div><span className="example-label">{active === 2 ? 'Время встречи' : `Подсказка в ${stage.time}`}</span></div>
  </section>;
}
