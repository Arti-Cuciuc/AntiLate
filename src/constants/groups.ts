import type { Group } from '../types/group';

export const MAX_GROUPS = 8;
export const ALL_GROUPS_FILTER_ID = '__all_groups__';
export const UNGROUPED_FILTER_ID = '__ungrouped__';

export type GroupColorOption = {
  color: string;
  name: string;
};

export const GROUP_COLOR_OPTIONS = [
  { color: '#38BDF8', name: 'Ледяной голубой' },
  { color: '#0EA5E9', name: 'Небесный' },
  { color: '#0284C7', name: 'Океанский' },
  { color: '#2563EB', name: 'Королевский синий' },
  { color: '#4F46E5', name: 'Индиго' },
  { color: '#34D399', name: 'Мятный' },
  { color: '#10B981', name: 'Изумрудный' },
  { color: '#16A34A', name: 'Лесной' },
  { color: '#84CC16', name: 'Оливковый' },
  { color: '#A3E635', name: 'Лаймовый' },
  { color: '#FDE68A', name: 'Кремовый' },
  { color: '#F59E0B', name: 'Янтарный' },
  { color: '#F97316', name: 'Оранжевый' },
  { color: '#FB7185', name: 'Коралловый' },
  { color: '#EF4444', name: 'Красный' },
  { color: '#E11D48', name: 'Розовый' },
  { color: '#9F1239', name: 'Бордовый' },
  { color: '#8B5CF6', name: 'Фиолетовый' },
  { color: '#7E22CE', name: 'Пурпурный' },
  { color: '#0F172A', name: 'Полуночный' },
] as const satisfies readonly GroupColorOption[];

export const GROUP_STARTING_COLOR_OPTIONS = [
  GROUP_COLOR_OPTIONS[0],
  GROUP_COLOR_OPTIONS[4],
  GROUP_COLOR_OPTIONS[5],
  GROUP_COLOR_OPTIONS[9],
  GROUP_COLOR_OPTIONS[10],
  GROUP_COLOR_OPTIONS[14],
  GROUP_COLOR_OPTIONS[15],
  GROUP_COLOR_OPTIONS[19],
] as const;

export const UNGROUPED_GROUP: Group = {
  id: UNGROUPED_FILTER_ID,
  name: 'Без группы',
  color: '#FFFDFC',
};
